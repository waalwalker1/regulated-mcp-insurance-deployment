import { randomUUID } from 'node:crypto';
import type {
  FunnelSession,
  PartialQuoteInput,
  SupportedCountry,
  PropertyType,
  OccupancyType,
  ConstructionYearBand,
  FloorAreaBand,
  CoverageTier,
  DeductibleOption,
  GeneratedQuote
} from '@northstar/domain';
import { DomainError, FunnelStateMachine } from '@northstar/domain';
import type { SessionStore } from '@northstar/persistence';
import { createSessionStore } from '@northstar/persistence';
import { AuditStore, globalAuditStore } from '@northstar/audit';
import { sanitizeTextInput } from '@northstar/security';
import {
  evaluateEligibility,
  calculatePricing,
  computeQuoteHash,
  getRuleSet,
  DEFAULT_RULE_VERSION
} from '@northstar/rules';

export class FunnelEngine {
  constructor(
    public store: SessionStore = createSessionStore(),
    public auditStore: AuditStore = globalAuditStore
  ) {}

  /**
   * 1. Start a new insurance quotation funnel session
   */
  async startSession(correlationId: string = randomUUID()): Promise<FunnelSession> {
    const sessionId = randomUUID();
    const session = await this.store.createSession(sessionId, correlationId);
    session.step = 'COLLECTING_PROPERTY';
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId,
      eventType: 'session.started',
      actor: 'user',
      metadata: { channel: 'mcp-funnel', initialStep: session.step }
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
    }
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);

    const sanitization = sanitizeTextInput(params.postcode);
    if (!sanitization.isSafe) {
      await this.auditStore.recordEvent({
        sessionId,
        correlationId: session.correlationId,
        eventType: 'security.tampering_blocked',
        actor: 'server',
        metadata: { threats: sanitization.detectedThreats, field: 'postcode' }
      });
      throw new DomainError('TAMPERING_DETECTED', 'Malicious or invalid content detected in postcode.');
    }

    FunnelStateMachine.updateInput(session, {
      country: params.country,
      postcode: sanitization.sanitizedValue,
      propertyType: params.propertyType,
      occupancyType: params.occupancyType
    });

    session.step = 'COLLECTING_RISK';
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'field.received',
      actor: 'user',
      metadata: {
        step: 'COLLECTING_PROPERTY',
        country: params.country,
        postcode: sanitization.sanitizedValue,
        propertyType: params.propertyType,
        occupancyType: params.occupancyType
      }
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
    }
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);

    FunnelStateMachine.updateInput(session, {
      constructionYearBand: params.constructionYearBand,
      floorAreaBand: params.floorAreaBand,
      isPrimaryResidence: params.isPrimaryResidence,
      claimsCount5Years: params.claimsCount5Years
    });

    session.step = 'EVALUATING_ELIGIBILITY';
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'field.received',
      actor: 'user',
      metadata: {
        step: 'COLLECTING_RISK',
        constructionYearBand: params.constructionYearBand,
        floorAreaBand: params.floorAreaBand,
        claimsCount5Years: params.claimsCount5Years
      }
    });

    return session;
  }

  /**
   * 4. Evaluate Underwriting Eligibility
   */
  async evaluateEligibility(sessionId: string, ruleVersion: string = DEFAULT_RULE_VERSION): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    const ruleSet = getRuleSet(ruleVersion);

    // Validate partial inputs so far
    const input = FunnelStateMachine.validateInputs(session);
    const eligibility = evaluateEligibility(input, ruleSet);
    session.eligibilityResult = eligibility;

    if (eligibility.isEligible) {
      session.step = 'COLLECTING_COVERAGE';
    } else {
      session.step = 'REFERRED';
    }

    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: eligibility.isEligible ? 'eligibility.evaluated' : 'quote.referred',
      actor: 'server',
      ruleVersion: ruleSet.version,
      metadata: {
        status: eligibility.status,
        isEligible: eligibility.isEligible,
        reasonCodes: eligibility.reasonCodes
      }
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
    }
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);

    if (params.contactEmail) {
      const sanitization = sanitizeTextInput(params.contactEmail);
      if (!sanitization.isSafe) {
        throw new DomainError('TAMPERING_DETECTED', 'Invalid email format.');
      }
    }

    FunnelStateMachine.updateInput(session, {
      coverageTier: params.coverageTier || 'comfort',
      deductible: params.deductible || 300,
      contactEmail: params.contactEmail
    });

    session.step = 'AWAITING_CONFIRMATION';
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'confirmation.requested',
      actor: 'server',
      metadata: {
        coverageTier: session.partialInput.coverageTier,
        deductible: session.partialInput.deductible
      }
    });

    return session;
  }

  /**
   * 6. User Confirms Declared Parameters
   */
  async confirmParameters(sessionId: string, confirmed: boolean): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);

    if (!confirmed) {
      session.step = 'COLLECTING_PROPERTY';
      await this.store.saveSession(session);
      return session;
    }

    session.step = 'AWAITING_CONSENT';
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'confirmation.granted',
      actor: 'user',
      metadata: { confirmed: true }
    });

    return session;
  }

  /**
   * 7. Submit Mandatory Consent
   */
  async submitConsent(
    sessionId: string,
    consentVersion: string = 'consent_v1_2026'
  ): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);

    session.consentDeclaration = {
      hasConsentedToDataProcessing: true,
      consentVersion,
      consentTimestamp: new Date().toISOString()
    };

    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'consent.granted',
      actor: 'user',
      metadata: {
        consentVersion,
        hasConsented: true
      }
    });

    return session;
  }

  /**
   * 8. Calculate and Issue Deterministic Quote
   */
  async calculateQuote(sessionId: string, ruleVersion?: string): Promise<GeneratedQuote> {
    const session = await this.requireSession(sessionId);

    // Invariant: Consent must be present
    if (!session.consentDeclaration?.hasConsentedToDataProcessing) {
      throw new DomainError(
        'CONSENT_REQUIRED',
        'Cannot calculate or present quote without verified, explicit user consent.'
      );
    }

    const input = FunnelStateMachine.validateInputs(session);
    const ruleSet = getRuleSet(ruleVersion || session.activeQuote?.ruleVersion);
    const eligibility = evaluateEligibility(input, ruleSet);

    if (!eligibility.isEligible) {
      session.step = 'REFERRED';
      await this.store.saveSession(session);
      throw new DomainError('INELIGIBLE_RISK', eligibility.explanation, { eligibility });
    }

    const pricing = calculatePricing(input, ruleSet);
    const quoteHash = computeQuoteHash(ruleSet.version, input, pricing);
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
      status: 'active'
    };

    session.activeQuote = quote;
    session.step = 'QUOTED';
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'quote.calculated',
      actor: 'server',
      ruleVersion: ruleSet.version,
      metadata: {
        quoteId: quote.quoteId,
        quoteHash: quote.quoteHash,
        totalAnnualPremium: pricing.totalAnnualPremium,
        netAnnualPremium: pricing.netAnnualPremium
      }
    });

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'quote.presented',
      actor: 'server',
      ruleVersion: ruleSet.version,
      metadata: {
        quoteId: quote.quoteId,
        totalAnnualPremium: pricing.totalAnnualPremium,
        totalMonthlyPremium: pricing.totalMonthlyPremium
      }
    });

    return quote;
  }

  /**
   * 9. Adjust Active Quote (e.g. Change Deductible or Tier without restarting flow)
   */
  async adjustQuote(
    sessionId: string,
    params: {
      coverageTier?: CoverageTier;
      deductible?: DeductibleOption;
    }
  ): Promise<GeneratedQuote> {
    const session = await this.requireSession(sessionId);

    if (!session.activeQuote) {
      throw new DomainError('INVALID_STATE_TRANSITION', 'No active quote to adjust.');
    }

    if (params.coverageTier) session.partialInput.coverageTier = params.coverageTier;
    if (params.deductible) session.partialInput.deductible = params.deductible;

    const input = FunnelStateMachine.validateInputs(session);
    const ruleSet = getRuleSet(session.activeQuote.ruleVersion);
    const pricing = calculatePricing(input, ruleSet);
    const quoteHash = computeQuoteHash(ruleSet.version, input, pricing);

    session.historicalQuotes.push(session.activeQuote);

    const adjustedQuote: GeneratedQuote = {
      ...session.activeQuote,
      quoteId: randomUUID(),
      createdAt: new Date().toISOString(),
      quoteHash,
      input,
      pricing,
      status: 'adjusted'
    };

    session.activeQuote = adjustedQuote;
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'quote.adjusted',
      actor: 'user',
      ruleVersion: ruleSet.version,
      metadata: {
        previousQuoteId: session.historicalQuotes[session.historicalQuotes.length - 1]?.quoteId,
        adjustedQuoteId: adjustedQuote.quoteId,
        newAnnualPremium: pricing.totalAnnualPremium,
        deductible: input.deductible,
        coverageTier: input.coverageTier
      }
    });

    return adjustedQuote;
  }

  /**
   * 10. Direct Field Correction
   */
  async correctField(sessionId: string, delta: PartialQuoteInput): Promise<FunnelSession> {
    const session = await this.requireSession(sessionId);
    FunnelStateMachine.updateInput(session, delta);
    await this.store.saveSession(session);

    await this.auditStore.recordEvent({
      sessionId,
      correlationId: session.correlationId,
      eventType: 'field.corrected',
      actor: 'user',
      metadata: { delta, correctionCount: session.correctionCount }
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
      events
    };
  }

  private async requireSession(sessionId: string): Promise<FunnelSession> {
    const session = await this.store.getSession(sessionId);
    if (!session) {
      throw new DomainError('SESSION_NOT_FOUND', `Session '${sessionId}' not found or expired.`);
    }
    return session;
  }
}
