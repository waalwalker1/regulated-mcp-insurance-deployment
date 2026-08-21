# Security Evidence Index

> **Purpose:** Index of technical controls and verifiable evidence in the repository for enterprise security and procurement evaluations.

## Taxonomy of Evidence Claims
Every statement in this procurement pack uses one of the following precise classifications:
- `Implemented in this repository` — Verifiable via code, passing tests, or executable commands.
- `Design recommendation` — Best practice architecture blueprint for customer production VPC.
- `Customer decision` — Choice owned by the customer's enterprise risk/compliance committee.
- `Vendor/platform fact — verify with vendor` — Upstream facts regarding external integrations.
- `Not applicable to local demo` — Relevant only in production multi-region cloud deployments.

---

## Technical Evidence Mapping

| Control Category | Implemented Control in Repository | Source File Path | Validating Test / Evidence |
|---|---|---|---|
| **Input Validation** | Strict Zod schema & country-specific regex validation | `packages/domain/src/schemas.ts` | `tests/domain.test.ts` |
| **Pricing Determinism** | Server-side pure-function pricing calculation | `packages/rules/src/pricing.ts` | `tests/pricing.test.ts`, SCN-001 |
| **Consent Enforcement** | Mandatory consent verification before quote issuance | `packages/rules/src/quote-generator.ts` | `tests/mcp-funnel.test.ts`, SCN-008 |
| **Audit Integrity** | SHA-256 cryptographic hash chaining across events | `packages/audit/src/audit-store.ts` | `tests/audit.test.ts`, SCN-013 |
| **Log Minimization** | Automated email and secret token redaction in logs | `packages/audit/src/redactor.ts` | `tests/audit.test.ts` |
| **Session Isolation** | Memory and Postgres UUID-isolated session stores | `packages/persistence/src/memory-store.ts` | `tests/session-isolation.test.ts`, SCN-014 |
| **Adversarial Defense** | Prompt injection pattern detection & XSS stripping | `packages/security/src/sanitizer.ts` | `tests/security.test.ts`, SCN-009 |
| **Rule Versioning** | Immutable versioned rule registry with replay guarantee | `packages/rules/src/registry.ts` | `tests/quote-replay.test.ts`, SCN-012 |
