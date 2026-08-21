import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createNorthstarMcpServer } from "../../apps/mcp-server/src/server.js";
import { FunnelEngine } from "../../apps/mcp-server/src/funnel-engine.js";
import { MemoryKvStore } from "@waniwani/sdk/mcp";

describe("Protocol: Full Waniwani Primary Flow E2E via MCP Client", () => {
  it("should complete multi-step quotation exclusively via get_home_insurance_quote tool over MCP Client transport", async () => {
    const flowStore = new MemoryKvStore() as any;
    const engine = new FunnelEngine();
    const server = createNorthstarMcpServer(engine, flowStore);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    const client = new Client(
      { name: "waniwani-e2e-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    // Step 1: Start conversational flow through primary tool
    const step1Res = (await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        action: "start",
        input: "Hello, I want home insurance for my flat in Paris",
      },
    })) as any;

    expect(step1Res).toBeDefined();
    const step1Data = step1Res.status
      ? step1Res
      : JSON.parse(step1Res.content[0].text);
    expect(step1Data.status).toBe("interrupt");
    const token1 = step1Data.sessionId || step1Data.token;
    expect(token1).toBeDefined();

    // Step 2: Answer property location & structural category
    const step2Res = (await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        action: "continue",
        sessionId: token1,
        response: {
          country: "FR",
          postcode: "75008",
          propertyType: "apartment",
          occupancyType: "owner_occupied",
        },
      },
    })) as any;

    const step2Data = step2Res.status
      ? step2Res
      : JSON.parse(step2Res.content[0].text);
    expect(step2Data.status).toBe("interrupt");
    const token2 = step2Data.sessionId || token1;

    // Step 3: Answer risk factors
    const step3Res = (await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        action: "continue",
        sessionId: token2,
        response: {
          constructionYearBand: "2000_2015",
          floorAreaBand: "50_100_sqm",
          isPrimaryResidence: true,
          claimsCount5Years: 0,
        },
      },
    })) as any;

    const step3Data = step3Res.status
      ? step3Res
      : JSON.parse(step3Res.content[0].text);
    expect(step3Data.status).toBe("interrupt");
    const token3 = step3Data.sessionId || token2;

    // Step 4: Select coverage & deductible
    const step4Res = (await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        action: "continue",
        sessionId: token3,
        response: {
          coverageTier: "comfort",
          deductible: 300,
        },
      },
    })) as any;

    const step4Data = step4Res.status
      ? step4Res
      : JSON.parse(step4Res.content[0].text);
    expect(step4Data.status).toBe("interrupt");
    const token4 = step4Data.sessionId || token3;

    // Step 5: Confirm declared parameters
    const step5Res = (await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        action: "continue",
        sessionId: token4,
        response: {
          parametersConfirmed: true,
        },
      },
    })) as any;

    const step5Data = step5Res.status
      ? step5Res
      : JSON.parse(step5Res.content[0].text);
    expect(step5Data.status).toBe("interrupt");
    const token5 = step5Data.sessionId || token4;

    // Step 6: Grant GDPR data processing consent
    const step6Res = (await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        action: "continue",
        sessionId: token5,
        response: {
          hasConsented: true,
        },
      },
    })) as any;

    // Step 7: Flow executes deterministic quote calculation and completes!
    const step6Data = step6Res.status
      ? step6Res
      : JSON.parse(step6Res.content[0].text);
    expect(step6Data.status).toBe("complete");

    // Verify stored state in flow store
    const storedState = await flowStore.get(token5);
    expect(storedState).toBeDefined();
    expect(storedState.state.totalAnnualPremium).toBe(161.66);
    expect(storedState.state.totalMonthlyPremium).toBe(13.47);
    expect(storedState.state.quoteFingerprint).toBeDefined();
    expect(typeof storedState.state.quoteFingerprint).toBe("string");

    await client.close();
    await server.close();
  });
});
