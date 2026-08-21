# Solution Requirements Specification (SRS)

## 1. Functional Requirements (FR)

- **FR-1 (Conversational Field Extraction):** The MCP server shall register tools to collect property type, occupancy, construction period, floor area, primary residence status, claims history, coverage package, deductible, and optional contact email.
- **FR-2 (Server-Side Validation):** All inputs must be strictly validated against Zod schemas. Invalid postcodes or out-of-bounds claims counts must be rejected with structured error messages.
- **FR-3 (Deterministic Actuarial Calculation):** Pricing must be calculated via pure functions multiplying base rates by risk factors, deducting deductible allowances, and applying statutory insurance tax.
- **FR-4 (Eligibility Evaluation):** Underwriting rules must assess risk eligibility and emit deterministic reason codes (`RISK_CRITERIA_MET`, `CLAIMS_THRESHOLD_EXCEEDED`, `HIGH_VALUE_HIGH_CLAIMS_REFERRAL`).
- **FR-5 (Consent Gating):** The system shall strictly block quote generation until explicit GDPR data processing consent is confirmed.
- **FR-6 (Audit Logging):** Every state transition must append a SHA-256 hashed audit record maintaining continuous chain integrity.

---

## 2. Non-Functional Requirements (NFR)

- **NFR-1 (Performance):** Deterministic quote calculation latency shall not exceed 50ms locally (p95).
- **NFR-2 (Zero-Credential Execution):** The core demonstration and test suites must execute without external API keys or cloud accounts.
- **NFR-3 (Session Isolation):** Concurrent sessions must be strictly segregated in memory and database stores.
- **NFR-4 (Security & Sanitization):** Free-form string fields must be sanitized against prompt injection and XSS payloads.
- **NFR-5 (Portability):** System must run natively on Node.js 20+ and Docker Compose.
