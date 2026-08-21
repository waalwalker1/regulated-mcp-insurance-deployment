import { randomUUID } from "node:crypto";
import type {
  QuoteInput,
  GeneratedQuote,
  FunnelSession,
} from "@northstar/domain";
import { DomainError, FunnelStateMachine } from "@northstar/domain";
import { getRuleSet } from "./registry.js";
import { evaluateEligibility } from "./eligibility.js";
import { calculatePricing } from "./pricing.js";
import { computeCanonicalQuoteFingerprint } from "./hasher.js";
import {
  defaultRulePolicyProvider,
  type RulePolicyProvider,
} from "./rule-policy.js";

export function generateQuote(
  session: FunnelSession,
  input: QuoteInput,
  rulePolicy: RulePolicyProvider = defaultRulePolicyProvider,
): GeneratedQuote {
  // Invariant 1: Ensure state machine prerequisites are met
  FunnelStateMachine.assertReadyToQuote(session);

  // Invariant 2: Active rule version is strictly server-owned
  const activeRuleVersion = rulePolicy.getActiveRuleVersion({
    country: input.country,
  });
  const ruleSet = getRuleSet(activeRuleVersion);

  const eligibility = evaluateEligibility(input, ruleSet);

  if (!eligibility.isEligible) {
    session.step = "REFERRED";
    session.eligibilityResult = eligibility;
    throw new DomainError(
      "INELIGIBLE_RISK",
      `Quote cannot be generated automatically: ${eligibility.explanation}`,
      { eligibility },
    );
  }

  const pricing = calculatePricing(input, ruleSet);
  const quoteHash = computeCanonicalQuoteFingerprint({
    ruleVersion: ruleSet.version,
    input,
    pricing,
    eligibility,
  });

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
    status: "active",
  };

  session.activeQuote = quote;
  session.eligibilityResult = eligibility;
  session.lastQuoteFingerprint = quoteHash;
  session.step = "QUOTED";
  session.version = (session.version ?? 0) + 1;
  session.updatedAt = now.toISOString();

  return quote;
}
