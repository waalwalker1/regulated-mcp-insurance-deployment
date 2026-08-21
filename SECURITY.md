# Security Policy

## 1. Scope and Mission

The Northstar Regulated MCP Insurance Deployment Kit implements defense-in-depth architectural patterns to guarantee server-side pricing determinism, mandatory consent gating, prompt injection defense, and cryptographic audit integrity.

---

## 2. Reporting a Security Vulnerability

If you discover a potential security issue or vulnerability in this repository, please report it responsibly:

- **Email:** `security@northstar-insurance-demo.local` (Demo contact)
- **Response Target:** Initial acknowledgment within 24 hours; triage within 48 hours.
- **Please Include:** Detailed description of the vulnerability, reproduction steps, sample payload, and potential impact.

---

## 3. Security Invariants

1. **Server Authority:** Pricing calculations, eligibility checks, and consent verification are exclusively owned by compiled server functions. Model output is treated as untrusted user input.
2. **Zero Hardcoded Secrets:** Configuration must be supplied exclusively through environment variables.
3. **Data Minimization:** Quoting interactions require zero sensitive PII (no national IDs, payment details, or exact street addresses).
