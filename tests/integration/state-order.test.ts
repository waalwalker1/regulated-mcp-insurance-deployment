import { describe, it, expect } from 'vitest';
import { FunnelEngine } from '../../apps/mcp-server/src/funnel-engine.js';
import { InMemorySessionStore } from '../../packages/persistence/src/index.js';
import { AuditStore } from '../../packages/audit/src/index.js';

describe('Integration: State Order & Central Invariants Enforcement', () => {
  it('should reject consent submission before parameter confirmation', async () => {
    const engine = new FunnelEngine(new InMemorySessionStore(), new AuditStore());
    const session = await engine.startSession();
    await engine.submitPropertyBasics(session.sessionId, {
      country: 'FR',
      postcode: '75008',
      propertyType: 'apartment',
      occupancyType: 'owner_occupied'
    });
    await engine.submitRiskFactors(session.sessionId, {
      constructionYearBand: '2000_2015',
      floorAreaBand: '50_100_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 0
    });
    await engine.evaluateEligibility(session.sessionId);
    await engine.selectCoverage(session.sessionId, { coverageTier: 'comfort', deductible: 300 });

    // Try to jump directly to consent without confirmParameters
    await expect(engine.submitConsent(session.sessionId)).rejects.toThrow(/INVALID_STATE_TRANSITION/);
  });

  it('should invalidate active quote and reset consent when structural parameters are corrected', async () => {
    const engine = new FunnelEngine(new InMemorySessionStore(), new AuditStore());
    const session = await engine.startSession();
    await engine.submitPropertyBasics(session.sessionId, {
      country: 'FR',
      postcode: '75008',
      propertyType: 'apartment',
      occupancyType: 'owner_occupied'
    });
    await engine.submitRiskFactors(session.sessionId, {
      constructionYearBand: '2000_2015',
      floorAreaBand: '50_100_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 0
    });
    await engine.evaluateEligibility(session.sessionId);
    await engine.selectCoverage(session.sessionId, { coverageTier: 'comfort', deductible: 300 });
    await engine.confirmParameters(session.sessionId, true);
    await engine.submitConsent(session.sessionId);
    const q1 = await engine.calculateQuote(session.sessionId);

    expect(q1.status).toBe('active');

    // Customer corrects propertyType to villa
    const correctedSession = await engine.correctField(session.sessionId, { propertyType: 'villa' });

    expect(correctedSession.activeQuote).toBeUndefined();
    expect(correctedSession.consentDeclaration).toBeUndefined();
    expect(correctedSession.parametersConfirmedAt).toBeUndefined();
    expect(correctedSession.step).toBe('COLLECTING_PROPERTY');
    expect(correctedSession.correctionCount).toBe(1);
  });
});
