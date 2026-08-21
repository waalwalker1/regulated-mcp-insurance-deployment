import { randomUUID } from 'node:crypto';
import type { QuoteInput, GeneratedQuote, FunnelSession } from '@northstar/domain';
import { DomainError } from '@northstar/domain';
import { getRuleSet } from './registry.js';
import { evaluateEligibility } from './eligibility.js';
import { calculatePricing, computeQuoteHash } from './pricing.js';

export function generateQuote(
  session: FunnelSession,
  input: QuoteInput,
  ruleVersion?: string
): GeneratedQuote {
  // Invariant 1: Consent MUST be explicitly declared
  if (!session.consentDeclaration || !session.consentDeclaration.hasConsentedToDataProcessing) {
    throw new DomainError(
      'CONSENT_REQUIRED',
      'Cannot generate an official indicative quote without explicit, recorded user consent.'
    );
  }

  const ruleSet = getRuleSet(ruleVersion ?? session.activeQuote?.ruleVersion);
  const eligibility = evaluateEligibility(input, ruleSet);

  if (!eligibility.isEligible) {
    throw new DomainError(
      'INELIGIBLE_RISK',
      `Quote cannot be generated automatically: ${eligibility.explanation}`,
      { eligibility }
    );
  }

  const pricing = calculatePricing(input, ruleSet);
  const quoteHash = computeQuoteHash(ruleSet.version, input, pricing);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 day quote validity

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
  session.eligibilityResult = eligibility;

  return quote;
}
