# ADR-001: Monorepo Architecture with Strict TypeScript

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Engineering Architecture Team

## Context & Problem Statement

Building a deterministic quotation funnel for regulated financial workflows requires strict boundaries between domain types, actuarial pricing logic, persistence mechanisms, cryptographic audit logging, and the conversational protocol interface. Placing all logic into a single monolithic file or loose scripts creates risks of circular dependencies, state leakage, and unauthorized state mutation.

## Decision Drivers

- Clean boundary separation between conversational extraction (MCP/LLM) and business authority (server-side rules).
- Independent testability of actuarial calculations, state transitions, and persistence adapters.
- Strict TypeScript compile-time guarantees across all packages.

## Considered Options

1. Single-package application with internal directory structure.
2. Multiple independent npm packages published to a registry (Polyrepo).
3. TypeScript monorepo with dedicated workspace packages (`packages/domain`, `packages/rules`, `packages/persistence`, `packages/audit`, `packages/security`, `apps/mcp-server`, `apps/pricing-service`).

## Decision Outcome

Adopt an npm/Node.js workspace monorepo layout:

- `packages/domain`: Zod schemas, state machine definitions, domain error types.
- `packages/rules`: Pure actuarial pricing formulas, underwriting eligibility evaluator, rule version registry.
- `packages/persistence`: Session storage interfaces and implementations (In-Memory, PostgreSQL).
- `packages/audit`: Append-only event store with SHA-256 hash chaining and PII redactor.
- `packages/security`: Input sanitization, prompt injection detection, data classification catalog.
- `apps/mcp-server`: Primary MCP server exposing the Waniwani quotation flow over stdio and Streamable HTTP.
- `apps/pricing-service`: Standalone Fastify microservice implementing the `PricingPort` REST contract.

### Positive Consequences

- Clean architectural boundaries prevent circular dependencies.
- Compile-time type sharing via project references and workspace paths.
- Domain rules remain pure, zero-dependency functions that can be tested in isolation.

### Negative Consequences

- Requires workspace coordination for builds and type checks.
