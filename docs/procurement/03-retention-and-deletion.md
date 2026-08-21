# Retention, Archival, and Deletion Policy

## 1. Retention Schedule

| Data Category | Target Entity | Standard Retention Period | Deletion Trigger / Automation |
|---|---|---|---|
| **Active Session State** | Ephemeral quotation parameters | 30 days (Default: $3600\text{ s}$ interactive TTL) | Automated TTL pruning via `cleanExpiredSessions()` |
| **Contact PII (Email)** | Optional email for quote dispatch | 0–30 days | Anonymized immediately upon dispatch or purged at session expiry |
| **Audit Event Records** | Cryptographic SHA-256 event log | 7 years (Statutory European insurance requirement) | Retained in cold append-only storage for compliance verification |
| **Versioned Underwriting Rules** | Code files (`v1.ts`, `v2.ts`) | Permanent | Retained for historical quote replay reproducibility |

---

## 2. GDPR Article 17 (Right to Erasure) Workflow
1. Customer requests deletion of their personal quote interaction.
2. Operator invokes the anonymization script:
   ```bash
   npx tsx scripts/anonymize-session.ts <SESSION_UUID>
   ```
3. The utility replaces all email strings with `[DELETED_GDPR_ART17]`, removes validated email fields, and records a final `session.completed` audit event noting erasure completion.
