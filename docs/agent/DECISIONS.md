# Architecture Decision Records (ADRs)

## ADR-001 — Monorepo Architecture with Strict TypeScript
- **Date:** 2026-08-21
- **Status:** Accepted
- **Context:** Need clean separation between the domain logic, deterministic rules, state persistence, audit trail, and MCP server application.
- **Options Considered:** 
  1. Monolithic single-package application.
  2. Polyrepo.
  3. TypeScript monorepo with dedicated domain, rules, audit, persistence, and mcp-server packages/apps.
- **Decision:** Use an npm/Node.js workspace monorepo layout (`apps/mcp-server`, `packages/domain`, `packages/rules`, `packages/persistence`, `packages/audit`, `packages/security`).
- **Evidence:** Clean architectural boundaries prevent circular dependencies and guarantee that the LLM/MCP layer cannot mutate domain state without passing through the deterministic rules and state machine.
- **Consequences:** Requires root workspace build orchestration and explicit package exports.
- **Reversal Trigger:** If monorepo workspace resolution complicates local zero-install demonstration.

---

## ADR-002 — Deterministic Server Authority over Quote Progression and Pricing
- **Date:** 2026-08-21
- **Status:** Accepted
- **Context:** AI models in regulated domains can hallucinate prices, eligibility criteria, or consent states.
- **Options Considered:**
  1. LLM evaluates eligibility and generates quote parameters from prompt rules.
  2. Hybrid where LLM suggests price and server verifies.
  3. Strict server ownership: LLM only extracts candidate conversational inputs; server validates via Zod, checks versioned eligibility rules, computes prices via deterministic formulas, and gates final presentation behind explicit consent.
- **Decision:** Strict server ownership. The LLM has zero authority to set, adjust, or bypass pricing or eligibility.
- **Evidence:** Regulatory compliance requirements (EU AI Act, insurance market conduct) prohibit nondeterministic automated financial commitments without auditability.
- **Consequences:** All state transitions and calculations must have explicit unit, property, and integration tests proving that unauthorized payloads are rejected.
- **Reversal Trigger:** None — this is a core P0 architectural invariant.

---

## ADR-003 — Dual-Mode Persistence (Local In-Memory / Dockerized PostgreSQL)
- **Date:** 2026-08-21
- **Status:** Accepted
- **Context:** Must provide a zero-credential, zero-dependency instant local path for interview reviewers while demonstrating enterprise-grade durable storage.
- **Options Considered:**
  1. In-memory storage only.
  2. Mandatory PostgreSQL requiring Docker to run any test.
  3. Dual-adapter store interface (`SessionStore`) supporting local in-memory fallback by default and durable PostgreSQL via Docker Compose.
- **Decision:** Implement `SessionStore` interface with `InMemorySessionStore` (zero-credential default) and `PostgresSessionStore` (durable mode).
- **Evidence:** Allows instant `make test` and `make demo` without external daemon dependencies while supporting full containerized persistence verification.
- **Consequences:** Both adapters must conform to identical contract tests.
- **Reversal Trigger:** If maintaining dual adapters creates excessive maintenance overhead.

---

## ADR-004 — Append-Only Application Audit Trail with SHA-256 Hash Chaining
- **Date:** 2026-08-21
- **Status:** Accepted
- **Context:** Need verifiable evidence of every state transition, validation rejection, consent grant, and calculation step.
- **Options Considered:**
  1. Standard log files.
  2. External SIEM integration only.
  3. Structured append-only event store with session correlation IDs and cryptographic hash chaining (`prev_event_hash` -> `current_event_hash`).
- **Decision:** Structured in-repository append-only event store with SHA-256 hash chaining.
- **Evidence:** Provides tamper-evident audit trails that can be inspected during demos and verified in integration tests.
- **Consequences:** Events must be sanitized/redacted before storage to ensure PII minimization.
- **Reversal Trigger:** If cryptographic overhead impacts interactive response times.

---

## ADR-005 — Rule Versioning with Deterministic Replay Guarantee
- **Date:** 2026-08-21
- **Status:** Accepted
- **Context:** Insurance pricing and eligibility rules change over time. Historical quotes must remain reproducible even when new rule versions are published.
- **Options Considered:**
  1. Single mutable rule configuration file.
  2. Database-driven dynamic rules.
  3. Explicitly versioned rule modules (`northstar-home-eu-v1`, `v2`) attached as metadata to every calculated quote.
- **Decision:** Versioned rule modules (`v1`, `v2`) with immutable formulas and coefficient sets.
- **Evidence:** Enables deterministic replay: re-running quote calculation on a stored session with `rule_version: "v1"` yields the exact identical premium and breakdown.
- **Consequences:** Rule changes require introducing a new version object rather than mutating existing tables.
- **Reversal Trigger:** None.
