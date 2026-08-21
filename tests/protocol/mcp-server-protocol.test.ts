import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createNorthstarMcpServer } from '../../apps/mcp-server/src/server.js';
import { FunnelEngine } from '../../apps/mcp-server/src/funnel-engine.js';
import { InMemorySessionStore } from '../../packages/persistence/src/index.js';
import { AuditStore } from '../../packages/audit/src/index.js';

describe('MCP Protocol Client Transport Tests', () => {
  it('should list tools and discover the primary Waniwani flow tool', async () => {
    const engine = new FunnelEngine(new InMemorySessionStore(), new AuditStore());
    const server = createNorthstarMcpServer(engine);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client(
      { name: 'test-mcp-client', version: '1.0.0' },
      { capabilities: {} }
    );

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport)
    ]);

    const toolsResult = await client.listTools();
    expect(toolsResult.tools.length).toBeGreaterThan(0);

    const flowTool = toolsResult.tools.find((t) => t.name === 'get_home_insurance_quote');
    expect(flowTool).toBeDefined();
    expect(flowTool?.description).toContain('European residential property insurance');

    await client.close();
    await server.close();
  });

  it('should execute start session and calculate quote via MCP client protocol', async () => {
    const engine = new FunnelEngine(new InMemorySessionStore(), new AuditStore());
    const server = createNorthstarMcpServer(engine);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client(
      { name: 'test-mcp-client', version: '1.0.0' },
      { capabilities: {} }
    );

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport)
    ]);

    // 1. Start Session
    const startRes = await client.callTool({ name: 'start_quote_session', arguments: {} }) as any;
    const startPayload = JSON.parse(startRes.content[0].text);
    const sessionId = startPayload.sessionId;
    expect(sessionId).toBeDefined();

    // 2. Submit Property Basics
    await client.callTool({
      name: 'submit_property_basics',
      arguments: {
        sessionId,
        country: 'FR',
        postcode: '75008',
        propertyType: 'apartment',
        occupancyType: 'owner_occupied'
      }
    });

    // 3. Submit Risk Factors
    await client.callTool({
      name: 'submit_risk_factors',
      arguments: {
        sessionId,
        constructionYearBand: '2000_2015',
        floorAreaBand: '50_100_sqm',
        isPrimaryResidence: true,
        claimsCount5Years: 0
      }
    });

    // 4. Evaluate Eligibility
    await client.callTool({
      name: 'evaluate_eligibility',
      arguments: { sessionId }
    });

    // 5. Select Coverage
    await client.callTool({
      name: 'select_coverage',
      arguments: {
        sessionId,
        coverageTier: 'comfort',
        deductible: 300
      }
    });

    // 6. Confirm Parameters
    await client.callTool({
      name: 'confirm_quote_parameters',
      arguments: {
        sessionId,
        confirmed: true
      }
    });

    // 7. Consent Gate Invariant: Attempt calculation prior to consent
    const earlyCalc = await client.callTool({
      name: 'calculate_quote',
      arguments: { sessionId }
    }) as any;
    expect(earlyCalc.isError).toBe(true);
    expect(earlyCalc.content[0].text).toContain('CONSENT_REQUIRED');

    // 8. Grant Consent
    await client.callTool({
      name: 'submit_consent',
      arguments: {
        sessionId,
        consentVersion: 'consent_v1_2026'
      }
    });

    // 9. Calculate Quote
    const calcRes = await client.callTool({
      name: 'calculate_quote',
      arguments: { sessionId }
    }) as any;
    expect(calcRes.isError).toBeUndefined();
    const calcPayload = JSON.parse(calcRes.content[0].text);
    expect(calcPayload.status).toBe('QUOTE_ISSUED');
    expect(calcPayload.quote.pricing.totalAnnualPremium).toBe(161.66);

    await client.close();
    await server.close();
  });
});
