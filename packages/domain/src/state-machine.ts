import { DomainError } from "./errors.js";
import type { FunnelSession, FunnelStep } from "./types.js";
import {
  QuoteInputSchema,
  CorrectionInputSchema,
  type PartialQuoteInput,
  type CorrectionInput,
  type QuoteInput,
} from "./schemas.js";

export const ALLOWED_TRANSITIONS: Record<FunnelStep, FunnelStep[]> = {
  INIT: ["COLLECTING_PROPERTY"],
  COLLECTING_PROPERTY: ["COLLECTING_RISK", "COLLECTING_PROPERTY"],
  COLLECTING_RISK: [
    "EVALUATING_ELIGIBILITY",
    "COLLECTING_PROPERTY",
    "COLLECTING_RISK",
  ],
  EVALUATING_ELIGIBILITY: ["COLLECTING_COVERAGE", "REFERRED"],
  COLLECTING_COVERAGE: [
    "AWAITING_CONFIRMATION",
    "COLLECTING_RISK",
    "COLLECTING_PROPERTY",
  ],
  AWAITING_CONFIRMATION: [
    "AWAITING_CONSENT",
    "COLLECTING_PROPERTY",
    "COLLECTING_RISK",
    "COLLECTING_COVERAGE",
  ],
  AWAITING_CONSENT: [
    "READY_TO_QUOTE",
    "AWAITING_CONFIRMATION",
    "COLLECTING_PROPERTY",
  ],
  READY_TO_QUOTE: ["QUOTED", "AWAITING_CONFIRMATION", "COLLECTING_PROPERTY"],
  QUOTED: [
    "COLLECTING_COVERAGE",
    "COLLECTING_PROPERTY",
    "COLLECTING_RISK",
    "COMPLETED",
  ],
  REFERRED: ["COLLECTING_PROPERTY", "COLLECTING_RISK"],
  COMPLETED: [],
};

export const STRUCTURAL_RISK_FIELDS: (keyof QuoteInput)[] = [
  "country",
  "postcode",
  "propertyType",
  "occupancyType",
  "constructionYearBand",
  "floorAreaBand",
  "claimsCount5Years",
  "isPrimaryResidence",
];

export const COVERAGE_FIELDS: (keyof QuoteInput)[] = [
  "coverageTier",
  "deductible",
];

export class FunnelStateMachine {
  /**
   * Validate whether transitioning from currentStep to nextStep is structurally allowed
   */
  static canTransition(from: FunnelStep, to: FunnelStep): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Assert that the session is currently in one of the allowed steps
   */
  static assertStep(
    session: FunnelSession,
    allowed: FunnelStep | FunnelStep[],
  ): void {
    const list = Array.isArray(allowed) ? allowed : [allowed];
    if (!list.includes(session.step)) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        `Operation requires session in state [${list.join(", ")}], but current state is '${session.step}'.`,
      );
    }
  }

  /**
   * Apply a state transition to a session, checking invariants
   */
  static transition(session: FunnelSession, nextStep: FunnelStep): void {
    if (!this.canTransition(session.step, nextStep)) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        `Cannot transition funnel session from step '${session.step}' to '${nextStep}'.`,
      );
    }
    session.step = nextStep;
    session.version = (session.version ?? 0) + 1;
    session.updatedAt = new Date().toISOString();
  }

  /**
   * Enforce parameters confirmation invariant
   */
  static confirmParameters(session: FunnelSession, confirmed: boolean): void {
    this.assertStep(session, ["AWAITING_CONFIRMATION", "AWAITING_CONSENT"]);
    if (!confirmed) {
      throw new DomainError(
        "INVALID_INPUT",
        "Parameters must be confirmed before progressing to consent.",
      );
    }
    session.parametersConfirmedAt = new Date().toISOString();
    this.transition(session, "AWAITING_CONSENT");
  }

  /**
   * Enforce consent granting invariant
   */
  static grantConsent(
    session: FunnelSession,
    consentVersion: string = "consent_v1_2026",
  ): void {
    this.assertStep(session, ["AWAITING_CONSENT", "READY_TO_QUOTE"]);
    if (!session.parametersConfirmedAt) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "Cannot grant consent before parameters have been formally confirmed by the customer.",
      );
    }
    const timestamp = new Date().toISOString();
    session.consentDeclaration = {
      hasConsentedToDataProcessing: true,
      consentVersion,
      consentTimestamp: timestamp,
    };
    session.consentGrantedAt = timestamp;
    this.transition(session, "READY_TO_QUOTE");
  }

  /**
   * Assert all prerequisites for generating a quote are strictly satisfied
   */
  static assertReadyToQuote(session: FunnelSession): void {
    if (
      !session.consentDeclaration?.hasConsentedToDataProcessing ||
      !session.consentGrantedAt
    ) {
      throw new DomainError(
        "CONSENT_REQUIRED",
        "Cannot calculate or present quote without verified, explicit user consent.",
      );
    }
    if (!session.parametersConfirmedAt) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "Cannot calculate quote before parameters are confirmed by the customer.",
      );
    }
    if (!session.eligibilityResult || !session.eligibilityResult.isEligible) {
      throw new DomainError(
        "INELIGIBLE_RISK",
        "Cannot calculate quote for a risk that is not eligible or is referred to manual underwriting.",
      );
    }
    if (session.step !== "READY_TO_QUOTE" && session.step !== "QUOTED") {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        `Session is in step '${session.step}', but must be in 'READY_TO_QUOTE' before issuing a quote.`,
      );
    }
  }

  /**
   * Apply strict correction to previous inputs with centralized dependency invalidation
   */
  static applyCorrection(
    session: FunnelSession,
    rawDelta: CorrectionInput,
  ): void {
    // Validate correction payload against strict schema (disallow unknown fields)
    const parseResult = CorrectionInputSchema.safeParse(rawDelta);
    if (!parseResult.success) {
      throw new DomainError(
        "INVALID_INPUT",
        "Correction payload contained invalid or unknown fields.",
        { errors: parseResult.error.flatten() },
      );
    }
    const delta = parseResult.data;
    const previous = { ...session.partialInput };
    const merged = { ...session.partialInput, ...delta };

    const changedStructuralKeys = STRUCTURAL_RISK_FIELDS.filter(
      (key) =>
        delta[key] !== undefined &&
        previous[key] !== undefined &&
        delta[key] !== previous[key],
    );

    const changedCoverageKeys = COVERAGE_FIELDS.filter(
      (key) =>
        delta[key] !== undefined &&
        previous[key] !== undefined &&
        delta[key] !== previous[key],
    );

    if (changedStructuralKeys.length > 0) {
      // Tier 1 Invalidation: Structural/Risk parameters altered
      session.correctionCount += 1;
      if (session.activeQuote) {
        session.historicalQuotes.push(session.activeQuote);
        session.activeQuote = undefined;
      }
      session.consentDeclaration = undefined;
      session.consentGrantedAt = undefined;
      session.parametersConfirmedAt = undefined;
      session.eligibilityResult = undefined;
      session.step = "COLLECTING_PROPERTY";
    } else if (changedCoverageKeys.length > 0) {
      // Tier 2 Invalidation: Coverage tier or deductible altered
      session.correctionCount += 1;
      if (session.activeQuote) {
        session.historicalQuotes.push(session.activeQuote);
        session.activeQuote = undefined;
      }
      session.consentDeclaration = undefined;
      session.consentGrantedAt = undefined;
      session.parametersConfirmedAt = undefined;
      session.step = "COLLECTING_COVERAGE";
    }

    session.partialInput = merged;
    session.version = (session.version ?? 0) + 1;
    session.updatedAt = new Date().toISOString();
  }

  /**
   * Backward-compatible updateInput wrapper
   */
  static updateInput(session: FunnelSession, delta: PartialQuoteInput): void {
    this.applyCorrection(session, delta);
  }

  /**
   * Finalize inputs into a validated QuoteInput
   */
  static validateInputs(session: FunnelSession): QuoteInput {
    const parseResult = QuoteInputSchema.safeParse(session.partialInput);
    if (!parseResult.success) {
      throw new DomainError(
        "INVALID_INPUT",
        "Incomplete or invalid quote parameters.",
        { errors: parseResult.error.flatten() },
      );
    }
    session.validatedInput = parseResult.data;
    return parseResult.data;
  }
}
