import { createHash } from "node:crypto";
import type {
  QuoteInput,
  PricingBreakdown,
  EligibilityResult,
} from "@northstar/domain";

/**
 * Deterministically sort and serialize object keys to produce stable JSON
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ":" + canonicalJsonStringify(val);
  });
  return "{" + pairs.join(",") + "}";
}

/**
 * Generate a deterministic quote fingerprint over non-PII decision parameters
 */
export function computeCanonicalQuoteFingerprint(params: {
  ruleVersion: string;
  input: QuoteInput;
  pricing: PricingBreakdown;
  eligibility: EligibilityResult;
}): string {
  const canonicalPayload = {
    ruleVersion: params.ruleVersion,
    country: params.input.country,
    postcode: params.input.postcode,
    propertyType: params.input.propertyType,
    occupancyType: params.input.occupancyType,
    constructionYearBand: params.input.constructionYearBand,
    floorAreaBand: params.input.floorAreaBand,
    claimsCount5Years: params.input.claimsCount5Years,
    isPrimaryResidence: params.input.isPrimaryResidence,
    coverageTier: params.input.coverageTier,
    deductible: params.input.deductible,
    eligibilityStatus: params.eligibility.status,
    eligibilityReasonCodes: [...params.eligibility.reasonCodes].sort(),
    currency: params.pricing.currency,
    netAnnualPremium: params.pricing.netAnnualPremium,
    totalAnnualPremium: params.pricing.totalAnnualPremium,
    taxRatePercent: params.pricing.taxRatePercent,
    fictionalTaxAmount: params.pricing.fictionalTaxAmount,
    quoteSemantics: "indicative_non_binding_v1",
  };

  const serialized = canonicalJsonStringify(canonicalPayload);
  return createHash("sha256").update(serialized).digest("hex");
}
