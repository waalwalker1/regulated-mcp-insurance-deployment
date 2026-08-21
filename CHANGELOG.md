# Changelog

All notable changes to the Northstar Regulated MCP Insurance Deployment Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-08-21

### Added

- **Official Streamable HTTP Transport:** Streamable JSON-RPC HTTP transport using `@modelcontextprotocol/sdk/server/streamableHttp.js` with `/health` and `/ready` probes.
- **PostgreSQL Flow State Persistence:** `PostgresWaniwaniKvStore` enabling full restart durability of `@waniwani/sdk/mcp` flows.
- **Multi-Country Postal Validation:** Strict regex validation for FR, ES, PT, DE, IT with conversational re-asking on invalid formatting.
- **PricingPort Integration:** HTTP pricing microservice parity with local deterministic calculation functions.
- **Optimistic Concurrency Control:** Version-checked compare-and-swap SQL updates in `PostgresSessionStore`.
- **GDPR History Scrubbing:** Multi-table contact email erasure across active sessions and historical quotes.
- **Enterprise Delivery Documentation:** 16 delivery artifacts in `docs/enterprise-delivery/` and 16 procurement artifacts in `docs/procurement/`.
- **Automated Verification Suite:** 26 test files (76 tests) and 24-scenario automated evaluation benchmark.
