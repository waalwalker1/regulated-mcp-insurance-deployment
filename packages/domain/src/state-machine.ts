import { DomainError } from './errors.js';
import type { FunnelSession, FunnelStep } from './types.js';
import { QuoteInputSchema, type PartialQuoteInput, type QuoteInput } from './schemas.js';

export const ALLOWED_TRANSITIONS: Record<FunnelStep, FunnelStep[]> = {
  INIT: ['COLLECTING_PROPERTY'],
  COLLECTING_PROPERTY: ['COLLECTING_RISK', 'COLLECTING_PROPERTY'],
  COLLECTING_RISK: ['EVALUATING_ELIGIBILITY', 'COLLECTING_PROPERTY', 'COLLECTING_RISK'],
  EVALUATING_ELIGIBILITY: ['COLLECTING_COVERAGE', 'REFERRED'],
  COLLECTING_COVERAGE: ['AWAITING_CONFIRMATION', 'COLLECTING_RISK', 'COLLECTING_PROPERTY'],
  AWAITING_CONFIRMATION: ['AWAITING_CONSENT', 'COLLECTING_PROPERTY', 'COLLECTING_RISK', 'COLLECTING_COVERAGE'],
  AWAITING_CONSENT: ['QUOTED', 'AWAITING_CONFIRMATION', 'COLLECTING_PROPERTY'],
  QUOTED: ['COLLECTING_COVERAGE', 'COLLECTING_PROPERTY', 'COLLECTING_RISK', 'COMPLETED'],
  REFERRED: ['COLLECTING_PROPERTY', 'COLLECTING_RISK'],
  COMPLETED: []
};

export class FunnelStateMachine {
  /**
   * Validate whether transitioning from currentStep to nextStep is structurally allowed
   */
  static canTransition(from: FunnelStep, to: FunnelStep): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Apply a state transition to a session, checking invariants
   */
  static transition(session: FunnelSession, nextStep: FunnelStep): void {
    if (!this.canTransition(session.step, nextStep)) {
      throw new DomainError(
        'INVALID_STATE_TRANSITION',
        `Cannot transition funnel session from step '${session.step}' to '${nextStep}'.`
      );
    }
    session.step = nextStep;
    session.updatedAt = new Date().toISOString();
  }

  /**
   * Apply partial input updates. If an existing quote was already generated or confirmed and critical fields
   * changed from a previously set value, invalidate the active quote and require re-confirmation/re-consent.
   */
  static updateInput(session: FunnelSession, delta: PartialQuoteInput): void {
    const previous = { ...session.partialInput };
    const merged = { ...session.partialInput, ...delta };

    // A change is a correction only if a previously defined field is altered to a new value
    const isCriticalCorrection = (
      (delta.country !== undefined && previous.country !== undefined && delta.country !== previous.country) ||
      (delta.postcode !== undefined && previous.postcode !== undefined && delta.postcode !== previous.postcode) ||
      (delta.propertyType !== undefined && previous.propertyType !== undefined && delta.propertyType !== previous.propertyType) ||
      (delta.occupancyType !== undefined && previous.occupancyType !== undefined && delta.occupancyType !== previous.occupancyType) ||
      (delta.constructionYearBand !== undefined && previous.constructionYearBand !== undefined && delta.constructionYearBand !== previous.constructionYearBand) ||
      (delta.floorAreaBand !== undefined && previous.floorAreaBand !== undefined && delta.floorAreaBand !== previous.floorAreaBand) ||
      (delta.claimsCount5Years !== undefined && previous.claimsCount5Years !== undefined && delta.claimsCount5Years !== previous.claimsCount5Years)
    );

    if (isCriticalCorrection) {
      session.correctionCount += 1;
      if (session.activeQuote) {
        session.historicalQuotes.push(session.activeQuote);
        session.activeQuote = undefined;
      }
      // Revert consent since quote inputs changed
      session.consentDeclaration = undefined;
      session.eligibilityResult = undefined;
      session.step = 'COLLECTING_PROPERTY';
    }

    session.partialInput = merged;
    session.updatedAt = new Date().toISOString();
  }

  /**
   * Attempt to finalize inputs into a validated QuoteInput
   */
  static validateInputs(session: FunnelSession): QuoteInput {
    const parseResult = QuoteInputSchema.safeParse(session.partialInput);
    if (!parseResult.success) {
      throw new DomainError(
        'INVALID_INPUT',
        'Incomplete or invalid quote parameters.',
        { errors: parseResult.error.flatten() }
      );
    }
    session.validatedInput = parseResult.data;
    return parseResult.data;
  }
}
