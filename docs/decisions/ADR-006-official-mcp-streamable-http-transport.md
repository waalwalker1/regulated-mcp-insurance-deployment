# ADR-006: Official Model Context Protocol (MCP) Streamable HTTP Transport

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Engineering Architecture Team

## Context & Problem Statement

The MCP server needs to support both local CLI/stdio execution and remote HTTP network deployment (e.g. within Docker or enterprise VPCs). Using unofficial or private handler hooks creates stability risks across SDK upgrades.

## Decision Drivers

- Full compliance with official Model Context Protocol specifications.
- Support for stateful and stateless HTTP JSON-RPC streaming.
- Reusable server integration in Fastify applications.

## Decision Outcome

Utilize the official `@modelcontextprotocol/sdk/server/streamableHttp.js` package's `StreamableHTTPServerTransport` with `sessionIdGenerator` and `enableJsonResponse: true`. Mount the transport under Fastify's `/mcp` route while exposing standard `/health` and `/ready` observability probes.

### Positive Consequences

- Fully standard MCP Client compatibility over `StreamableHTTPClientTransport`.
- Clean separation between transport layer and tool business logic.
