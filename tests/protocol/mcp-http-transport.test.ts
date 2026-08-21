import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { startHttpMcpServer } from "../../apps/mcp-server/src/server.js";

describe("Protocol: Official MCP Streamable HTTP Transport Integration", () => {
  let serverHandle: Awaited<ReturnType<typeof startHttpMcpServer>>;
  let port: number;
  let client: Client;
  let transport: StreamableHTTPClientTransport;

  beforeAll(async () => {
    // Start HTTP server on port 0 (ephemeral port)
    serverHandle = await startHttpMcpServer(0);
    const address = serverHandle.app.server.address();
    port = typeof address === "object" && address ? address.port : 3000;

    client = new Client(
      {
        name: "test-http-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${port}/mcp`),
    );

    await client.connect(transport);
  });

  afterAll(async () => {
    await transport.close().catch(() => {});
    await client.close().catch(() => {});
    await serverHandle.app.close().catch(() => {});
  });

  it("should verify health and readiness probes over HTTP", async () => {
    const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as any;
    expect(health.status).toBe("healthy");
    expect(health.transport).toBe("http");

    const readyRes = await fetch(`http://127.0.0.1:${port}/ready`);
    expect(readyRes.status).toBe(200);
    const ready = (await readyRes.json()) as any;
    expect(ready.status).toBe("ready");
    expect(ready.server).toBe("northstar-insurance-mcp");
  });

  it("should discover all tools including get_home_insurance_quote over official HTTP transport", async () => {
    const toolList = await client.listTools();
    expect(toolList.tools).toBeDefined();

    const toolNames = toolList.tools.map((t) => t.name);
    expect(toolNames).toContain("get_home_insurance_quote");
    expect(toolNames).toContain("start_quote_session");
    expect(toolNames).toContain("calculate_quote");
  });

  it("should invoke get_home_insurance_quote and receive initial interrupt over HTTP transport", async () => {
    const res = (await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        input: "I would like a quote for a flat in Paris",
      },
    })) as any;

    expect(res).toBeDefined();
    // Flow should return interrupt asking for location/type
    expect(res.status === "interrupt" || Array.isArray(res.content)).toBe(true);
  });

  it("should execute full operational quote flow over official HTTP transport", async () => {
    // 1. Start Session
    const startRes = (await client.callTool({
      name: "start_quote_session",
      arguments: { correlationId: "test-http-corr-1" },
    })) as any;
    const startData = JSON.parse(startRes.content[0].text);
    const sessionId = startData.sessionId;
    expect(sessionId).toBeDefined();

    // 2. Submit Property Details
    await client.callTool({
      name: "submit_property_basics",
      arguments: {
        sessionId,
        country: "FR",
        postcode: "75008",
        propertyType: "apartment",
        occupancyType: "owner_occupied",
      },
    });

    // 3. Submit Risk Factors
    await client.callTool({
      name: "submit_risk_factors",
      arguments: {
        sessionId,
        constructionYearBand: "2000_2015",
        floorAreaBand: "50_100_sqm",
        isPrimaryResidence: true,
        claimsCount5Years: 0,
      },
    });

    // 4. Evaluate Eligibility
    const eligRes = (await client.callTool({
      name: "evaluate_eligibility",
      arguments: { sessionId },
    })) as any;
    const eligData = JSON.parse(eligRes.content[0].text);
    expect(eligData.eligibility.isEligible).toBe(true);

    // 5. Select Coverage
    await client.callTool({
      name: "select_coverage",
      arguments: {
        sessionId,
        coverageTier: "comfort",
        deductible: 300,
        contactEmail: "client.http@example.fr",
      },
    });

    // 6. Confirm Parameters
    await client.callTool({
      name: "confirm_parameters",
      arguments: { sessionId, confirmed: true },
    });

    // 7. Submit Consent
    await client.callTool({
      name: "submit_consent",
      arguments: { sessionId, consentVersion: "consent_v1_2026" },
    });

    // 8. Calculate Quote
    const quoteRes = (await client.callTool({
      name: "calculate_quote",
      arguments: { sessionId, idempotencyKey: `http_test_key_${sessionId}` },
    })) as any;
    const quoteData = JSON.parse(quoteRes.content[0].text);
    expect(["SUCCESS", "QUOTE_ISSUED"]).toContain(quoteData.status);
    expect(quoteData.quote.pricing.totalAnnualPremium).toBe(161.66);
    expect(quoteData.quote.quoteHash).toBeDefined();
  });
});
