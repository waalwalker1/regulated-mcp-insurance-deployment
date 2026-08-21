# Interview Walkthrough Guide (5, 15, and 30-Minute Structures)

## 1. Five-Minute Executive Elevator Pitch
1. **The Problem (60 sec):** Conversational AI excels at customer interaction, but regulated insurers cannot allow LLMs to invent prices or bypass GDPR consent.
2. **The Architecture (90 sec):** Show the separation between the conversational MCP client and the deterministic server core. Run `make demo` to show an instant quote calculated in $<10\text{ ms}$.
3. **The Invariants (90 sec):** Highlight that quotes are hard-blocked without explicit consent, and state transitions are hashed in an unbroken SHA-256 chain.
4. **The Deliverable Pack (60 sec):** Show the 16 FDE delivery documents and 35-question security questionnaire that enable signed deals to go live in weeks.

---

## 2. Fifteen-Minute Technical Deep Dive
- **00:00–03:00:** Problem framing and FDE delivery ownership.
- **03:00–07:00:** MCP state graph, typed interrupts, and the state correction loop.
- **07:00–10:00:** Deterministic pricing math, versioned rule registries, and replay guarantee.
- **10:00–13:00:** Hosted vs. Self-Hosted VPC decision matrix and threat model.
- **13:00–15:00:** Running `make eval` and inspecting the 24-scenario benchmark.

---

## 3. Thirty-Minute Architecture & Live Defense
- **00:00–05:00:** Discovery & Scoping walkthrough (RTM, RACI, DoR/DoD).
- **05:00–12:00:** Protocol & State Machine code review (`apps/mcp-server/src/funnel-engine.ts`).
- **12:00–18:00:** Security, PII minimization, prompt injection defense, and cryptographic audit hashing.
- **18:00–24:00:** Hosted vs. Customer VPC trade-offs, network egress, and DPIA inputs.
- **24:00–30:00:** Q&A, failure modes, and operational handover runbooks.
