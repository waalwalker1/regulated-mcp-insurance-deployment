# Access Control and Least Privilege Guide

## 1. Role-Based Access Control (RBAC)
| Role | Permitted Actions | Restrictions |
|---|---|---|
| **Anonymous Quoter (User)** | Initialize quote session, submit property/risk parameters, grant consent, adjust deductible. | Cannot view other sessions; cannot directly set premium or bypass validation. |
| **Licensed Underwriter** | Review `REFERRED` sessions; inspect raw audit trail. | Read-only access to customer declared fields. |
| **System Process / Service** | Execute pricing formulas, emit audit records, delete expired sessions. | Operates in sandboxed container process without root host privileges. |
| **Administrator / DPO** | Execute GDPR Article 17 erasure script. | Access strictly logged with correlation ID and timestamp. |

---

## 2. Container Least Privilege
Dockerfiles in `apps/*/Dockerfile` build non-root execution containers using Alpine Linux base images (`node:20-alpine`) to prevent host compromise.
