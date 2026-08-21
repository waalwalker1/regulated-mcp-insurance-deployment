# Production Go-Live Checklist

## T-2 Weeks (Pre-Flight Alignment)
- [x] Security Questionnaire approved by Client CISO.
- [x] DPIA inputs verified with Data Protection Officer (DPO).
- [x] Actuarial rule table frozen and unit-tested in `packages/rules/src/v1.ts`.
- [x] Session TTL set to production value ($3600\text{ s}$).

## T-48 Hours (Staging Verification)
- [x] Execute `make release-check` in clean environment.
- [x] Execute 24-scenario benchmark (`make eval`) with 100% pass rate.
- [x] Verify PostgreSQL automated health check (`pg_isready`).
- [x] Check log redaction pipeline for email masking.

## T-0 (Go-Live Deployment Window)
- [x] Deploy container images to production VPC registry.
- [x] Run smoke test suite against production `/health` and `/ready` endpoints.
- [x] Confirm MCP tool discovery from enterprise assistant gateway.
- [x] Transition primary operational ownership to client DevOps team.
