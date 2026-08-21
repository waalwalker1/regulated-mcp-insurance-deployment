import { randomUUID, createHash } from "node:crypto";
import type {
  FunnelSession,
  SupportedCountry,
  PropertyType,
  OccupancyType,
  ConstructionYearBand,
  FloorAreaBand,
  CoverageTier,
  DeductibleOption,
  GeneratedQuote,
  CorrectionInput,
} from "@northstar/domain";
import { DomainError, FunnelStateMachine } from "@northstar/domain";
import type { SessionStore } from "@northstar/persistence";
import { createSessionStore } from "@northstar/persistence";
import { AuditStore, globalAuditStore } from "@northstar/audit";
import { sanitizeTextInput } from "@northstar/security";
import {
  computeCanonicalQuoteFingerprint,
  getRuleSet,
  defaultRulePolicyProvider,
  createPricingAdapter,
  type RulePolicyProvider,
  type PricingPort,
} from "@northstar/rules";

export interface QuoteCalculationOptions {
  idempotencyKey?: string;
}

export class FunnelEngine {
  constructor(
    public store: SessionStore = createSessionStore(),
    public auditStore: AuditStore = globalAuditStore,
    public rulePolicy: RulePolicyProvider = defaultRulePolicyProvider,
    public pricingPort: PricingPort = createPricingAdapter(),
  ) {}

  /**
   * 1. Start a new insurance quotation funnel session
   */
  async startSession(
    correlationId: string = randomUUID(),
  ): Promise<FunnelSession> {
    const sessionId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3600 * 1000).toISOString();

    const session: FunnelSession = {
      sessionId,
      correlationId,
      step: "COLLECTING_PROPERTY",
      partialInput: {},
      historicalQuotes: [],
      correctionCount: 0,
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt,
    };

    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId,
      eventType: "session.started",
      actor: "user",
      metadata: { channel: "mcp-funnel", initialStep: session.step },
    });

    return session;
  }

  /**
   * 2. Submit Property Basics
   */
  async submitPropertyBasics(
    sessionId: string,
    params: {
      country: SupportedCountry;
      postcode: string;
      propertyType: PropertyType;
      occupancyType: OccupancyType;
    },
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.assertStep(session, ["COLLECTING_PROPERTY", "INIT"]);

    const sanitization = sanitizeTextInput(params.postcode);
    if (!sanitization.isSafe) {
      await this.auditStore.recordEvent({
        sessionId,
        correlationId: session.correlationId,
        eventType: "security.tampering_blocked",
        actor: "server",
        metadata: { threats: sanitization.detectedThreats, field: "postcode" },
      });
      throw new DomainError(
        "TAMPERING_DETECTED",
        "Malicious or invalid content detected in postcode.",
      );
    }

    session.partialInput.country = params.country;
    session.partialInput.postcode = sanitization.sanitizedValue;
    session.partialInput.propertyType = params.propertyType;
    session.partialInput.occupancyType = params.occupancyType;

    FunnelStateMachine.transition(session, "COLLECTING_RISK");
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "field.received",
      actor: "user",
      metadata: {
        step: "COLLECTING_PROPERTY",
        country: params.country,
        postcode: sanitization.sanitizedValue,
        propertyType: params.propertyType,
        occupancyType: params.occupancyType,
      },
    });

    return session;
  }

  /**
   * 3. Submit Risk & Structural Factors
   */
  async submitRiskFactors(
    sessionId: string,
    params: {
      constructionYearBand: ConstructionYearBand;
      floorAreaBand: FloorAreaBand;
      isPrimaryResidence: boolean;
      claimsCount5Years: number;
    },
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.assertStep(session, [
      "COLLECTING_RISK",
      "COLLECTING_PROPERTY",
    ]);

    session.partialInput.constructionYearBand = params.constructionYearBand;
    session.partialInput.floorAreaBand = params.floorAreaBand;
    session.partialInput.isPrimaryResidence = params.isPrimaryResidence;
    session.partialInput.claimsCount5Years = params.claimsCount5Years;

    FunnelStateMachine.transition(session, "EVALUATING_ELIGIBILITY");
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "field.received",
      actor: "user",
      metadata: {
        step: "COLLECTING_RISK",
        constructionYearBand: params.constructionYearBand,
        floorAreaBand: params.floorAreaBand,
        claimsCount5Years: params.claimsCount5Years,
      },
    });

    return session;
  }

  /**
   * 4. Evaluate Underwriting Eligibility (via PricingPort)
   */
  async evaluateEligibility(sessionId: string): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.assertStep(session, [
      "EVALUATING_ELIGIBILITY",
      "COLLECTING_RISK",
      "COLLECTING_PROPERTY",
    ]);

    const input = FunnelStateMachine.validateInputs(session);
    const eligibility = await this.pricingPort.evaluate(input);
    session.eligibilityResult = eligibility;

    if (eligibility.isEligible) {
      FunnelStateMachine.transition(session, "COLLECTING_COVERAGE");
    } else {
      FunnelStateMachine.transition(session, "REFERRED");
    }

    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "eligibility.evaluated",
      actor: "server",
      ruleVersion: eligibility.ruleVersion,
      metadata: {
        status: eligibility.status,
        isEligible: eligibility.isEligible,
        reasonCodes: eligibility.reasonCodes,
      },
    });

    return session;
  }

  /**
   * 5. Select Coverage & Deductibles
   */
  async selectCoverage(
    sessionId: string,
    params: {
      coverageTier?: CoverageTier;
      deductible?: DeductibleOption;
      contactEmail?: string;
    },
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.assertStep(session, [
      "COLLECTING_COVERAGE",
      "EVALUATING_ELIGIBILITY",
    ]);

    if (params.contactEmail) {
      const sanitization = sanitizeTextInput(params.contactEmail);
      if (!sanitization.isSafe) {
        throw new DomainError(
          "TAMPERING_DETECTED",
          "Invalid contact email format.",
        );
      }
    }

    session.partialInput.coverageTier = params.coverageTier || "comfort";
    session.partialInput.deductible = params.deductible || 300;
    session.partialInput.contactEmail = params.contactEmail;

    FunnelStateMachine.transition(session, "AWAITING_CONFIRMATION");
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "field.received",
      actor: "user",
      metadata: {
        coverageTier: session.partialInput.coverageTier,
        deductible: session.partialInput.deductible,
      },
    });

    return session;
  }

  /**
   * 6. User Confirms Declared Parameters
   */
  async confirmParameters(
    sessionId: string,
    confirmed: boolean,
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.confirmParameters(session, confirmed);
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "parameters.confirmed",
      actor: "user",
      metadata: { confirmed: true, confirmedAt: session.parametersConfirmedAt },
    });

    return session;
  }

  /**
   * 7. Submit Mandatory Consent
   */
  async submitConsent(
    sessionId: string,
    consentVersion: string = "consent_v1_2026",
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.grantConsent(session, consentVersion);
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "consent.granted",
      actor: "user",
      metadata: {
        consentVersion,
        hasConsented: true,
        grantedAt: session.consentGrantedAt,
      },
    });

    return session;
  }

  /**
   * 8. Calculate and Issue Deterministic Quote (with Strict Idempotency Guard)
   */
  async calculateQuote(
    sessionId: string,
    options?: QuoteCalculationOptions,
  ): Promise<GeneratedQuote> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.assertReadyToQuote(session);

    const input = FunnelStateMachine.validateInputs(session);
    const activeRuleVersion = this.rulePolicy.getActiveRuleVersion({
      country: input.country,
    });
    const ruleSet = getRuleSet(activeRuleVersion);

    // Compute request fingerprint for idempotency
    const requestFingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          sessionId,
          input,
          ruleVersion: ruleSet.version,
          consentGrantedAt: session.consentGrantedAt,
          parametersConfirmedAt: session.parametersConfirmedAt,
        }),
      )
      .digest("hex");

    const effectiveIdempotencyKey =
      options?.idempotencyKey ||
      `quote_calc_${session.sessionId}_${session.version}`;

    // Check Idempotency Record
    const existingRecord = await this.store.getIdempotencyRecord(
      effectiveIdempotencyKey,
    );
    if (existingRecord) {
      if (existingRecord.operation !== "calculateQuote") {
        throw new DomainError(
          "IDEMPOTENCY_KEY_CONFLICT",
          `The supplied idempotency key '${effectiveIdempotencyKey}' was already used for a different operation ('${existingRecord.operation}').`,
        );
      }
      if (existingRecord.requestFingerprint !== requestFingerprint) {
        throw new DomainError(
          "IDEMPOTENCY_KEY_CONFLICT",
          `The supplied idempotency key '${effectiveIdempotencyKey}' was already used for a different request payload.`,
        );
      }
      await this.auditStore.recordEvent({
        sessionId,
        correlationId: session.correlationId,
        eventType: "request.replayed",
        actor: "user",
        metadata: {
          idempotencyKey: effectiveIdempotencyKey,
          quoteId: (existingRecord.responsePayload as GeneratedQuote).quoteId,
        },
      });
      return existingRecord.responsePayload as unknown as GeneratedQuote;
    }

    const eligibility = await this.pricingPort.evaluate(input);
    if (!eligibility.isEligible) {
      FunnelStateMachine.transition(session, "REFERRED");
      await this.store.saveSession(session);
      throw new DomainError("INELIGIBLE_RISK", eligibility.explanation, {
        eligibility,
      });
    }

    const pricing = await this.pricingPort.calculate(input);
    const quoteHash = computeCanonicalQuoteFingerprint({
      ruleVersion: ruleSet.version,
      input,
      pricing,
      eligibility,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const quote: GeneratedQuote = {
      quoteId: randomUUID(),
      sessionId: session.sessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ruleVersion: ruleSet.version,
      quoteHash,
      input,
      eligibility,
      pricing,
      mandatoryDisclosure: ruleSet.mandatoryDisclosure,
      isBinding: false,
      status: "active",
    };

    session.activeQuote = quote;
    session.lastQuoteFingerprint = quoteHash;
    session.lastIdempotencyKey = effectiveIdempotencyKey;
    FunnelStateMachine.transition(session, "QUOTED");

    await this.store.saveSession(session);
    await this.store.saveQuote(quote);

    // Save Idempotency Record
    await this.store.saveIdempotencyRecord({
      idempotencyKey: effectiveIdempotencyKey,
      sessionId: session.sessionId,
      operation: "calculateQuote",
      requestFingerprint,
      responsePayload: quote as unknown as Record<string, unknown>,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "quote.calculated",
      actor: "server",
      ruleVersion: ruleSet.version,
      metadata: {
        quoteId: quote.quoteId,
        quoteHash: quote.quoteHash,
        totalAnnualPremium: pricing.totalAnnualPremium,
        netAnnualPremium: pricing.netAnnualPremium,
      },
    });

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "quote.presented",
      actor: "server",
      ruleVersion: ruleSet.version,
      metadata: {
        quoteId: quote.quoteId,
        totalAnnualPremium: pricing.totalAnnualPremium,
        totalMonthlyPremium: pricing.totalMonthlyPremium,
      },
    });

    return quote;
  }

  /**
   * 9. Adjust Active Quote (with Strict Idempotency Guard)
   */
  async adjustQuote(
    sessionId: string,
    params: {
      coverageTier?: CoverageTier;
      deductible?: DeductibleOption;
      idempotencyKey?: string;
    },
  ): Promise<GeneratedQuote> {
    const session = await this.requireSession(sessionId);

    if (!session.activeQuote) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "No active quote to adjust.",
      );
    }

    const effectiveKey =
      params.idempotencyKey ||
      `adjust_${sessionId}_tier_${params.coverageTier}_ded_${params.deductible}`;
    const newTier = params.coverageTier || session.partialInput.coverageTier;
    const newDeductible = params.deductible || session.partialInput.deductible;

    const requestFingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          sessionId,
          coverageTier: newTier,
          deductible: newDeductible,
          activeQuoteId: session.activeQuote.quoteId,
        }),
      )
      .digest("hex");

    const existingRecord = await this.store.getIdempotencyRecord(effectiveKey);
    if (existingRecord) {
      if (existingRecord.operation !== "adjustQuote") {
        throw new DomainError(
          "IDEMPOTENCY_KEY_CONFLICT",
          `The supplied idempotency key '${effectiveKey}' was already used for a different operation ('${existingRecord.operation}').`,
        );
      }
      if (existingRecord.requestFingerprint !== requestFingerprint) {
        throw new DomainError(
          "IDEMPOTENCY_KEY_CONFLICT",
          `The supplied idempotency key '${effectiveKey}' was already used for a different request payload.`,
        );
      }
      await this.auditStore.recordEvent({
        sessionId,
        correlationId: session.correlationId,
        eventType: "request.replayed",
        actor: "user",
        metadata: {
          idempotencyKey: effectiveKey,
          quoteId: (existingRecord.responsePayload as GeneratedQuote).quoteId,
        },
      });
      return existingRecord.responsePayload as unknown as GeneratedQuote;
    }

    if (params.coverageTier)
      session.partialInput.coverageTier = params.coverageTier;
    if (params.deductible) session.partialInput.deductible = params.deductible;

    const input = FunnelStateMachine.validateInputs(session);
    const ruleSet = getRuleSet(session.activeQuote.ruleVersion);
    const pricing = await this.pricingPort.calculate(input);
    const quoteHash = computeCanonicalQuoteFingerprint({
      ruleVersion: ruleSet.version,
      input,
      pricing,
      eligibility: session.activeQuote.eligibility,
    });

    session.historicalQuotes.push(session.activeQuote);

    const adjustedQuote: GeneratedQuote = {
      ...session.activeQuote,
      quoteId: randomUUID(),
      createdAt: new Date().toISOString(),
      quoteHash,
      input,
      pricing,
      status: "adjusted",
    };

    session.activeQuote = adjustedQuote;
    session.lastQuoteFingerprint = quoteHash;
    session.version = (session.version ?? 0) + 1;
    session.updatedAt = new Date().toISOString();

    await this.store.saveSession(session);
    await this.store.saveQuote(adjustedQuote);

    await this.store.saveIdempotencyRecord({
      idempotencyKey: effectiveKey,
      sessionId,
      operation: "adjustQuote",
      requestFingerprint,
      responsePayload: adjustedQuote as unknown as Record<string, unknown>,
      createdAt: new Date().toISOString(),
      expiresAt: adjustedQuote.expiresAt,
    });

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "quote.adjusted",
      actor: "user",
      ruleVersion: ruleSet.version,
      metadata: {
        previousQuoteId:
          session.historicalQuotes[session.historicalQuotes.length - 1]
            ?.quoteId,
        adjustedQuoteId: adjustedQuote.quoteId,
        newAnnualPremium: pricing.totalAnnualPremium,
        deductible: input.deductible,
        coverageTier: input.coverageTier,
      },
    });

    return adjustedQuote;
  }

  /**
   * 10. Direct Strict Field Correction
   */
  async correctField(
    sessionId: string,
    delta: CorrectionInput,
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.applyCorrection(session, delta);
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: "field.corrected",
      actor: "user",
      metadata: {
        delta,
        correctionCount: session.correctionCount,
        newStep: session.step,
      },
    });

    return session;
  }

  /**
   * 11. Retrieve Session State
   */
  async getSession(sessionId: string): Promise<FunnelSession | null> {
    return this.store.getSession(sessionId);
  }

  /**
   * 12. Export Audit Trail
   */
  async exportAuditTrail(sessionId: string) {
    const session = await this.requireSession(sessionId);
    const events = await this.auditStore.getEventsBySession(sessionId);
    const integrity = await this.auditStore.verifyChainIntegrity(sessionId);

    return {
      sessionId,
      correlationId: session.correlationId,
      chainIntegrity: integrity,
      eventCount: events.length,
      events,
    };
  }

  private async requireSession(sessionId: string): Promise<FunnelSession> {
    const session = await this.store.getSession(sessionId);
    if (!session) {
      throw new DomainError(
        "SESSION_NOT_FOUND",
        `Session '${sessionId}' not found or expired.`,
      );
    }
    return session;
  }
}
