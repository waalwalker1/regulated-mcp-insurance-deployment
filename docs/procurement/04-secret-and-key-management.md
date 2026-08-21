# Secret and Key Management Policy

## 1. Secrets Inventory & Ingestion Standards

- **Zero Committed Secrets:** The repository contains zero hard-coded API keys, database passwords, or cryptographic private keys.
- **Environment Ingestion:** All configuration parameters are supplied via `.env` or system environment variables parsed at process initialization.
- **Production Key Vault:** In customer VPC deployments, secrets must be injected from enterprise secret managers (e.g. AWS Secrets Manager, Azure Key Vault, HashiCorp Vault).

---

## 2. Secret Redaction Pipeline

The audit store redactor ([`packages/audit/src/redactor.ts`](../../packages/audit/src/redactor.ts)) intercepts all metadata objects and masks strings matching `password`, `secret`, `token`, `apiKey`, `creditCard`, or `ssn` with `[REDACTED]`.
