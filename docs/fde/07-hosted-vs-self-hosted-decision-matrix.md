# Hosted vs. Self-Hosted Architecture Decision Matrix

> **Purpose:** Evaluation framework for enterprise procurement, risk, and architecture committees to select between Hosted SaaS and Customer VPC topologies.

---

## 1. Multi-Criteria Scoring Matrix

| Evaluation Dimension | Weight | Hosted SaaS (EU Dedicated) | Customer VPC (Self-Hosted) | Recommendation / Trade-off |
|---|---|---|---|---|
| **Data Sovereignty & Residency** | 25% | **8/10** — Hosted exclusively in EU datacenters (Paris/Frankfurt). Requires DPA & Subprocessor review. | **10/10** — Zero data leaves customer network perimeter. Full sovereign control. | Customer VPC wins if internal compliance prohibits external data processors. |
| **Operational Overhead** | 20% | **10/10** — Zero infrastructure maintenance; automated backups, patches, and version upgrades managed by vendor. | **6/10** — Insurer DevOps team must manage container lifecycle, RDS backups, and patch cycles. | Hosted SaaS wins for rapid delivery and lower ongoing TCO. |
| **Deployment Speed** | 15% | **10/10** — Provisioned in under 1 hour; pilot live in 2 weeks. | **6/10** — Requires VPC peering, IAM roles, firewall reviews (4–8 weeks). | Hosted SaaS preferred for immediate proof-of-concept. |
| **Network Egress & Isolation** | 15% | **7/10** — Outbound HTTPS egress to vendor endpoints required. | **10/10** — Supports completely air-gapped / egress-denied configurations. | Customer VPC required for strict zero-egress policies. |
| **Core System Integration** | 15% | **7/10** — Requires secure reverse-proxy / API gateway into insurer core policy admin systems. | **10/10** — Direct low-latency internal network access to core legacy databases. | Customer VPC superior for legacy on-prem integration. |
| **Compliance & Audit Scope** | 10% | **8/10** — Vendor provides SOC 2 Type II / ISO 27001 reports; shared responsibility model applies. | **9/10** — Included directly within existing insurer compliance audit boundaries. | Tied based on organizational preference. |
| **Weighted Total Score** | 100% | **8.45 / 10** | **8.60 / 10** | **Selection depends on enterprise maturity.** |

---

## 2. Selection Flowchart

```mermaid
flowchart TD
    Start[New Insurance Deployment] --> Q1{Does compliance prohibit cloud subprocessors?}
    Q1 -->|Yes| VPC[Deploy Customer-Controlled VPC]
    Q1 -->|No| Q2{Is rapid pilot (<30 days) required?}
    Q2 -->|Yes| SaaS[Deploy Hosted EU SaaS]
    Q2 -->|No| Q3{Is direct air-gapped DB access required?}
    Q3 -->|Yes| VPC
    Q3 -->|No| SaaS
```
