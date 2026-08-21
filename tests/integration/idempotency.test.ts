import { describe, it, expect } from 'vitest';
import { FunnelEngine } from '../../apps/mcp-server/src/funnel-engine.js';
import { InMemorySessionStore } from '../../packages/persistence/src/index.js';
import { AuditStore } from '../../packages/audit/src/index.js';

describe('Integration: Idempotency & Request Replay Safety', () => {
  it('should return identical quote on 10 repeated calculation calls with same idempotency key', async () => {
    const store = new InMemorySessionStore();
    const audit = new AuditStore();
    const engine = new FunnelEngine(store, audit);

    const session = await engine.startSession('corr-idem-1');
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

    const idempotencyKey = 'idempotent-quote-key-123';

    // 1st calculation
    const q1 = await engine.calculateQuote(session.sessionId, { idempotencyKey });

    // Repeated 10 times
    for (let i = 0; i < 10; i++) {
      const qRepeat = await engine.calculateQuote(session.sessionId, { idempotencyKey });
      expect(qRepeat.quoteId).toBe(q1.quoteId);
      expect(qRepeat.quoteHash).toBe(q1.quoteHash);
      expect(qRepeat.pricing.totalAnnualPremium).toBe(q1.pricing.totalAnnualPremium);
    }

    // Verify audit contains request.replayed events
    const events = await audit.getEventsBySession(session.sessionId);
    const replayEvents = events.filter((e) => e.eventType === 'request.replayed');
    expect(replayEvents.length).toBe(10);
  });

  it('should return same adjusted quote on repeated adjustQuote requests', async () => {
    const store = new InMemorySessionStore();
    const audit = new AuditStore();
    const engine = new FunnelEngine(store, audit);

    const session = await engine.startSession('corr-idem-2');
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
    await engine.calculateQuote(session.sessionId);

    const adjustKey = 'adjust-key-456';
    const adj1 = await engine.adjustQuote(session.sessionId, { deductible: 500, idempotencyKey: adjustKey });
    const adj2 = await engine.adjustQuote(session.sessionId, { deductible: 500, idempotencyKey: adjustKey });

    expect(adj2.quoteId).toBe(adj1.quoteId);
    expect(adj2.pricing.totalAnnualPremium).toBe(adj1.pricing.totalAnnualPremium);
  });
});
