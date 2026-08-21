import { describe, it, expect } from "vitest";
import {
  evaluateEligibility,
  RULE_SET_V1,
} from "../packages/rules/src/index.js";
import type { QuoteInput } from "../packages/domain/src/index.js";

describe("Deterministic Eligibility Engine", () => {
  const eligibleInput: QuoteInput = {
    country: "FR",
    postcode: "75008",
    propertyType: "apartment",
    occupancyType: "owner_occupied",
    constructionYearBand: "2000_2015",
    floorAreaBand: "50_100_sqm",
    isPrimaryResidence: true,
    claimsCount5Years: 0,
    coverageTier: "comfort",
    deductible: 300,
  };

  it("marks valid standard risk as eligible", () => {
    const result = evaluateEligibility(eligibleInput, RULE_SET_V1);
    expect(result.isEligible).toBe(true);
    expect(result.status).toBe("eligible");
    expect(result.reasonCodes).toContain("RISK_CRITERIA_MET");
  });

  it("requires referral if claims exceed threshold", () => {
    const highClaimsInput: QuoteInput = {
      ...eligibleInput,
      claimsCount5Years: 4,
    };
    const result = evaluateEligibility(highClaimsInput, RULE_SET_V1);
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe("referral_required");
    expect(result.reasonCodes).toContain("CLAIMS_THRESHOLD_EXCEEDED");
  });

  it("requires referral for high-value large villa with multiple prior claims", () => {
    const highValueRiskInput: QuoteInput = {
      ...eligibleInput,
      propertyType: "villa",
      floorAreaBand: "over_250_sqm",
      claimsCount5Years: 2,
    };
    const result = evaluateEligibility(highValueRiskInput, RULE_SET_V1);
    expect(result.isEligible).toBe(false);
    expect(result.status).toBe("referral_required");
    expect(result.reasonCodes).toContain("HIGH_VALUE_HIGH_CLAIMS_REFERRAL");
  });
});
