import { createHash } from "node:crypto";
import type { QuoteInput, PricingBreakdown } from "@northstar/domain";
import type { InsuranceRuleSet } from "./rule-set.js";
import { RULE_SET_V1 } from "./v1.js";

export function calculatePricing(
  input: QuoteInput,
  ruleSet: InsuranceRuleSet = RULE_SET_V1,
): PricingBreakdown {
  const baseAnnualPremium = ruleSet.baseAnnualRates[input.country] ?? 180.0;
  const propertyTypeMultiplier =
    ruleSet.propertyMultipliers[input.propertyType] ?? 1.0;
  const occupancyMultiplier =
    ruleSet.occupancyMultipliers[input.occupancyType] ?? 1.0;
  const areaMultiplier = ruleSet.areaMultipliers[input.floorAreaBand] ?? 1.0;
  const constructionYearMultiplier =
    ruleSet.constructionYearMultipliers[input.constructionYearBand] ?? 1.0;
  const claimsMultiplier =
    ruleSet.claimsMultipliers[Math.min(input.claimsCount5Years, 3)] ?? 1.0;
  const coverageTierMultiplier =
    ruleSet.coverageTierMultipliers[input.coverageTier] ?? 1.0;
  const deductibleDiscount =
    ruleSet.deductibleDiscounts[input.deductible] ?? 0.0;

  // Multiply base premium through risk factors
  const grossAnnual =
    baseAnnualPremium *
    propertyTypeMultiplier *
    occupancyMultiplier *
    areaMultiplier *
    constructionYearMultiplier *
    claimsMultiplier *
    coverageTierMultiplier;

  // Apply deductible discount (minimum floor of 50 EUR annual)
  const netAnnualPremium = Math.max(
    50.0,
    Math.round((grossAnnual - deductibleDiscount) * 100) / 100,
  );

  const taxRatePercent = (ruleSet.taxRates[input.country] ?? 0.18) * 100;
  const fictionalTaxAmount =
    Math.round(netAnnualPremium * (taxRatePercent / 100) * 100) / 100;
  const totalAnnualPremium =
    Math.round((netAnnualPremium + fictionalTaxAmount) * 100) / 100;
  const totalMonthlyPremium = Math.round((totalAnnualPremium / 12) * 100) / 100;

  return {
    baseAnnualPremium,
    propertyTypeMultiplier,
    occupancyMultiplier,
    areaMultiplier,
    constructionYearMultiplier,
    claimsMultiplier,
    coverageTierMultiplier,
    deductibleDiscount,
    netAnnualPremium,
    fictionalTaxAmount,
    taxRatePercent,
    totalAnnualPremium,
    totalMonthlyPremium,
    currency: "EUR",
  };
}

/**
 * Generate a deterministic SHA-256 hash representing the exact input parameters and calculated pricing
 */
export function computeQuoteHash(
  ruleVersion: string,
  input: QuoteInput,
  pricing: PricingBreakdown,
): string {
  const payload = JSON.stringify({
    ruleVersion,
    country: input.country,
    postcode: input.postcode,
    propertyType: input.propertyType,
    occupancyType: input.occupancyType,
    constructionYearBand: input.constructionYearBand,
    floorAreaBand: input.floorAreaBand,
    claimsCount5Years: input.claimsCount5Years,
    coverageTier: input.coverageTier,
    deductible: input.deductible,
    totalAnnualPremium: pricing.totalAnnualPremium,
    netAnnualPremium: pricing.netAnnualPremium,
  });

  return createHash("sha256").update(payload).digest("hex");
}
