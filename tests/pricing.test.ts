import { describe, it, expect } from "vitest";
import {
  calculatePricing,
  computeQuoteHash,
  RULE_SET_V1,
  RULE_SET_V2,
} from "../packages/rules/src/index.js";
import type { QuoteInput } from "../packages/domain/src/index.js";

describe("Deterministic Pricing Engine", () => {
  const standardInput: QuoteInput = {
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

  it("calculates deterministic pricing breakdown with exact arithmetic", () => {
    const pricing = calculatePricing(standardInput, RULE_SET_V1);

    // base: 180, apt: 0.90, owner: 1.0, area 50_100: 1.0, year 2000_2015: 1.0, claims 0: 1.0, comfort: 1.0
    // gross: 180 * 0.9 = 162
    // deductible discount for 300 EUR: 25 EUR
    // net: 162 - 25 = 137 EUR
    // tax: 137 * 0.18 = 24.66 EUR
    // total annual: 137 + 24.66 = 161.66 EUR
    // monthly: 161.66 / 12 = 13.47 EUR

    expect(pricing.baseAnnualPremium).toBe(180);
    expect(pricing.propertyTypeMultiplier).toBe(0.9);
    expect(pricing.netAnnualPremium).toBe(137);
    expect(pricing.taxRatePercent).toBe(18);
    expect(pricing.fictionalTaxAmount).toBe(24.66);
    expect(pricing.totalAnnualPremium).toBe(161.66);
    expect(pricing.totalMonthlyPremium).toBe(13.47);
  });

  it("is monotonic with respect to risk factors (more claims -> higher premium)", () => {
    const input0Claims = { ...standardInput, claimsCount5Years: 0 };
    const input2Claims = { ...standardInput, claimsCount5Years: 2 };

    const price0 = calculatePricing(input0Claims, RULE_SET_V1);
    const price2 = calculatePricing(input2Claims, RULE_SET_V1);

    expect(price2.totalAnnualPremium).toBeGreaterThan(
      price0.totalAnnualPremium,
    );
  });

  it("is monotonic with respect to deductible (higher deductible -> lower premium)", () => {
    const inputLowDeductible = { ...standardInput, deductible: 150 as const };
    const inputHighDeductible = { ...standardInput, deductible: 1000 as const };

    const priceLow = calculatePricing(inputLowDeductible, RULE_SET_V1);
    const priceHigh = calculatePricing(inputHighDeductible, RULE_SET_V1);

    expect(priceLow.totalAnnualPremium).toBeGreaterThan(
      priceHigh.totalAnnualPremium,
    );
  });

  it("computes identical SHA-256 quote hash for identical inputs and rules", () => {
    const pricing = calculatePricing(standardInput, RULE_SET_V1);
    const hash1 = computeQuoteHash(RULE_SET_V1.version, standardInput, pricing);
    const hash2 = computeQuoteHash(RULE_SET_V1.version, standardInput, pricing);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });
});
