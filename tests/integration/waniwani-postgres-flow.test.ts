import { describe, it, expect } from "vitest";
import pg from "pg";
import { createFlowTestHarness } from "@waniwani/sdk/mcp";
import { PostgresWaniwaniKvStore } from "../../packages/persistence/src/waniwani-postgres-kv-store.js";
import { buildWaniwaniInsuranceFlow } from "../../apps/mcp-server/src/waniwani-flow.js";

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

describe("Integration: Real Waniwani Flow State in PostgreSQL", () => {
  it("should persist Waniwani flow state in PostgreSQL and survive store/process recreation", async () => {
    const pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) {
      console.log(
        "Skipping Waniwani Postgres flow test: database unavailable in local environment",
      );
      return;
    }

    // Step 1: Initial Store and Harness
    let store1 = new PostgresWaniwaniKvStore(connectionString);
    await store1.initialize();

    let compiledFlow1 = buildWaniwaniInsuranceFlow(store1);
    let harness1 = await createFlowTestHarness(compiledFlow1, {
      stateStore: store1 as any,
    });

    // Step 1.1: Start flow
    const step1 = await harness1.start("I need home insurance in Madrid");
    expect(step1.status).toBe("interrupt");

    // Step 1.2: Submit Property details
    const step2 = await harness1.continueWith({
      country: "ES",
      postcode: "28001",
      propertyType: "apartment",
      occupancyType: "owner_occupied",
    });
    expect(step2.status).toBe("interrupt");

    // Step 1.3: Submit Risk factors
    const step3 = await harness1.continueWith({
      constructionYearBand: "2000_2015",
      floorAreaBand: "50_100_sqm",
      isPrimaryResidence: true,
      claimsCount5Years: 0,
    });
    expect(step3.status).toBe("interrupt");

    const interimState = await harness1.lastState();
    expect(interimState).toBeDefined();
    expect(interimState?.state.country).toBe("ES");
    expect(interimState?.state.postcode).toBe("28001");

    // Step 2: SIMULATE PROCESS / STORE RESTART
    await store1.close();

    // Recreate fresh store connecting to same database
    const store2 = new PostgresWaniwaniKvStore(connectionString);
    await store2.initialize();

    const compiledFlow2 = buildWaniwaniInsuranceFlow(store2);
    const harness2 = await createFlowTestHarness(compiledFlow2, {
      stateStore: store2 as any,
    });

    // Step 3: Resume the session on fresh harness instance
    const step4 = await harness2.continueWith({
      coverageTier: "comfort",
      deductible: 300,
    });
    expect(step4.status).toBe("interrupt");

    const step5 = await harness2.continueWith({
      parametersConfirmed: true,
    });
    expect(step5.status).toBe("interrupt");

    const step6 = await harness2.continueWith({
      hasConsented: true,
    });
    expect(step6.status).toBe("complete");

    // Step 4: Verify state in PostgreSQL survived store restart
    const finalState = await harness2.lastState();
    expect(finalState).toBeDefined();
    expect(finalState?.state.country).toBe("ES");
    expect(finalState?.state.totalAnnualPremium).toBeDefined();
    expect(finalState?.state.quoteFingerprint).toBeDefined();

    await store2.close();
  });
});
