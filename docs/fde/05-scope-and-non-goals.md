# Scope and Non-Goals

## 1. In-Scope Deliverables (P0 / P1)
- **MCP Funnel Gateway:** `@modelcontextprotocol/sdk` and `@waniwani/sdk` state machine with interrupts, correction loops, and consent gating.
- **Deterministic Rules Engine:** Pure-function calculation for pricing, deductible discounts, tax calculations, and eligibility checks.
- **Dual Persistence Adapters:** Local zero-credential in-memory store and Docker Compose PostgreSQL adapter.
- **Cryptographic Audit Store:** Append-only SHA-256 hash chaining event logger with PII redaction.
- **Comprehensive Enterprise Pack:** 16 FDE delivery documents, 16 procurement/security evidence documents, and STRIDE threat model.
- **Verification Suite:** 32 Vitest unit/integration tests and 24-scenario automated evaluation benchmark.

---

## 2. Explicit Non-Goals
1. **Binding Insurance Policy Issuance:** This repository provides an **indicative, non-binding quote reference kit**. It does not bind formal insurance policies or collect legal payment.
2. **Proprietary Insurer Actuarial Systems:** Does not replicate proprietary black-box actuarial models or scrape live insurance portals.
3. **Certified Legal Compliance Claims:** Documents provide architectural templates and evidence answers, not formal SOC 2, ISO 27001, or GDPR certification.
4. **Complex Frontend GUI:** Focus is strictly on the protocol, state machine, enterprise documentation, and developer experience rather than consumer web UI styling.
