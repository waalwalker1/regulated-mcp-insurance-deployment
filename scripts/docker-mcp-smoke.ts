import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function runDockerMcpSmoke() {
  const mcpUrl = process.env.MCP_SERVER_URL || "http://localhost:3000/mcp";
  console.log(`[Docker MCP Smoke] Connecting to MCP server at: ${mcpUrl}`);

  const client = new Client(
    { name: "docker-mcp-smoke-client", version: "0.3.1" },
    { capabilities: {} },
  );

  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));

  try {
    await client.connect(transport);
    console.log(
      "[Docker MCP Smoke] Connected to MCP server over Streamable HTTP.",
    );

    // 1. Verify Tools List
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((t) => t.name);
    console.log(`[Docker MCP Smoke] Discovered tools: ${toolNames.join(", ")}`);

    if (!toolNames.includes("get_home_insurance_quote")) {
      throw new Error(
        "Expected 'get_home_insurance_quote' tool to be registered on MCP server",
      );
    }

    // 2. Execute initial conversational flow invocation
    console.log(
      "[Docker MCP Smoke] Invoking 'get_home_insurance_quote' with initial utterance...",
    );
    const callResult = await client.callTool({
      name: "get_home_insurance_quote",
      arguments: {
        input: "I need home insurance for an apartment in Madrid",
      },
    });

    const textContent = (callResult.content as any[])?.[0]?.text;
    if (!textContent) {
      throw new Error("No text content returned from get_home_insurance_quote");
    }

    const parsed = JSON.parse(textContent);
    console.log(
      `[Docker MCP Smoke] Response status: ${parsed.status}, message: ${parsed.message || parsed.prompt}`,
    );

    if (parsed.status !== "interrupt") {
      throw new Error(
        `Expected flow to interrupt for property details, got: ${parsed.status}`,
      );
    }

    console.log(
      "==> [Docker MCP Smoke] SUCCESS: Live containerized MCP Streamable HTTP transport verified.",
    );
  } finally {
    await client.close().catch(() => {});
  }
}

runDockerMcpSmoke().catch((err) => {
  console.error(`[Docker MCP Smoke Error] Smoke test failed: ${err.message}`);
  process.exit(1);
});
