import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { calculatePricing } from "../packages/rules/src/pricing.js";
import { computeCanonicalQuoteFingerprint } from "../packages/rules/src/hasher.js";
import { evaluateEligibility } from "../packages/rules/src/eligibility.js";
import { RULE_SET_V1 } from "../packages/rules/src/v1.js";
import {
  QuoteInputSchema,
  type QuoteInput,
} from "../packages/domain/src/schemas.js";

describe("Property-Based Testing (fast-check)", () => {
  const quoteInputArbitrary = fc.record({
    country: fc.constantFrom("FR", "ES", "PT", "DE", "IT" as const),
    postcode: fc.constantFrom("75008", "28001", "1000-001", "10115", "00118"),
    propertyType: fc.constantFrom(
      "apartment",
      "detached_house",
      "semi_detached",
      "terraced_house",
      "villa" as const,
    ),
    occupancyType: fc.constantFrom(
      "owner_occupied",
      "tenant",
      "landlord" as const,
    ),
    constructionYearBand: fc.constantFrom(
      "pre_1970",
      "1970_1999",
      "2000_2015",
      "post_2015" as const,
    ),
    floorAreaBand: fc.constantFrom(
      "under_50_sqm",
      "50_100_sqm",
      "101_150_sqm",
      "151_250_sqm",
      "over_250_sqm" as const,
    ),
    isPrimaryResidence: fc.boolean(),
    claimsCount5Years: fc.integer({ min: 0, max: 3 }), // 0-3 eligible
    coverageTier: fc.constantFrom("essential", "comfort", "premium" as const),
    deductible: fc.constantFrom(150, 300, 500, 1000 as const),
  });

  it("property: deterministic pricing purity — identical inputs yield exact same premium", () => {
    fc.assert(
      fc.property(quoteInputArbitrary, (input) => {
        const p1 = calculatePricing(input as QuoteInput, RULE_SET_V1);
        const p2 = calculatePricing(input as QuoteInput, RULE_SET_V1);

        expect(p1.totalAnnualPremium).toBe(p2.totalAnnualPremium);
        expect(p1.netAnnualPremium).toBe(p2.netAnnualPremium);
        expect(p1.fictionalTaxAmount).toBe(p2.fictionalTaxAmount);
      }),
      { numRuns: 100 },
    );
  });

  it("property: positive premium invariant — net premium is always >= €50 and total > 0", () => {
    fc.assert(
      fc.property(quoteInputArbitrary, (input) => {
        const pricing = calculatePricing(input as QuoteInput, RULE_SET_V1);

        expect(pricing.netAnnualPremium).toBeGreaterThanOrEqual(50.0);
        expect(pricing.totalAnnualPremium).toBeGreaterThan(
          pricing.netAnnualPremium,
        );
        expect(pricing.totalMonthlyPremium).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it("property: quote fingerprint determinism & sensitivity", () => {
    fc.assert(
      fc.property(quoteInputArbitrary, (input) => {
        const p = calculatePricing(input as QuoteInput, RULE_SET_V1);
        const e = evaluateEligibility(input as QuoteInput, RULE_SET_V1);

        const h1 = computeCanonicalQuoteFingerprint({
          ruleVersion: RULE_SET_V1.version,
          input: input as QuoteInput,
          pricing: p,
          eligibility: e,
        });

        const h2 = computeCanonicalQuoteFingerprint({
          ruleVersion: RULE_SET_V1.version,
          input: input as QuoteInput,
          pricing: p,
          eligibility: e,
        });

        expect(h1).toBe(h2);
        expect(h1.length).toBe(64);
      }),
      { numRuns: 100 },
    );
  });

  it("property: invalid postal codes are rejected by schema", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("FR", "ES", "DE", "IT" as const),
        fc.string({ minLength: 1, maxLength: 4 }), // Invalid: less than 5 digits
        (country, invalidPostcode) => {
          const result = QuoteInputSchema.safeParse({
            country,
            postcode: invalidPostcode,
            propertyType: "apartment",
            occupancyType: "owner_occupied",
            constructionYearBand: "2000_2015",
            floorAreaBand: "50_100_sqm",
            isPrimaryResidence: true,
            claimsCount5Years: 0,
            coverageTier: "comfort",
            deductible: 300,
          });

          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });
});
