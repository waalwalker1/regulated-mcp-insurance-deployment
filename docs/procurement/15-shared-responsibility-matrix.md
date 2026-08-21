# Shared Responsibility Matrix (Hosted vs. Customer VPC)

| Security & Compliance Domain | Hosted SaaS (EU) | Customer-Controlled VPC (Self-Hosted) |
|---|---|---|
| **Physical Datacenter Security** | Cloud Provider / Solution Vendor | Customer Cloud Provider / Datacenter Operator |
| **Container & Host Patching** | Solution Vendor | **Customer DevOps Team** |
| **Database Encryption & Backups** | Solution Vendor | **Customer Database Administrator** |
| **Network Perimeter & Firewall** | Solution Vendor (Cloudflare / WAF) | **Customer Network Security Team** |
| **Actuarial Rule Set Accuracy** | **Customer Underwriting Team** | **Customer Underwriting Team** |
| **GDPR Consent Legal Language** | **Customer Legal & Compliance Team** | **Customer Legal & Compliance Team** |
| **Model Authority & Determinism** | Solution Codebase Invariants | Solution Codebase Invariants |
| **Audit Log Archival & Retention** | Shared (Vendor storage / API export) | **Customer SIEM / Cold Storage** |
