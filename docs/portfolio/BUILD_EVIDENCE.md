# Build Evidence & Measured Test Metrics

## 1. Measured Verification Summary

| Verification Category | Command Executed | Total Scenarios / Tests | Measured Result |
|---|---|---|---|
| **Static Typecheck** | `npm run typecheck` (`tsc --noEmit`) | Monorepo root + 5 packages + 2 apps | **0 Errors (Strict Mode Pass)** |
| **Unit & Integration Suite** | `npm run test` (`vitest run`) | 11 test files, 32 tests | **32 Passed (100% Pass Rate)** |
| **Automated Evaluation Benchmark** | `npm run eval` (`scripts/run-eval.ts`) | 24 automated scenarios | **24 Passed (100% Pass Rate, 10ms execution)** |
| **Local Demonstration Flow** | `npm run demo` (`scripts/demo-flow.ts`) | 11 lifecycle steps | **11/11 Verified (Chain Integrity Valid)** |
| **Dependency Security Audit** | `npm run security` (`npm audit --audit-level=high`) | 193 packages | **0 Vulnerabilities Found** |

---

## 2. Unmeasured / Explicit Non-Claims
- **Real Insurer Production Deployment:** Not performed. This repository is an independent technical reference architecture.
- **Formal SOC 2 / ISO 27001 Certification:** Not measured / Not applicable to standalone open-source kits.
- **Real Customer PII / Live Actuarial Binding:** Not performed. Operates strictly with synthetic, transparent demonstration data.
