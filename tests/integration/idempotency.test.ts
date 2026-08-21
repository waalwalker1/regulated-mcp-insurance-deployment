import { describe, it, expect } from "vitest";
import { FunnelEngine } from "../../apps/mcp-server/src/funnel-engine.js";
import { InMemorySessionStore } from "../../packages/persistence/src/memory-store.js";
import { AuditStore } from "../../packages/audit/src/audit-store.js";
import { MemoryAuditRepository } from "../../packages/audit/src/memory-audit-repository.js";

describe("Integration: Idempotency & Replay Invariants", () => {
  async function createReadySession(engine: FunnelEngine) {
    const session = await engine.startSession("corr-idem-1");
    await engine.submitPropertyBasics(session.sessionId, {
      country: "FR",
      postcode: "75008",
      propertyType: "apartment",
      occupancyType: "owner_occupied",
    });
    await engine.submitRiskFactors(session.sessionId, {
      constructionYearBand: "2000_2015",
      floorAreaBand: "50_100_sqm",
      isPrimaryResidence: true,
      claimsCount5Years: 0,
    });
    await engine.evaluateEligibility(session.sessionId);
    await engine.selectCoverage(session.sessionId, {
      coverageTier: "comfort",
      deductible: 300,
      contactEmail: "idem.test@example.fr",
    });
    await engine.confirmParameters(session.sessionId, true);
    await engine.submitConsent(session.sessionId, "consent_v1_2026");
    return session;
  }

  it("should return identical cached quote on 10 duplicate calculation requests with same idempotency key", async () => {
    const store = new InMemorySessionStore();
    const auditRepo = new MemoryAuditRepository();
    const auditStore = new AuditStore(auditRepo);
    const engine = new FunnelEngine(store, auditStore);

    const session = await createReadySession(engine);
    const idempotencyKey = "unique_order_key_777";

    // First call: executes calculation
    const firstQuote = await engine.calculateQuote(session.sessionId, {
      idempotencyKey,
    });
    expect(firstQuote.quoteId).toBeDefined();

    // 10 Repeated calls with identical idempotencyKey
    for (let i = 0; i < 10; i++) {
      const replayedQuote = await engine.calculateQuote(session.sessionId, {
        idempotencyKey,
      });
      expect(replayedQuote.quoteId).toBe(firstQuote.quoteId);
      expect(replayedQuote.quoteHash).toBe(firstQuote.quoteHash);
      expect(replayedQuote.pricing.totalAnnualPremium).toBe(
        firstQuote.pricing.totalAnnualPremium,
      );
    }

    // Verify audit log captured request.replayed events
    const events = await auditStore.getEventsBySession(session.sessionId);
    const replayedEvents = events.filter(
      (e) => e.eventType === "request.replayed",
    );
    expect(replayedEvents.length).toBe(10);
  });

  it("should throw IDEMPOTENCY_KEY_CONFLICT when same idempotency key is reused with a different request payload", async () => {
    const store = new InMemorySessionStore();
    const auditRepo = new MemoryAuditRepository();
    const auditStore = new AuditStore(auditRepo);
    const engine = new FunnelEngine(store, auditStore);

    const session = await createReadySession(engine);
    await engine.calculateQuote(session.sessionId); // Initial quote

    const sharedKey = "reused_key_conflict_123";

    // First adjust call with deductible 300
    await engine.adjustQuote(session.sessionId, {
      deductible: 300,
      coverageTier: "comfort",
      idempotencyKey: sharedKey,
    });

    // Second adjust call with SAME key but DIFFERENT payload (deductible 500)
    await expect(
      engine.adjustQuote(session.sessionId, {
        deductible: 500,
        coverageTier: "comfort",
        idempotencyKey: sharedKey,
      }),
    ).rejects.toThrow(/IDEMPOTENCY_KEY_CONFLICT/);
  });

  it("should throw IDEMPOTENCY_KEY_CONFLICT when same key is used across different operations", async () => {
    const store = new InMemorySessionStore();
    const auditRepo = new MemoryAuditRepository();
    const auditStore = new AuditStore(auditRepo);
    const engine = new FunnelEngine(store, auditStore);

    const session = await createReadySession(engine);
    const collisionKey = "cross_op_key_999";

    // Used for calculateQuote
    await engine.calculateQuote(session.sessionId, {
      idempotencyKey: collisionKey,
    });

    // Reused for adjustQuote
    await expect(
      engine.adjustQuote(session.sessionId, {
        deductible: 500,
        idempotencyKey: collisionKey,
      }),
    ).rejects.toThrow(/IDEMPOTENCY_KEY_CONFLICT/);
  });
});
