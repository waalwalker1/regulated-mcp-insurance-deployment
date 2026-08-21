import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createNorthstarMcpServer } from './server.js';
import { FunnelEngine } from './funnel-engine.js';

async function runStdioServer() {
  const engine = new FunnelEngine();
  const server = createNorthstarMcpServer(engine);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('[Northstar MCP Server] Running on stdio transport.');
}

if (process.env.NODE_ENV !== 'test') {
  runStdioServer().catch((err) => {
    console.error('[Northstar MCP Server] Fatal error:', err);
    process.exit(1);
  });
}
