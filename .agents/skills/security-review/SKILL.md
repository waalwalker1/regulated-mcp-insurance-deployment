---
name: security-review
description: Applies secure-by-default design, threat modeling, secret hygiene, dependency review, and adversarial testing.
---

# Security Review

Maintain a threat model covering assets, actors, trust boundaries, abuse cases, mitigations, residual risk, and explicit non-goals. Run secret scanning and dependency/security checks where practical. Treat optional cloud/API credentials as secrets and keep them out of logs. Use least privilege, input validation, output encoding, safe defaults, and deny-by-default rules on sensitive actions.
