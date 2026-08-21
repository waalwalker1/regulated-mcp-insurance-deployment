# Behavioral STAR Interview Stories (Derived from Building This Project)

## Story 1: Handling Regulatory Invariants vs. LLM Non-Determinism
- **Situation:** Building an insurance quoting assistant requires natural conversational interaction, but EU insurance regulations prohibit unverified or non-deterministic price quotes.
- **Task:** Ensure the AI model can guide the customer without ever having authority to set prices or bypass consent.
- **Action:** Enforced an architectural boundary where the LLM is strictly an MCP tool consumer. Implemented pure TypeScript pricing functions and a state machine that hard-blocks quote issuance until cryptographic consent is registered. Added adversarial test suites proving client-forged prices are rejected.
- **Result:** Successfully built a 100% deterministic pricing core where quotes are completely reproducible and verifiable via SHA-256 fingerprints.

---

## Story 2: Addressing Enterprise Data Privacy & Residency Concerns
- **Situation:** Enterprise insurers are reluctant to adopt cloud AI funnels due to GDPR Article 6/7 compliance and fear of third-party PII exposure.
- **Task:** Design an architecture that minimizes personal data and provides a credible path to customer-controlled deployment.
- **Action:** Created data classification tables restricting quote collection to non-sensitive structural bands (e.g. area bands, construction periods) without collecting national IDs. Implemented automated PII masking in audit logs and documented both Hosted SaaS and Customer-Controlled VPC topologies with a multi-criteria decision matrix.
- **Result:** Delivered a comprehensive 32-document delivery and procurement pack including a 35-question security questionnaire ready for enterprise CISO evaluation.
