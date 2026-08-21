# Privacy Policy & Data Protection Notice

## 1. Non-Binding Demonstration Scope

Northstar Home Insurance EU is a **fictional European insurance brand** created solely as a technical reference architecture. This repository does not sell real insurance policies, collect payment, or process real-world actuarial risks.

---

## 2. GDPR Principles Implemented

- **Data Minimization (Art. 5(1)(c)):** Quoting flows operate with high-level structural bands without requesting national IDs, financial account numbers, or precise coordinates.
- **Lawful Basis & Consent (Art. 6(1)(a) & Art. 7):** Quote calculations are hard-gated behind explicit, recorded consent.
- **Storage Limitation & TTL (Art. 5(1)(e)):** Ephemeral sessions expire after 3600 seconds by default.
- **Right to Erasure (Art. 17):** Supported via `scripts/anonymize-session.ts`.
- **Integrity & Confidentiality (Art. 5(1)(f)):** Sensitive contact emails are automatically masked in audit event metadata.
