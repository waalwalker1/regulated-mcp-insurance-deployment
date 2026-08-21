# Data Residency and Territorial Sovereignty Matrix

| Deployment Model | Geographic Location | Data Processing Region | Primary Storage Region | Cross-Border Transfer Mechanism | Verification Status |
|---|---|---|---|---|---|
| **Hosted SaaS (EU)** | European Union | `eu-west-3` (Paris) or `eu-central-1` (Frankfurt) | EU Sovereign Cloud Region | None. All processing and storage restricted to EU member states. | `Design recommendation` / `Vendor fact` |
| **Customer VPC (Self-Hosted)** | Customer-Controlled Datacenter / VPC | Insurer-designated AWS/Azure/GCP EU region or on-prem datacenter | Insurer RDS / On-Prem SAN | Zero external transfer. Egress blocked by customer firewall. | `Implemented in this repository` |
| **Local Demonstration Mode** | Developer Workstation | `localhost` / `127.0.0.1` | Local Memory / Local Container | None (Local machine only). | `Implemented in this repository` |
