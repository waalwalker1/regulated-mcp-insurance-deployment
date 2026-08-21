# Logging, Monitoring, and Telemetry

## 1. Structured JSON Logging Format
All system logs output structured JSON with standard correlation fields:
```json
{
  "timestamp": "2026-08-21T12:00:00.000Z",
  "level": "info",
  "correlationId": "corr-uuid-123",
  "sessionId": "sess-uuid-456",
  "eventType": "quote.calculated",
  "actor": "server",
  "ruleVersion": "northstar-home-eu-v1",
  "metadata": {
    "quoteId": "quote-uuid-789",
    "totalAnnualPremium": 161.66
  }
}
```

---

## 2. Health & Prometheus-Compatible Metrics
The Pricing microservice exposes real-time operational telemetry at `http://localhost:3001/metrics`:
- `totalEvaluations`: Total underwriting eligibility evaluation requests.
- `totalCalculations`: Total quote calculation invocations.
- `totalRejections`: Total schema validation or consent rejections.
- `uptimeSeconds`: Cumulative service process uptime.
