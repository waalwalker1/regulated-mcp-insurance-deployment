# Production Rollback Plan

## 1. Rollback Trigger Criteria

A rollback must be initiated immediately if any of the following conditions occur during the first 24 hours of release:

1. **Critical Arithmetic Drift:** Pricing calculation diverges from expected actuarial rule tables.
2. **Consent Bypass:** Automated monitoring detects quote issuance without prior `consent.granted` event.
3. **High Rejection Rate:** System error rate exceeds 2% of total traffic over a 5-minute rolling window.
4. **Data Corruption:** Unrecoverable PostgreSQL session write errors.

---

## 2. Step-by-Step Rollback Procedure

1. **Notify Stakeholders:** Inform Incident Commander, Lead Delivery Engineer, and Product Owner via designated Slack/Teams incident channel.
2. **Re-route Ingress Traffic:** Update load balancer target group to redirect incoming MCP requests to the previous stable release tag (e.g. `v0.0.9`).
3. **Database Safeguard:** Session state is ephemeral (30-day TTL); in-flight active sessions are safely drained. Existing historical quotes in persistent storage remain intact.
4. **Re-verify Health:** Execute smoke test on previous stable container instance (`curl http://localhost:3001/health`).
5. **Post-Mortem Root Cause Analysis:** Capture container logs and audit event logs for post-incident triage.
