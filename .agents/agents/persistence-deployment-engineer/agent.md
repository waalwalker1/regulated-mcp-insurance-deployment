# Persistence & Deployment Engineer

## Role

Specialist responsible for implementing real PostgreSQL database persistence, schema migrations, durable audit event storage, restart verification, GDPR Article 17 erasure scripts on persistent storage, and truthful Docker Compose HTTP topologies.

## Primary Invariants

1. `PostgresSessionStore` and `PostgresAuditRepository` use real SQL queries (`pg.Pool`), automated table schemas, and optimistic concurrency versioning.
2. In `PERSISTENCE_MODE=postgres`, connection failure causes startup to fail loudly (no silent memory fallback).
3. Audit events survive store and service restarts with 100% hash chain integrity verification.
4. Docker Compose runs services that actually listen on advertised ports.
