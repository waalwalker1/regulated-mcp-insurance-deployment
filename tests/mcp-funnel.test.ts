import { describe, it, expect, beforeEach } from 'vitest';
import { FunnelEngine } from '../apps/mcp-server/src/funnel-engine.js';
import { InMemorySessionStore } from '../packages/persistence/src/index.js';
import { AuditStore } from '../packages/audit/src/index.js';

describe('MCP Funnel Engine Integration Journey', () => {
  let engine: FunnelEngine;
  let auditStore: AuditStore;

  beforeEach(() => {
    auditStore = new AuditStore();
    engine = new FunnelEngine(new InMemorySessionStore(), auditStore);
  });

  it('completes the full end-to-end quote lifecycle with consent and audit verification', async () => {
    // 1. Start Session
    const session = await engine.startSession('corr-integration-1');
    expect(session.step).toBe('COLLECTING_PROPERTY');

    // 2. Submit Property Basics
    const s2 = await engine.submitPropertyBasics(session.sessionId, {
      country: 'FR',
      postcode: '75008',
      propertyType: 'apartment',
      occupancyType: 'owner_occupied'
    });
    expect(s2.step).toBe('COLLECTING_RISK');

    // 3. Submit Risk Factors
    const s3 = await engine.submitRiskFactors(session.sessionId, {
      constructionYearBand: '2000_2015',
      floorAreaBand: '50_100_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 0
    });
    expect(s3.step).toBe('EVALUATING_ELIGIBILITY');

    // 4. Evaluate Eligibility
    const s4 = await engine.evaluateEligibility(session.sessionId);
    expect(s4.step).toBe('COLLECTING_COVERAGE');
    expect(s4.eligibilityResult?.isEligible).toBe(true);

    // 5. Select Coverage
    const s5 = await engine.selectCoverage(session.sessionId, {
      coverageTier: 'comfort',
      deductible: 300,
      contactEmail: 'demo@northstar.eu'
    });
    expect(s5.step).toBe('AWAITING_CONFIRMATION');

    // 6. User Confirms
    const s6 = await engine.confirmParameters(session.sessionId, true);
    expect(s6.step).toBe('AWAITING_CONSENT');

    // 7. Calculate Quote without consent MUST fail (Invariant 1)
    await expect(engine.calculateQuote(session.sessionId)).rejects.toThrow(/CONSENT_REQUIRED/);

    // 8. Grant Consent
    const s7 = await engine.submitConsent(session.sessionId, 'consent_v1_2026');
    expect(s7.consentDeclaration?.hasConsentedToDataProcessing).toBe(true);

    // 9. Calculate Quote
    const quote = await engine.calculateQuote(session.sessionId);
    expect(quote.status).toBe('active');
    expect(quote.pricing.totalAnnualPremium).toBe(161.66);
    expect(quote.isBinding).toBe(false);
    expect(quote.quoteHash).toHaveLength(64);

    // 10. Adjustment Loop (Change deductible to 500 without restarting whole funnel)
    const adjustedQuote = await engine.adjustQuote(session.sessionId, {
      deductible: 500
    });
    expect(adjustedQuote.status).toBe('adjusted');
    expect(adjustedQuote.pricing.deductibleDiscount).toBe(55);
    expect(adjustedQuote.pricing.totalAnnualPremium).toBeLessThan(quote.pricing.totalAnnualPremium);

    // 11. Verify Audit Chain
    const auditExport = await engine.exportAuditTrail(session.sessionId);
    expect(auditExport.chainIntegrity.isValid).toBe(true);
    expect(auditExport.eventCount).toBeGreaterThan(6);
  });
});
