import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createNorthstarMcpServer, startHttpMcpServer } from './server.js';
import { FunnelEngine } from './funnel-engine.js';

async function bootstrap() {
  const transportMode = process.env.MCP_TRANSPORT || 'stdio';

  if (transportMode === 'http') {
    const port = Number(process.env.MCP_PORT || 3000);
    await startHttpMcpServer(port);
  } else {
    const engine = new FunnelEngine();
    const server = createNorthstarMcpServer(engine);
    const transport = new StdioServerTransport();

    await server.connect(transport);
    console.error('[Northstar MCP Server] Running on stdio transport.');
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error('[Northstar MCP Server] Fatal startup error:', err);
    process.exit(1);
  });
}
