# Client Technical Discovery Questionnaire

> **Purpose:** FDE guide for enterprise technical workshops with insurance client stakeholders (Underwriting, IT Security, Cloud Architecture, Legal/Compliance).

---

## 1. Business Objectives & Channel Scope
1. **Primary Channels:** Which client interfaces will connect to the MCP server? (e.g. Internal agent desktop, public conversational assistant, third-party broker aggregator, mobile app).
2. **Product Scope:** Which property insurance lines are in scope for automated quoting? (e.g. Homeowners, Tenant/Renters, Landlords, Secondary Residences).
3. **Territorial Reach:** Which European countries/postal regions require support? What are the expected postal code validation formats?
4. **Target Volume & SLA:** What is the anticipated peak quote volume (requests per second)? What is the target latency p95? (Target: <200ms for deterministic pricing).

---

## 2. Underwriting & Pricing Rules
1. **Actuarial Source of Truth:** Will pricing coefficients be maintained directly in Northstar versioned code files (`packages/rules/src/v1.ts`) or fetched via an existing actuarial REST API?
2. **Referral Thresholds:** What specific conditions trigger an automatic referral to a human underwriter? (e.g. Claims $\ge 3$, property value $> €1,000,000$, flood risk zones).
3. **Rule Versioning Cadence:** How frequently do underwriting rule sets change? How long must historical quote rules be retained for deterministic replay?

---

## 3. Data Protection & Regulatory Compliance
1. **GDPR / Data Minimization:** Can the quoting flow execute anonymously without collecting national identity numbers, exact street addresses, or date of birth?
2. **Consent Text & Versioning:** What is the legal wording required for quote data processing consent under GDPR Article 6(1)(a)?
3. **Audit Trail Retention:** What is the statutory retention duration for quote audit trails? (Standard: 5–7 years).

---

## 4. Hosting & Infrastructure Topology
1. **Deployment Model:** Does the client require a **Customer VPC Deployment** (AWS, Azure, GCP, on-prem Kubernetes) or a **Dedicated EU Hosted SaaS**?
2. **Database Requirements:** Does the client mandate managed PostgreSQL with encryption at rest?
3. **Network Egress Constraints:** Is the deployment environment subject to air-gapped or egress-whitelisted security controls?
4. **Observability & SIEM:** What log forwarder / SIEM tool is used? (e.g. Datadog, Splunk, CloudWatch, Syslog).
