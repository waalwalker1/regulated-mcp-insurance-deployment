# Enterprise Discovery Notes Template

**Client Name:** [Fictional European Insurer — e.g. Northstar Mutual EU]  
**Date of Workshop:** [YYYY-MM-DD]  
**Lead FDE:** [FDE Name]  
**Client Attendees:** Head of Architecture, Underwriting Lead, Security Officer, Product Owner.

---

## 1. Executive Summary & Key Takeaways
- Client objective: Expose an automated, conversational home-insurance quote journey through internal and consumer-facing MCP assistants.
- Strict constraint: Model must NOT calculate prices or bypass consent.
- Selected deployment topology: Customer-controlled VPC / Self-Hosted Docker Compose stack.

---

## 2. Detailed Discovery Findings

### A. Underwriting & Product Scope
- **Target Countries:** France (`FR`), Spain (`ES`), Portugal (`PT`), Germany (`DE`), Italy (`IT`).
- **Required Packages:** Essential (contents only), Comfort (standard structure + contents), Premium (comprehensive).
- **Referral Criteria:** Properties with $\ge 4$ claims in past 5 years or large villas ($>250\text{ m}^2$) with previous losses must trigger `REFERRED` status.

### B. Security & Compliance
- **Data Minimization:** Quoting requires zero PII until the optional final email dispatch boundary.
- **Audit Requirement:** Cryptographic hash chaining required for non-repudiation in case of underwriting audit.
- **Log Hygiene:** Automated log redaction required for email addresses and tokens.

### C. Infrastructure & Networking
- **Persistence Target:** Local PostgreSQL cluster with automated 30-day session TTL.
- **Transport Protocol:** MCP Stdio for desktop agent tools; HTTP/SSE for browser client.

---

## 3. Action Items & Next Steps
| Action Item | Owner | Target Date | Status |
|---|---|---|---|
| Configure rule version `v1` in `packages/rules/src/v1.ts` | FDE Lead | Week 1 | Completed |
| Verify Docker Compose stack with PostgreSQL & Pricing Service | Dev Lead | Week 2 | Completed |
| Conduct Security Architecture & DPIA Review | CISO / FDE | Week 3 | Scheduled |
