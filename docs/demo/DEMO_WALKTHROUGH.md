# Technical Demonstration & Architecture Walkthrough

This guide outlines structured walkthroughs for presenting the deterministic MCP quotation architecture to engineering teams, architects, and stakeholders.

---

## 1. Five-Minute Overview

1. **The Architectural Problem (60 sec):** Conversational AI interfaces excel at customer data extraction, but regulated financial workflows cannot allow LLMs to invent prices, bypass mandatory consent, or create unauditable transactions.
2. **The Server-Authority Pattern (90 sec):** Demonstrate the clean separation between conversational MCP extraction and the deterministic server core. Run `npm run demo` to show an end-to-end quote lifecycle calculated in $<10\text{ ms}$.
3. **Hard Invariants (90 sec):** Highlight that quotation calculations are strictly blocked until explicit GDPR data processing consent is recorded, with every lifecycle event cryptographically hashed into an unbroken SHA-256 chain.
4. **Enterprise Delivery Artifacts (60 sec):** Review the enterprise delivery pack (`docs/enterprise-delivery/`) and security questionnaire (`docs/procurement/12-security-questionnaire-sample.md`).

---

## 2. Fifteen-Minute Technical Deep Dive

- **00:00–03:00:** Problem framing and trust boundaries.
- **03:00–07:00:** MCP state graph, typed interrupts, country-specific regex validation, and state correction loops (`apps/mcp-server/src/waniwani-flow.ts`).
- **07:00–10:00:** Deterministic pricing math, versioned rule registries, and replay guarantees (`packages/rules/src/v1.ts`).
- **10:00–13:00:** Hosted vs. Self-Hosted VPC decision matrix and STRIDE threat model (`docs/architecture/`).
- **13:00–15:00:** Running `npm run eval` and inspecting the 24-scenario multi-country evaluation benchmark.

---

## 3. Thirty-Minute Architecture & Code Review

- **00:00–05:00:** Discovery & Requirements review (RTM, RACI, Definition of Ready/Done).
- **05:00–12:00:** Protocol & State Machine code review (`apps/mcp-server/src/funnel-engine.ts`, `apps/mcp-server/src/server.ts`).
- **12:00–18:00:** Security, PII minimization, prompt injection defense, and cryptographic audit hashing (`packages/audit/`, `packages/security/`).
- **18:00–24:00:** Hosted vs. Customer VPC trade-offs, network egress, and DPIA inputs (`docs/enterprise-delivery/07-hosted-vs-self-hosted-decision-matrix.md`).
- **24:00–30:00:** Failure modes, optimistic concurrency control, database migrations, and operational runbooks (`docs/operations/RUNBOOK.md`).
