# Incident Response & Escalation Interface

## 1. Severity Classification

- **SEV-1 (Critical):** Arithmetic calculation error affecting issued quotes, or consent gating failure. Target Triage: $<15\text{ mins}$, Target Resolution: $<2\text{ hours}$.
- **SEV-2 (High):** Pricing service unavailable, container crash loop, or persistent database connection failure. Target Triage: $<30\text{ mins}$, Target Resolution: $<4\text{ hours}$.
- **SEV-3 (Medium):** Individual postcode regex rejection on valid European address format. Target Resolution: $<1\text{ business day}$.

---

## 2. Technical Triage Runbook

1. Inspect live container health via `curl http://localhost:3001/health` and `/ready`.
2. Filter structured logs by `correlationId` to trace the failing session state.
3. Validate database connection using standard PostgreSQL health check (`pg_isready`).
4. If arithmetic discrepancy is suspected, execute `make test` and `make eval` against local rules.
