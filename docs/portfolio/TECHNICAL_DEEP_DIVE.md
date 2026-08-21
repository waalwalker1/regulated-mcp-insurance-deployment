# Technical Deep Dive: Deterministic MCP Architecture & Failure Modes

## 1. Why LLM-Controlled Business Funnels Fail in Regulated Industries
Traditional conversational chatbots rely on the LLM to maintain conversation context, apply business rules, and generate structured output. In insurance:
1. **Nondeterminism:** An identical customer prompt evaluated twice can produce different deductible calculations or inconsistent premium discounts.
2. **Context Loss:** Long multi-turn conversations exceed attention windows or lose earlier risk declarations.
3. **Prompt Injection:** An adversary can embed instructions in free-form address fields to bypass underwriting criteria.

---

## 2. The Deterministic Solution Pattern
The Northstar MCP reference architecture enforces **server-side state ownership**:
- **Protocol:** Uses Model Context Protocol (MCP) tool declarations with strict JSON schemas.
- **Validation:** Zod schemas reject malformed postcodes and out-of-bounds numbers prior to execution.
- **Pure Formulas:** Premium calculation is a pure function:
  $$\text{total} = \left(\text{base} \times \prod \mu_{\text{risk}} - \text{discount}\right) \times (1 + \tau)$$
- **State Invalidation on Correction:** If a customer corrects a prior parameter, the state machine resets consent, clears downstream quotes, and forces re-evaluation.

---

## 3. Failure Mode Matrix & Defenses

| Failure Mode | Impact | Repository Defense |
|---|---|---|
| **Invalid State Transition** | Assistant jumps from `INIT` to `QUOTED` | State machine validates `canTransition()` and throws `[INVALID_STATE_TRANSITION]` |
| **Tampered Premium Payload** | Client injects artificial premium | Pricing API rejects client-supplied prices and recalculates server-side |
| **Missing Consent** | Regulatory breach under GDPR Art. 6 | `generateQuote()` throws `[CONSENT_REQUIRED]` |
| **Database Failure** | Persistent store unavailable | Dual store adapter supports graceful in-memory fallback for local continuity |
| **Audit Log Tampering** | Retroactive event alteration | SHA-256 hash chaining immediately fails integrity verification |
