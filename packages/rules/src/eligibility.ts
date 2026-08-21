import type { QuoteInput, EligibilityResult } from "@northstar/domain";
import type { InsuranceRuleSet } from "./rule-set.js";
import { RULE_SET_V1 } from "./v1.js";

export function evaluateEligibility(
  input: QuoteInput,
  ruleSet: InsuranceRuleSet = RULE_SET_V1,
): EligibilityResult {
  const reasonCodes: string[] = [];
  const evaluatedAt = new Date().toISOString();

  // 1. Country Support Check
  if (!ruleSet.supportedCountries.includes(input.country)) {
    reasonCodes.push("COUNTRY_NOT_SUPPORTED");
  }

  // 2. Prior Claims Threshold
  if (input.claimsCount5Years > ruleSet.maxClaimsForInstantQuote) {
    reasonCodes.push("CLAIMS_THRESHOLD_EXCEEDED");
  }

  // 3. High-Value / Complex Risk Combination
  if (
    input.propertyType === "villa" &&
    input.floorAreaBand === "over_250_sqm" &&
    input.claimsCount5Years >= 2
  ) {
    reasonCodes.push("HIGH_VALUE_HIGH_CLAIMS_REFERRAL");
  }

  if (reasonCodes.length === 0) {
    return {
      status: "eligible",
      isEligible: true,
      reasonCodes: ["RISK_CRITERIA_MET"],
      explanation:
        "Property meets all standard underwriting guidelines for automated quotation.",
      evaluatedAt,
      ruleVersion: ruleSet.version,
    };
  }

  if (reasonCodes.includes("COUNTRY_NOT_SUPPORTED")) {
    return {
      status: "declined",
      isEligible: false,
      reasonCodes,
      explanation: `Northstar Home Insurance EU does not currently operate in territory '${input.country}'.`,
      evaluatedAt,
      ruleVersion: ruleSet.version,
    };
  }

  return {
    status: "referral_required",
    isEligible: false,
    reasonCodes,
    explanation:
      "Risk characteristics require manual review by a licensed underwriting specialist before binding.",
    evaluatedAt,
    ruleVersion: ruleSet.version,
  };
}
