import { describe, it, expect } from "vitest";
import pg from "pg";
import { PostgresSessionStore } from "../../packages/persistence/src/postgres-store.js";
import { PostgresAuditRepository } from "../../packages/audit/src/postgres-audit-repository.js";
import { AuditStore } from "../../packages/audit/src/audit-store.js";
import { FunnelEngine } from "../../apps/mcp-server/src/funnel-engine.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/northstar_insurance";

async function isPostgresAvailable(): Promise<boolean> {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 1000 });
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();
    return true;
  } catch {
    await pool.end().catch(() => {});
    return false;
  }
}

describe("Integration: Real PostgreSQL GDPR Anonymization & Quote History Scrubbing", () => {
  it("should scrub personal contact email from both session payload and quote_history table while preserving audit chain", async () => {
    const pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) {
      console.log(
        "Skipping Postgres anonymization test: database unavailable in local environment",
      );
      return;
    }

    const store = new PostgresSessionStore(connectionString);
    const auditRepo = new PostgresAuditRepository(connectionString);
    const auditStore = new AuditStore(auditRepo);
    const engine = new FunnelEngine(store, auditStore);

    await store.initialize();

    // 1. Create session with personal contact email
    const session = await engine.startSession("corr-anon-1");
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
      contactEmail: "gdpr.user@example.fr",
    });
    await engine.confirmParameters(session.sessionId, true);
    await engine.submitConsent(session.sessionId, "consent_v1_2026");

    // 2. Generate Quote (saved to both quote_sessions and quote_history tables)
    const quote = await engine.calculateQuote(session.sessionId);
    expect(quote.input.contactEmail).toBe("gdpr.user@example.fr");

    // 3. Verify email exists in PostgreSQL database before anonymization
    const preSession = await store.getSession(session.sessionId);
    expect(preSession?.partialInput.contactEmail).toBe("gdpr.user@example.fr");

    const preQuotes = await store.getQuoteHistory(session.sessionId);
    expect(preQuotes.length).toBeGreaterThan(0);
    expect(preQuotes[0].input.contactEmail).toBe("gdpr.user@example.fr");

    // 4. Run Store Anonymization
    const anonResult = await store.anonymizeSession(session.sessionId);
    expect(anonResult).toBe(true);

    // Record audit event
    await auditStore.recordEvent({
      sessionId: session.sessionId,
      correlationId: session.correlationId,
      eventType: "session.anonymized",
      actor: "admin-demo",
      metadata: { action: "gdpr_erasure_request", status: "completed" },
    });

    // 5. Query session table: verify email is deleted
    const postSession = await store.getSession(session.sessionId);
    expect(postSession?.partialInput.contactEmail).toBeUndefined();
    expect(postSession?.activeQuote?.input.contactEmail).toBeUndefined();

    // 6. Query quote_history table: verify email is scrubbed from historical snapshots
    const postQuotes = await store.getQuoteHistory(session.sessionId);
    expect(postQuotes.length).toBeGreaterThan(0);
    expect(postQuotes[0].input.contactEmail).toBeUndefined();

    // 7. Verify cryptographic audit chain integrity remains 100% valid
    const auditVerification = await auditStore.verifyChainIntegrity(
      session.sessionId,
    );
    expect(auditVerification.isValid).toBe(true);

    await store.close();
    await auditStore.close();
  });
});
