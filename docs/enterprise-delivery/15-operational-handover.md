# Operational Handover & Runbook Guide

## 1. Primary Component Topology

- **MCP Server:** Runs on port 3000 (Stdio or HTTP mode). Handles session state, Zod validation, and MCP protocol requests.
- **Pricing Microservice:** Runs on port 3001. Handles deterministic pricing calculations and eligibility checks.
- **PostgreSQL Database:** Port 5432. Stores durable session states and TTL expiry indices.

---

## 2. Standard Operational Runbook

### Health & Readiness Probes

```bash
# Check Pricing Service Liveness
curl -s http://localhost:3001/health

# Check Pricing Service Readiness & Active Rule Version
curl -s http://localhost:3001/ready

# Check Real-Time Execution Metrics
curl -s http://localhost:3001/metrics
```

### Session Cleanup and Right-to-Erasure (GDPR Art. 17)

```bash
# Execute On-Demand GDPR Session Anonymization
npx tsx scripts/anonymize-session.ts <SESSION_UUID>
```

### Rotating Database Credentials

1. Update `DATABASE_URL` in `.env` or AWS Secrets Manager.
2. Restart container pods sequentially to perform zero-downtime rolling reload.
3. Validate connection using `/ready` probe.
