import { describe, it, expect } from "vitest";
import {
  replayHistoricalQuote,
  RULE_SET_V1,
  RULE_SET_V2,
  calculatePricing,
  computeCanonicalQuoteFingerprint,
  evaluateEligibility,
} from "../../packages/rules/src/index.js";
import type { QuoteInput } from "../../packages/domain/src/index.js";

describe("Integration: Rule Authority & Deterministic Historical Replay", () => {
  const sampleInput: QuoteInput = {
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

  it("should guarantee exact replay reproduction of historical quote using original rule version", () => {
    const pV1 = calculatePricing(sampleInput, RULE_SET_V1);
    const eV1 = evaluateEligibility(sampleInput, RULE_SET_V1);
    const hashV1 = computeCanonicalQuoteFingerprint({
      ruleVersion: RULE_SET_V1.version,
      input: sampleInput,
      pricing: pV1,
      eligibility: eV1,
    });

    const replayed = replayHistoricalQuote({
      quoteId: "hist-quote-123",
      originalRuleVersion: RULE_SET_V1.version,
      input: sampleInput,
      expectedQuoteHash: hashV1,
    });

    expect(replayed.isHashMatch).toBe(true);
    expect(replayed.replayedHash).toBe(hashV1);
    expect(replayed.replayedPricing.totalAnnualPremium).toBe(
      pV1.totalAnnualPremium,
    );
  });

  it("should differentiate fingerprints when recalculated under a newer rule version", () => {
    const pV1 = calculatePricing(sampleInput, RULE_SET_V1);
    const eV1 = evaluateEligibility(sampleInput, RULE_SET_V1);
    const hashV1 = computeCanonicalQuoteFingerprint({
      ruleVersion: RULE_SET_V1.version,
      input: sampleInput,
      pricing: pV1,
      eligibility: eV1,
    });

    const pV2 = calculatePricing(sampleInput, RULE_SET_V2);
    const eV2 = evaluateEligibility(sampleInput, RULE_SET_V2);
    const hashV2 = computeCanonicalQuoteFingerprint({
      ruleVersion: RULE_SET_V2.version,
      input: sampleInput,
      pricing: pV2,
      eligibility: eV2,
    });

    expect(hashV1).not.toBe(hashV2);
  });
});
