import { describe, it, expect } from "vitest";
import pg from "pg";
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

    const sessionId = `pg-flow-test-${Date.now()}`;
    const extra = { _meta: { sessionId } };

    // Step 1: Initial Store and Compiled Flow
    const store1 = new PostgresWaniwaniKvStore(connectionString);
    await store1.initialize();

    const compiledFlow1 = buildWaniwaniInsuranceFlow(store1);
    let handler1: any;
    const fakeServer1 = {
      registerTool: (_name: string, _config: any, h: any) => {
        handler1 = h;
      },
    };
    await compiledFlow1.register(fakeServer1 as any);

    // Step 1.1: Start flow
    const step1 = await handler1(
      { action: "start", intent: "I need home insurance in Madrid" },
      extra,
    );
    const parsed1 = JSON.parse(step1.content[0].text);
    expect(parsed1.status).toBe("interrupt");

    // Step 1.2: Submit Property details
    const step2 = await handler1(
      {
        action: "continue",
        stateUpdates: {
          country: "ES",
          postcode: "28001",
          propertyType: "apartment",
          occupancyType: "owner_occupied",
        },
      },
      extra,
    );
    const parsed2 = JSON.parse(step2.content[0].text);
    expect(parsed2.status).toBe("interrupt");

    // Step 1.3: Submit Risk factors
    const step3 = await handler1(
      {
        action: "continue",
        stateUpdates: {
          constructionYearBand: "2000_2015",
          floorAreaBand: "50_100_sqm",
          isPrimaryResidence: true,
          claimsCount5Years: 0,
        },
      },
      extra,
    );
    const parsed3 = JSON.parse(step3.content[0].text);
    expect(parsed3.status).toBe("interrupt");

    const interimState = (await store1.get(sessionId)) as any;
    expect(interimState).toBeDefined();
    expect(interimState?.state?.country).toBe("ES");
    expect(interimState?.state?.postcode).toBe("28001");

    // Step 2: SIMULATE PROCESS / STORE RESTART
    await store1.close();

    // Recreate fresh store and flow instance connecting to same database
    const store2 = new PostgresWaniwaniKvStore(connectionString);
    await store2.initialize();

    const compiledFlow2 = buildWaniwaniInsuranceFlow(store2);
    let handler2: any;
    const fakeServer2 = {
      registerTool: (_name: string, _config: any, h: any) => {
        handler2 = h;
      },
    };
    await compiledFlow2.register(fakeServer2 as any);

    // Step 3: Resume the session on fresh handler instance
    const step4 = await handler2(
      {
        action: "continue",
        stateUpdates: {
          coverageTier: "comfort",
          deductible: 300,
        },
      },
      extra,
    );
    const parsed4 = JSON.parse(step4.content[0].text);
    expect(parsed4.status).toBe("interrupt");

    const step5 = await handler2(
      {
        action: "continue",
        stateUpdates: {
          parametersConfirmed: true,
        },
      },
      extra,
    );
    const parsed5 = JSON.parse(step5.content[0].text);
    expect(parsed5.status).toBe("interrupt");

    const step6 = await handler2(
      {
        action: "continue",
        stateUpdates: {
          hasConsented: true,
        },
      },
      extra,
    );
    const parsed6 = JSON.parse(step6.content[0].text);
    expect(parsed6.status).toBe("complete");

    // Step 4: Verify state in PostgreSQL survived store restart
    const finalStored = (await store2.get(sessionId)) as any;
    expect(finalStored).toBeDefined();
    expect(finalStored?.state?.country).toBe("ES");
    expect(finalStored?.state?.totalAnnualPremium).toBeDefined();
    expect(finalStored?.state?.quoteFingerprint).toBeDefined();

    await store2.close();
  });
});
