import { describe, it, expect } from "vitest";
import pg from "pg";
import { PostgresSessionStore } from "../../packages/persistence/src/postgres-store.js";

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

describe("Integration: Real PostgreSQL Optimistic Concurrency Control", () => {
  it("should enforce compare-and-swap and throw CONCURRENT_MODIFICATION on conflicting writes", async () => {
    const pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) {
      console.log(
        "Skipping Postgres concurrency test: database unavailable in local environment",
      );
      return;
    }

    const store = new PostgresSessionStore(connectionString);
    await store.initialize();

    // 1. Initialize session at version 1
    const session = await store.createSession();
    expect(session.version).toBe(1);

    // Advance to version 2 and 3
    session.partialInput.country = "FR";
    await store.saveSession(session); // version 2

    session.partialInput.postcode = "75008";
    await store.saveSession(session); // version 3
    expect(session.version).toBe(3);

    // 2. Process A and Process B read the session at version 3
    const processA = await store.getSession(session.sessionId);
    const processB = await store.getSession(session.sessionId);
    expect(processA?.version).toBe(3);
    expect(processB?.version).toBe(3);

    // 3. Process A updates first -> succeeds, increments to version 4
    if (!processA || !processB) throw new Error("Sessions must exist");
    processA.partialInput.propertyType = "apartment";
    await store.saveSession(processA);
    expect(processA.version).toBe(4);

    // 4. Process B attempts to save using stale expected version 3 -> MUST FAIL
    processB.partialInput.propertyType = "villa";
    await expect(store.saveSession(processB)).rejects.toThrow(
      /CONCURRENT_MODIFICATION/,
    );

    // 5. Verify database contains Process A's write, not Process B's
    const persisted = await store.getSession(session.sessionId);
    expect(persisted?.version).toBe(4);
    expect(persisted?.partialInput.propertyType).toBe("apartment");

    await store.close();
  });
});
