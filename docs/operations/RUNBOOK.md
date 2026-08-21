# Operations Runbook

## 1. Local Development & Testing

```bash
# Clean install
make setup

# Run Vitest test suites (Unit, Protocol, Property, Adversarial, Integration)
make test

# Run 24-Scenario Evaluation Benchmark
make eval

# Run Interactive Demo
make demo

# Monorepo Strict Typecheck
make typecheck

# Code formatting & linting
npm run format
npm run lint
```

---

## 2. PostgreSQL Setup & Database Migrations

### Using Docker Compose
```bash
docker-compose up -d postgres
```

### Running Schema Migrations
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/northstar_insurance"
npm run db:migrate
```

The migration runner idempotently applies `packages/persistence/src/migrations/001_initial_schema.sql`.

---

## 3. Cryptographic Audit Chain Verification

To inspect and verify the tamper-evident SHA-256 audit chain for any session:

```bash
npm run audit:verify -- <sessionId>
```

Sample output:
```text
[Audit Verify] Verifying SHA-256 hash chain for session: 7151315a-0f0f-462d-b26c-0f3df75aae2c
[Audit Verify] Found 10 audit events for session.
  [1] 2026-08-21T13:25:34.770Z | session.started | Actor: user | Hash: 8f2a1b9c0d1e2f3a... (Prev: 0000000000000000...)
  [2] 2026-08-21T13:25:34.775Z | field.received | Actor: user | Hash: 3b91c8e7f4a2d109... (Prev: 8f2a1b9c0d1e2f3a...)
  ...
==> SUCCESS: Cryptographic hash chain is 100% VALID (10 events verified from genesis).
```

---

## 4. GDPR Article 17 Right to Erasure / Anonymization

To scrub PII (contact email addresses) from a session while preserving the cryptographic audit chain:

```bash
npx tsx scripts/anonymize-session.ts <sessionId>
```

This updates the persistent record, appends a `session.anonymized` audit event, and confirms hash integrity.
