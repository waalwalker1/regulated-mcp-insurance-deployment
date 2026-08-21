# Waniwani FDE 45-Minute Work-Sample Rehearsal Guide

> **Structure:** Live 45-minute technical discovery and architecture session simulation with enterprise stakeholders.

---

### Segment 1: Client Discovery & Requirements Alignment (00:00–05:00)

- **FDE Goal:** Rapidly frame business objective, target lines of business, and territorial scope.
- **Key Questions:**
  - "Which European territories and postal formats are in scope for phase 1?" (FR, ES, PT, DE, IT).
  - "Are actuarial formulas maintained in code or fetched via core rating APIs?"
  - "What specific loss thresholds require automatic referral to human underwriting?"
- **FDE Insight:** "We will enforce strict server-side Zod validation so malformed inputs are caught immediately at the protocol boundary."

---

### Segment 2: Architecture Sketch & Protocol Boundary (05:00–15:00)

- **FDE Goal:** Explain the separation between the conversational MCP client and the deterministic backend.
- **Key Points:**
  - The model only extracts declared fields; the server owns validation, state progression, and quote calculation.
  - Interactive interrupts allow conversational clarification without serializing raw state into model context.
  - If a user corrects a prior parameter, downstream quotes are automatically invalidated.

---

### Segment 3: Security, Privacy & Data Residency (15:00–25:00)

- **FDE Goal:** Address CISO and Compliance concerns proactively.
- **Key Points:**
  - Present Hosted SaaS (EU) vs. Customer VPC decision matrix.
  - Explain data minimization: Quoting requires zero national IDs, payment cards, or exact street coordinates.
  - Present SHA-256 tamper-evident hash chaining in the audit store for non-repudiation.

---

### Segment 4: Delivery Roadmap & Governance (25:00–35:00)

- **FDE Goal:** Outline the 6-week timeline from signed deal to live deployment.
- **Key Points:**
  - Review Definition of Ready (DoR) and Definition of Done (DoD).
  - Walk through RACI matrix and UAT plan (24 automated scenarios).
  - Explain operational rollback triggers and GDPR Article 17 erasure utilities.

---

### Segment 5: Procurement Q&A & Technical Defense (35:00–45:00)

- **FDE Goal:** Confidently answer enterprise committee questions using evidence tags from the repository.
- **Sample Defense:**
  - _Interviewer:_ "What prevents an LLM prompt injection from issuing a €0 quote?"
  - _FDE Response:_ "Input sanitizers flag injection patterns, but fundamentally, the pricing engine is a pure server-side function (`calculatePricing`). The client payload does not accept premium overrides."
