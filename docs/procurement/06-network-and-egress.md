# Network Architecture and Egress Controls

## 1. Network Boundary Map
- **Ingress:** MCP Server listens on port 3000 (Stdio or HTTP reverse-proxy). Pricing service listens on port 3001.
- **Inter-Service Communication:** MCP Server communicates with Pricing Service via internal VPC network (`http://pricing-service:3001`).
- **Database Traffic:** Port 5432 strictly restricted to internal container subnet.

---

## 2. Zero-Egress Mode Support
In self-hosted VPC deployments, the entire Northstar kit can operate with **zero outbound internet egress**. The only network boundary required is the local connection to the insurer-approved enterprise LLM gateway. No telemetry, crash reports, or analytics are sent externally by default.
