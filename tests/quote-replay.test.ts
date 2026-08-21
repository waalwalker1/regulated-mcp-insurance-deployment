import { describe, it, expect } from 'vitest';
import { calculatePricing, computeQuoteHash, RULE_SET_V1, RULE_SET_V2 } from '../packages/rules/src/index.js';
import type { QuoteInput } from '../packages/domain/src/index.js';

describe('Rule Versioning and Quote Replay Reproducibility', () => {
  const input: QuoteInput = {
    country: 'ES',
    postcode: '28001',
    propertyType: 'detached_house',
    occupancyType: 'owner_occupied',
    constructionYearBand: '1970_1999',
    floorAreaBand: '101_150_sqm',
    isPrimaryResidence: true,
    claimsCount5Years: 1,
    coverageTier: 'premium',
    deductible: 500
  };

  it('preserves exact quote replay when re-evaluated against original rule version', () => {
    // 1. Original calculation under v1
    const originalPricing = calculatePricing(input, RULE_SET_V1);
    const originalHash = computeQuoteHash(RULE_SET_V1.version, input, originalPricing);

    // 2. Later, new rule version v2 is deployed
    const v2Pricing = calculatePricing(input, RULE_SET_V2);
    const v2Hash = computeQuoteHash(RULE_SET_V2.version, input, v2Pricing);

    // Verify rates actually shifted between versions
    expect(v2Pricing.totalAnnualPremium).not.toBe(originalPricing.totalAnnualPremium);
    expect(v2Hash).not.toBe(originalHash);

    // 3. Historical replay: Re-evaluating historical input with v1 rule version yields exact original numbers & hash
    const replayedPricing = calculatePricing(input, RULE_SET_V1);
    const replayedHash = computeQuoteHash(RULE_SET_V1.version, input, replayedPricing);

    expect(replayedPricing.totalAnnualPremium).toBe(originalPricing.totalAnnualPremium);
    expect(replayedPricing.netAnnualPremium).toBe(originalPricing.netAnnualPremium);
    expect(replayedHash).toBe(originalHash);
  });
});
