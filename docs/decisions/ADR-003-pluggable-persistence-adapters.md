# ADR-003: Pluggable Persistence Adapters (In-Memory & PostgreSQL)

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Engineering Architecture Team

## Context & Problem Statement

The reference implementation must support two primary operational modes:

1. **Zero-Credential Local Run:** Developers should be able to clone, install, test, and run interactive demonstrations immediately without requiring a running database daemon.
2. **Durable Enterprise Mode:** Enterprise deployments and integration tests require real ACID persistence with optimistic concurrency control, schema migrations, and crash recovery.

## Decision Drivers

- Immediate developer onboarding (`npm test`, `npm run demo` work instantly).
- High-fidelity enterprise persistence (real PostgreSQL schema, parameterized queries, OCC).
- Identical store interface contracts across both adapters.

## Decision Outcome

Implement clean port-and-adapter interfaces:

- `SessionStore` with `MemorySessionStore` and `PostgresSessionStore`.
- `FlowStore` with `MemoryKvStore` and `PostgresWaniwaniKvStore`.
- `AuditRepository` with `MemoryAuditRepository` and `PostgresAuditRepository`.

The store factory (`createSessionStore()`, `createWaniwaniFlowStore()`) chooses the adapter based on environment configuration (`PERSISTENCE_MODE` and `DATABASE_URL`). When PostgreSQL mode is configured, missing database configurations throw explicit configuration errors rather than falling back silently.

### Positive Consequences

- Tests can run hermetically in memory or against a live PostgreSQL container.
- Clean separation of database concerns from business logic.
- Full process restart durability verified under PostgreSQL.
