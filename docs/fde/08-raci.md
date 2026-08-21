# Enterprise RACI Governance Matrix

> **Roles:**
>
> - **FDE:** Forward Deployed Engineer (Lead Delivery Owner)
> - **C-ARCH:** Client Lead Architect
> - **UW:** Client Head of Underwriting / Actuarial
> - **CISO:** Client Chief Information Security Officer
> - **PM:** Client Project Manager

| Project Milestone / Activity                        | FDE       | C-ARCH    | UW    | CISO  | PM  |
| --------------------------------------------------- | --------- | --------- | ----- | ----- | --- |
| Discovery Workshop & Questionnaire Completion       | **A / R** | C         | C     | C     | I   |
| Architecture Pattern Selection (Hosted vs VPC)      | **R**     | **A**     | I     | C     | I   |
| Actuarial Rule Set Configuration (`v1` multipliers) | **R**     | I         | **A** | I     | I   |
| Input Validation & Postcode Regex Definition        | **R**     | C         | **A** | I     | I   |
| Security Questionnaire & Threat Model Sign-off      | **R**     | I         | I     | **A** | I   |
| Docker Compose / VPC Infrastructure Provisioning    | C         | **A / R** | I     | C     | I   |
| UAT Test Scenario Execution (24 Scenarios)          | **R**     | C         | **A** | I     | I   |
| DPIA & GDPR Consent Wording Approval                | C         | I         | I     | **A** | I   |
| Production Go-Live Deployment                       | **R**     | **A**     | I     | C     | C   |
| Operational Handover & Runbook Training             | **A / R** | C         | I     | I     | I   |

_Legend: **R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed._
