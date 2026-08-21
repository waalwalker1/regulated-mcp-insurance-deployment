import { describe, it, expect } from 'vitest';
import { createFlowTestHarness, MemoryKvStore } from '@waniwani/sdk/mcp';
import { buildWaniwaniInsuranceFlow } from '../../apps/mcp-server/src/waniwani-flow.js';

describe('Waniwani SDK Typed Flow Protocol Tests', () => {
  it('should execute end-to-end multi-step funnel with interrupts, confirmation, consent, and deterministic quote', async () => {
    const store = new MemoryKvStore() as any;
    const compiledFlow = buildWaniwaniInsuranceFlow(store);
    const harness = await createFlowTestHarness(compiledFlow, { stateStore: store });

    // Step 1: Start flow -> triggers interrupt for property details
    const step1 = await harness.start('I want home insurance for my apartment in Paris');
    expect(step1.status).toBe('interrupt');
    if (step1.status === 'interrupt') {
      const hasCountry = step1.field === 'country' || step1.questions?.some((q) => q.field === 'country');
      expect(hasCountry).toBe(true);
    }

    // Step 2: Answer property basics -> triggers interrupt for risk factors
    const step2 = await harness.continueWith({
      country: 'FR',
      postcode: '75008',
      propertyType: 'apartment',
      occupancyType: 'owner_occupied'
    });
    expect(step2.status).toBe('interrupt');
    if (step2.status === 'interrupt') {
      const hasYear = step2.field === 'constructionYearBand' || step2.questions?.some((q) => q.field === 'constructionYearBand');
      expect(hasYear).toBe(true);
    }

    // Step 3: Answer risk factors -> triggers eligibility evaluation and interrupts for coverage selection
    const step3 = await harness.continueWith({
      constructionYearBand: '2000_2015',
      floorAreaBand: '50_100_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 0
    });
    expect(step3.status).toBe('interrupt');
    if (step3.status === 'interrupt') {
      const hasTier = step3.field === 'coverageTier' || step3.questions?.some((q) => q.field === 'coverageTier');
      expect(hasTier).toBe(true);
    }

    // Step 4: Select coverage -> triggers interrupt for parameter confirmation
    const step4 = await harness.continueWith({
      coverageTier: 'comfort',
      deductible: 300
    });
    expect(step4.status).toBe('interrupt');
    if (step4.status === 'interrupt') {
      const hasConfirm = step4.field === 'parametersConfirmed' || step4.questions?.some((q) => q.field === 'parametersConfirmed');
      expect(hasConfirm).toBe(true);
    }

    // Step 5: Confirm parameters -> triggers interrupt for GDPR consent
    const step5 = await harness.continueWith({
      parametersConfirmed: true
    });
    expect(step5.status).toBe('interrupt');
    if (step5.status === 'interrupt') {
      const hasConsent = step5.field === 'hasConsented' || step5.questions?.some((q) => q.field === 'hasConsented');
      expect(hasConsent).toBe(true);
    }

    // Step 6: Grant consent -> executes quote calculation and completes flow
    const step6 = await harness.continueWith({
      hasConsented: true
    });
    expect(step6.status).toBe('complete');

    // Verify final state snapshot in store
    const finalState = await harness.lastState();
    expect(finalState).toBeDefined();
    expect(finalState?.state.totalAnnualPremium).toBe(161.66);
    expect(finalState?.state.quoteFingerprint).toBeDefined();
    expect(typeof finalState?.state.quoteFingerprint).toBe('string');
  });

  it('should branch to referral_end when claims exceed risk thresholds', async () => {
    const store = new MemoryKvStore() as any;
    const compiledFlow = buildWaniwaniInsuranceFlow(store);
    const harness = await createFlowTestHarness(compiledFlow, { stateStore: store });

    await harness.start('Quote for high risk house');
    await harness.continueWith({
      country: 'FR',
      postcode: '75008',
      propertyType: 'detached_house',
      occupancyType: 'owner_occupied'
    });

    const step3 = await harness.continueWith({
      constructionYearBand: 'pre_1970',
      floorAreaBand: 'over_250_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 4 // Excessive claims
    });

    // When eligibility declines/refers, it completes without issuing a quote
    expect(step3.status).toBe('complete');
    const finalState = await harness.lastState();
    expect(finalState?.state.eligibilityStatus).toBe('referral_required');
    expect(finalState?.state.referralReason).toContain('manual review');
    expect(finalState?.state.totalAnnualPremium).toBeUndefined();
  });
});
