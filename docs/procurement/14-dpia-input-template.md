# Data Protection Impact Assessment (DPIA) Input Template

> **Purpose:** Technical inputs for enterprise Data Protection Officers (DPOs) conducting a DPIA under GDPR Article 35.

---

## 1. Description of Processing Operations
- **Nature of Processing:** Collection of non-sensitive property and risk factors to calculate indicative home insurance premiums via MCP conversational tools.
- **Data Minimization:** No government IDs, date of birth, exact street addresses, or payment card details are collected.
- **Lawful Basis:** Explicit Consent under GDPR Article 6(1)(a) and Article 7, verified by server before quote calculation.

---

## 2. Assessment of Necessity & Proportionality
- **Proportionality:** Quoting relies only on high-level bands (e.g. `50_100_sqm`, `2000_2015`) rather than granular personal details.
- **Retention:** Session state expires after 3600 seconds; optional contact email is purged upon session completion.

---

## 3. Privacy Risk Mitigations

| Identified Risk | Severity | Implemented Technical Mitigation | Residual Risk |
|---|---|---|---|
| Unlawful data processing without consent | HIGH | Server-side consent gate throws `[CONSENT_REQUIRED]` if consent is absent | LOW |
| PII exposure in system logs | MEDIUM | Automated redactor masks email addresses before audit log persistence | LOW |
| Cross-tenant session data leakage | HIGH | UUID-keyed session store with strict tenant isolation | LOW |
| Tampering with audit logs | MEDIUM | SHA-256 cryptographic hash chaining prevents undetected retroactive alteration | LOW |
