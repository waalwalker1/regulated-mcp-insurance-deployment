import {
  DomainError,
  type QuoteInput,
  type GeneratedQuote,
} from "@northstar/domain";
import { getRuleSet } from "./registry.js";
import { evaluateEligibility } from "./eligibility.js";
import { calculatePricing } from "./pricing.js";
import { computeCanonicalQuoteFingerprint } from "./hasher.js";

export interface RulePolicyProvider {
  getActiveRuleVersion(context?: { country?: string }): string;
}

export class DefaultRulePolicyProvider implements RulePolicyProvider {
  constructor(
    private readonly activeVersion: string = "northstar-home-eu-v1",
  ) {}

  getActiveRuleVersion(_context?: { country?: string }): string {
    return this.activeVersion;
  }
}

export const defaultRulePolicyProvider = new DefaultRulePolicyProvider();

/**
 * Replay an immutable historical quote using its original recorded rule version
 */
export function replayHistoricalQuote(params: {
  quoteId: string;
  originalRuleVersion: string;
  input: QuoteInput;
  expectedQuoteHash?: string;
}): {
  quoteId: string;
  replayedRuleVersion: string;
  replayedPricing: ReturnType<typeof calculatePricing>;
  replayedEligibility: ReturnType<typeof evaluateEligibility>;
  replayedHash: string;
  isHashMatch: boolean;
} {
  const ruleSet = getRuleSet(params.originalRuleVersion);
  if (!ruleSet) {
    throw new DomainError(
      "INVALID_INPUT",
      `Historical rule version '${params.originalRuleVersion}' is not recognized in rule registry.`,
    );
  }

  const replayedEligibility = evaluateEligibility(params.input, ruleSet);
  const replayedPricing = calculatePricing(params.input, ruleSet);
  const replayedHash = computeCanonicalQuoteFingerprint({
    ruleVersion: ruleSet.version,
    input: params.input,
    pricing: replayedPricing,
    eligibility: replayedEligibility,
  });

  return {
    quoteId: params.quoteId,
    replayedRuleVersion: ruleSet.version,
    replayedPricing,
    replayedEligibility,
    replayedHash,
    isHashMatch: params.expectedQuoteHash
      ? replayedHash === params.expectedQuoteHash
      : true,
  };
}
