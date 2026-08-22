# Technical Implementation Summary

**Reference Version:** `v0.3.1`  
**Architecture:** Model Context Protocol (MCP) Deterministic Quotation Funnel  
**Target Domain:** Regulated European Residential Insurance

---

## 1. Monorepo Package Layout

The implementation is structured as an npm workspace monorepo with clean separation between conversational protocol handling, deterministic business rules, state persistence, audit logging, and security controls:

1. **`@northstar/domain` (`packages/domain`):**
   - Zod validation schemas for European addressing (FR, ES, PT, DE, IT), property categories, occupancy types, and risk bands.
   - Domain error taxonomy (`DomainError`) and typed session state machine (`FunnelStateMachine`) with state order assertions, confirmation gating, and tiered invalidation.
2. **`@northstar/rules` (`packages/rules`):**
   - Deterministic pure-function pricing engine (`calculatePricing`) computing base rates, risk multipliers, deductible discounts, and country-specific tax levies.
   - Versioned rule registry (`northstar-home-eu-v1`, `v2`) with server-owned `RulePolicyProvider`, canonical SHA-256 quote fingerprint calculation, and historical quote replay guarantee.
   - Underwriting eligibility evaluator (`evaluateEligibility`) returning structured, machine-readable reason codes.
   - `PricingPort` abstraction supporting local in-process calculation (`LocalDeterministicPricingAdapter`) and remote HTTP service calls (`HttpPricingServiceAdapter`).
3. **`@northstar/persistence` (`packages/persistence`):**
   - Pluggable `SessionStore` supporting `MemorySessionStore` (zero-credential default with TTL) and `PostgresSessionStore` (parameterized SQL, schema migrations, optimistic concurrency control via version checking).
   - `PostgresWaniwaniKvStore` implementing `@waniwani/sdk/mcp`'s `KvStore<T>` / `FlowStore` contract for flow state persistence and process restart durability.
4. **`@northstar/audit` (`packages/audit`):**
   - Append-only `AuditStore` backed by `MemoryAuditRepository` or `PostgresAuditRepository` with continuous cryptographic SHA-256 hash chaining from session genesis.
   - Automated PII and secret redactor (`redactMetadata`) masking email addresses and auth tokens prior to event hashing.
5. **`@northstar/security` (`packages/security`):**
   - Input sanitizer scanning for prompt injection patterns and stripping dangerous script/HTML tags.
   - Enterprise data classification catalog mapping fields to sensitivity tiers, retention periods, and encryption requirements.
6. **`@northstar/pricing-service` (`apps/pricing-service`):**
   - Standalone Fastify HTTP REST microservice exposing `/health`, `/ready`, `/internal/v1/eligibility/evaluate`, and `/internal/v1/pricing/calculate`.
7. **`@northstar/mcp-server` (`apps/mcp-server`):**
   - Typed `@waniwani/sdk/mcp` flow compiled and registered as **one primary MCP tool** (`get_home_insurance_quote`) alongside operational diagnostic tools. Supports stdio transport and official `StreamableHTTPServerTransport` over HTTP.

---

## 2. System Architecture

```text
┌──────────────────────────────┐
│  MCP Client / User Assistant │
└──────────────┬───────────────┘
               │ JSON-RPC (Stdio / HTTP)
┌──────────────▼───────────────────────────────────────────────────────┐
│                      Northstar MCP Server Core                       │
│  ┌────────────────────────┐         ┌─────────────────────────────┐  │
│  │ Security Sanitizer     │         │ Waniwani Compiled Flow      │  │
│  │ (Prompt Injection / XSS│ ──────> │ (Zod StateGraph, Interrupts,│  │
│  └────────────────────────┘         │  Consent Gating, Branching) │  │
│                                     └──────────────┬──────────────┘  │
│                                                    │                 │
│  ┌────────────────────────┐         ┌──────────────▼──────────────┐  │
│  │ Persistence Adapter    │ <────── │ Server Rule Policy Provider │  │
│  │ (Memory / PostgreSQL)  │         │ (Pure Pricing & Eligibility)│  │
│  └────────────────────────┘         └──────────────┬──────────────┘  │
│                                                    │                 │
│  ┌─────────────────────────────────────────────────▼──────────────┐  │
│  │ Append-Only Audit Store (SHA-256 Hash Chain & PII Redactor)    │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Capability Matrix

| System Requirement                  | Technical Implementation                                                                                                                 | Validating Evidence                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Resumable Conversational Funnel** | Compiled `@waniwani/sdk/mcp` state graph (`createFlow`, `interrupt`, `START`, `END`) exposed as primary tool `get_home_insurance_quote`. | `tests/protocol/waniwani-mcp-e2e.test.ts`          |
| **Server-Side Pricing Authority**   | Pure-function actuarial engine in compiled TypeScript. LLM cannot set or mutate rates.                                                   | `tests/integration/rule-authority.test.ts`         |
| **Mandatory Consent Gating**        | Hard assertion blocking quotation generation until explicit user consent is recorded.                                                    | `tests/failure-injection.test.ts`                  |
| **Tamper-Evident Auditability**     | Append-only event store with continuous SHA-256 hash chaining back to session genesis.                                                   | `tests/audit.test.ts`                              |
| **Idempotency & Conflict Safety**   | Cache checking with SHA-256 fingerprinting rejecting mismatched payloads with `IDEMPOTENCY_KEY_CONFLICT`.                                | `tests/integration/idempotency.test.ts`            |
| **Optimistic Concurrency Control**  | Compare-and-swap SQL version checking throwing `CONCURRENT_MODIFICATION` on write race conditions.                                       | `tests/integration/postgres-concurrency.test.ts`   |
| **GDPR Right-to-Erasure**           | Multi-table scrubbing removing contact email from `quote_sessions` and `quote_history` while preserving audit hash chains.               | `tests/integration/anonymization-postgres.test.ts` |
| **Microservice Parity**             | `PricingPort` contract verified across local in-process adapter and Fastify HTTP microservice.                                           | `tests/integration/pricing-port-http.test.ts`      |
| **Official MCP Protocol Support**   | Standard `Server` class from `@modelcontextprotocol/sdk` supporting stdio and `StreamableHTTPServerTransport`.                           | `tests/protocol/mcp-http-transport.test.ts`        |

---

## 4. Quality Verification Commands

```bash
# 1. Monorepo strict typecheck
npm run typecheck       # 0 errors

# 2. Code formatting and linting
npm run format:check   # 100% compliant with Prettier
npm run lint           # ESLint strict parsing, 0 errors

# 3. Complete Vitest test suite
npm run test           # 26 test files passed, 76 tests passed (100%)

# 4. 24-Scenario automated evaluation benchmark
npm run eval           # 24/24 scenarios passed (100% pass rate in ~7ms)

# 5. Local zero-credential demonstration
npm run demo           # Full multi-step quote flow with audit verification

# 6. Dependency security audit
npm run security       # 0 high/critical vulnerabilities
```
