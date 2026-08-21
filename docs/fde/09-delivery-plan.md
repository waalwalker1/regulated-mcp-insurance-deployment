# Enterprise Delivery Plan (Signed Deal to Live Deployment)

```mermaid
gantt
    title Enterprise Delivery Roadmap (6 Weeks)
    dateFormat  YYYY-MM-DD
    section Discovery
    Architecture Workshop & Discovery       :done,    des1, 2026-09-01, 2026-09-05
    Security & DPIA Review                  :done,    des2, 2026-09-06, 2026-09-12
    section Build & Rule Config
    Rule Matrix & Formula Configuration     :active,  bld1, 2026-09-13, 2026-09-19
    Persistence & Health Check Integration  :active,  bld2, 2026-09-20, 2026-09-26
    section QA & UAT
    Automated Regression (24 Scenarios)     :         uat1, 2026-09-27, 2026-10-03
    Business Acceptance & Audit Testing     :         uat2, 2026-10-04, 2026-10-10
    section Go-Live
    Production Staging Deployment           :         gol1, 2026-10-11, 2026-10-14
    Final Go-Live & Operational Handover    :         gol2, 2026-10-15, 2026-10-16
```

---

## Weekly Milestone Breakdown
- **Week 1 (Discovery & Scoping):** Execute discovery questionnaire, finalize RTM, lock in/out of scope definitions.
- **Week 2 (Security & Compliance):** Deliver security questionnaire response library, DPIA input data flows, and threat model review.
- **Week 3 (Actuarial Integration):** Configure country base rates and risk multipliers in `packages/rules/src/v1.ts`. Run unit tests.
- **Week 4 (Infrastructure Setup):** Stand up Docker Compose or customer VPC container instances. Validate PostgreSQL schema migrations and TTL expiry.
- **Week 5 (UAT & Adversarial QA):** Execute 24-scenario benchmark suite. Verify 100% pass rate and unbroken audit hash chains.
- **Week 6 (Go-Live & Handover):** Execute production go-live checklist, train operational support staff, and transition to BAU.
