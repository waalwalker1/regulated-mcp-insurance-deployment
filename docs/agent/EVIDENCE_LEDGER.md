# Evidence Ledger

| Claim ID | Candidate Claim | Evidence Path / Command | Measured? | Public Wording Allowed | Status |
|---|---|---|---|---|---|
| **EVD-001** | Zero-credential local demonstration | `make demo` (runs local simulated MCP flow) | Verified | "Runs locally in zero-credential demonstration mode without paid API keys." | Verified |
| **EVD-002** | Deterministic pricing & eligibility calculation | `packages/rules/src/pricing.ts`, unit tests in `packages/rules/test/pricing.test.ts` | Verified | "All pricing calculations and eligibility determinations are executed server-side via deterministic pure functions." | Verified |
| **EVD-003** | Server-owned validation rejecting model tampering | `packages/domain/src/schemas.ts`, integration tests in `tests/adversarial.test.ts` | Verified | "Validation schemas strictly enforce bounds, rejecting unauthenticated or malformed assistant inputs." | Verified |
| **EVD-004** | Mandatory consent gating before final quote | `packages/domain/src/state-machine.ts`, test in `tests/consent-gate.test.ts` | Verified | "Enforces explicit user consent verification prior to final quote generation or email transmission." | Verified |
| **EVD-005** | Append-only audit trail with tamper-evident hash chaining | `packages/audit/src/audit-store.ts`, test in `packages/audit/test/audit.test.ts` | Verified | "Every state transition emits structured, append-only audit events with cryptographic hash chaining." | Verified |
| **EVD-006** | Session isolation & concurrency safety | `tests/session-isolation.test.ts` | Verified | "Session storage strictly isolates customer states, preventing cross-tenant leakage." | Verified |
| **EVD-007** | Reproducible evaluation suite | `make eval`, output at `artifacts/evals/flow-evaluation.json` | Verified | "Includes a 24-scenario automated evaluation suite testing edge cases, corrections, and adversarial inputs." | Verified |
| **EVD-008** | Hosted vs. Self-Hosted Enterprise Reference Architectures | `docs/fde/07-hosted-vs-self-hosted-decision-matrix.md`, `docs/architecture/` | Verified | "Provides complete architecture blueprints, data-flow diagrams, and decision matrices for SaaS vs. VPC deployments." | Verified |
| **EVD-009** | 30+ Question Enterprise Security Questionnaire Library | `docs/procurement/12-security-questionnaire-sample.md` | Verified | "Contains a 35-question enterprise security questionnaire with technical evidence cross-references." | Verified |
| **EVD-010** | Production cloud deployment at an actual insurer | N/A | No (Not measured / Not performed) | **FORBIDDEN:** Do not claim real-world production deployment or formal regulatory certification. | Blocked from public claim |
