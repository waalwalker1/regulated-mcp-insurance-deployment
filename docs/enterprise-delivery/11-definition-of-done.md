# Definition of Done (DoD)

A release is declared complete and production-ready only when all of the following criteria are satisfied:

- [x] **1. 100% Test Suite Pass:** All unit, integration, and adversarial tests in `tests/` pass with zero failures.
- [x] **2. Zero Nondeterministic Pricing:** Pure-function calculation tests verify that model output cannot directly mutate pricing or eligibility.
- [x] **3. Mandatory Consent Gating Verified:** Automated test proves that quote calculation without consent is rejected with `[CONSENT_REQUIRED]`.
- [x] **4. Cryptographic Audit Chain Validated:** Evaluation run verifies unbroken SHA-256 hash chains across all session transitions.
- [x] **5. Session Isolation Confirmed:** Concurrency test proves state isolation across independent sessions.
- [x] **6. 24-Scenario Evaluation Green:** Automated evaluation benchmark (`make eval`) achieves 100% pass rate.
- [x] **7. Security & Dependency Audit Clean:** `npm audit` reports zero high/critical vulnerabilities; no secrets committed to Git.
- [x] **8. Containerized Build & Health Probes:** Docker Compose spins up with healthy status probes on `/health` and `/ready`.
- [x] **9. Complete Documentation Library:** All 16 enterprise delivery documents, 16 procurement/security documents, and operations runbooks committed.
- [x] **10. Local Zero-Credential Runnable:** `make demo` runs out-of-the-box without paid third-party API credentials.
