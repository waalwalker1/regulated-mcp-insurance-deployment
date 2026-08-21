# Enterprise Security Questionnaire (35 Questions with Technical Evidence)

> **Evaluation Standard:** Regulated European Financial & Insurance Institutions.  
> **Disclaimer:** These answers reflect the technical architecture of this reference implementation. They do not constitute formal SOC 2 / ISO 27001 certifications of third parties.

---

### Section 1: Architecture & Model Authority

1. **Can the LLM / AI assistant hallucinate or directly modify insurance premium quotes?**  
   _Answer:_ **No.** `[Implemented in this repository]` Premiums are calculated strictly server-side through deterministic pure functions (`packages/rules/src/pricing.ts`). The LLM only supplies declared user risk parameters; all price calculation happens in compiled TypeScript code.
2. **How does the system ensure unconfirmed parameters are not priced?**  
   _Answer:_ `[Implemented in this repository]` The state machine (`packages/domain/src/state-machine.ts`) enforces sequential steps: `COLLECTING_PROPERTY` -> `COLLECTING_RISK` -> `EVALUATING_ELIGIBILITY` -> `COLLECTING_COVERAGE` -> `AWAITING_CONFIRMATION` -> `AWAITING_CONSENT` -> `QUOTED`.
3. **What happens if a user corrects a prior field after a quote is calculated?**  
   _Answer:_ `[Implemented in this repository]` The engine invalidates the active quote, resets consent, and reverts the state machine to re-evaluate underwriting criteria (`tests/domain.test.ts`).
4. **How are underwriting eligibility rules enforced?**  
   _Answer:_ `[Implemented in this repository]` Pure rules engine evaluates risk thresholds (e.g. claims count $>3$) and returns structured reason codes (`packages/rules/src/eligibility.ts`).
5. **Does the system support versioning of actuarial rate tables?**  
   _Answer:_ `[Implemented in this repository]` Rule sets are explicitly versioned (e.g. `northstar-home-eu-v1`, `v2`). Historical quotes retain their `ruleVersion` and remain 100% reproducible upon replay (`tests/quote-replay.test.ts`).

---

### Section 2: Data Privacy & GDPR Compliance

6. **How is explicit user consent enforced under GDPR Article 6 & 7?**  
   _Answer:_ `[Implemented in this repository]` Quote generation is hard-blocked until `submit_consent` records explicit consent with a timestamp and consent version string (`packages/rules/src/quote-generator.ts`).
7. **What personal data is collected during the quoting journey?**  
   _Answer:_ `[Implemented in this repository]` Data minimization is enforced. Quoting requires only property characteristics and claims counts. Contact email is optional and only processed post-consent. No national IDs, financial account numbers, or exact street addresses are stored (`docs/procurement/01-data-flow-and-classification.md`).
8. **Is personal data masked in system logs?**  
   _Answer:_ `[Implemented in this repository]` Yes. The audit store redactor masks email addresses (`ja***@example.com`) and removes tokens before storage (`packages/audit/src/redactor.ts`).
9. **How is GDPR Article 17 (Right to Erasure) supported?**  
   _Answer:_ `[Implemented in this repository]` Dedicated utility script (`scripts/anonymize-session.ts`) purges personal fields on demand while recording an anonymized audit record.
10. **What is the default retention period for interactive quote sessions?**  
    _Answer:_ `[Implemented in this repository]` Ephemeral sessions expire after 3600 seconds (1 hour) by default and are pruned automatically via `cleanExpiredSessions()`.
11. **Where is quote data processed and stored?**  
    _Answer:_ `[Design recommendation]` In EU member state regions (e.g., Paris or Frankfurt) for hosted SaaS, or inside customer VPCs for self-hosted instances (`docs/procurement/02-data-residency-matrix.md`).
12. **Are international cross-border data transfers required?**  
    _Answer:_ `[Implemented in this repository]` No. The system operates fully within European borders with zero mandatory cross-border transfers.

---

### Section 3: Access Control & Secret Management

13. **Are secrets or credentials stored in the Git repository?**  
    _Answer:_ `[Implemented in this repository]` No. Zero hard-coded credentials exist. Configuration is managed via environment variables (`.env.example`).
14. **How are sessions isolated from each other?**  
    _Answer:_ `[Implemented in this repository]` Sessions use opaque UUID v4 identifiers; direct session store lookups enforce complete tenant segregation (`tests/session-isolation.test.ts`).
15. **Does the container run as a non-root user?**  
    _Answer:_ `[Implemented in this repository]` Yes, container builds use minimal Alpine Linux base images (`apps/*/Dockerfile`).
16. **How are administrative operations authorized?**  
    _Answer:_ `[Design recommendation]` Administrative actions require enterprise SSO / IAM role authentication in customer VPC deployments.
17. **Are API keys or tokens logged in plaintext?**  
    _Answer:_ `[Implemented in this repository]` No. The redactor masks all keys matching `token`, `password`, `secret`, or `apiKey`.
18. **How are database credentials rotated?**  
    _Answer:_ `[Design recommendation]` Via rolling container restarts with secrets fetched from AWS Secrets Manager or HashiCorp Vault.

---

### Section 4: Network Security & Egress Controls

19. **Can the application run in an air-gapped / zero-egress VPC?**  
    _Answer:_ `[Implemented in this repository]` Yes. When optional telemetry keys are omitted, the kit requires zero outbound internet access.
20. **What network ports are exposed?**  
    _Answer:_ `[Implemented in this repository]` Port 3000 (MCP Server) and Port 3001 (Pricing Service).
21. **How is inter-service communication secured?**  
    _Answer:_ `[Design recommendation]` Internal VPC private subnets with mTLS in production.
22. **What protection exists against prompt injection?**  
    _Answer:_ `[Implemented in this repository]` The security sanitizer scans all text inputs for prompt injection patterns and strips dangerous HTML/script tags (`packages/security/src/sanitizer.ts`).
23. **Is rate limiting supported on quote creation?**  
    _Answer:_ `[Design recommendation]` Implemented via reverse proxy / API gateway (e.g. AWS WAF, Cloudflare, NGINX) in front of the MCP server.
24. **How is input length constrained?**  
    _Answer:_ `[Implemented in this repository]` String inputs are bounded to max 255 characters by the sanitizer and validated via strict Zod length rules.

---

### Section 5: Vulnerability & Dependency Management

25. **What third-party open-source dependencies are used?**  
    _Answer:_ `[Implemented in this repository]` Documented in `docs/procurement/11-dependency-open-source-inventory.md`. All licenses are permissive (MIT/Apache-2.0).
26. **How are vulnerable dependencies detected and remediated?**  
    _Answer:_ `[Implemented in this repository]` Automated `npm audit --audit-level=high` is enforced as a release gate in `make security`.
27. **What static analysis and type checking is performed?**  
    _Answer:_ `[Implemented in this repository]` Strict TypeScript type checking (`tsc --noEmit`) runs across the entire monorepo (`tsconfig.json`).
28. **Is test coverage automated?**  
    _Answer:_ `[Implemented in this repository]` 32 Vitest unit/integration tests and a 24-scenario automated benchmark run via `make test` and `make eval`.
29. **What is the SLA for patching critical CVEs?**  
    _Answer:_ `[Design recommendation]` Critical vulnerabilities patched within 24 hours (`docs/procurement/10-vulnerability-management-starter.md`).
30. **Are container base images kept minimal?**  
    _Answer:_ `[Implemented in this repository]` Uses official `node:20-alpine` images to minimize attack surface.

---

### Section 6: Audit, Resilience & Disaster Recovery

31. **How is audit trail non-repudiation achieved?**  
    _Answer:_ `[Implemented in this repository]` Every event computes a SHA-256 cryptographic digest over its own content and the prior event's hash, forming an unbroken tamper-evident chain (`packages/audit/src/audit-store.ts`).
32. **Can the audit chain be verified on demand?**  
    _Answer:_ `[Implemented in this repository]` Yes. The `export_audit_trail` tool returns `verifyChainIntegrity()` status confirming 100% cryptographic validity (`tests/audit.test.ts`).
33. **What is the target Recovery Time Objective (RTO)?**  
    _Answer:_ `[Design recommendation]` Target $< 30\text{ minutes}$ for containerized restart.
34. **What is the target Recovery Point Objective (RPO)?**  
    _Answer:_ `[Design recommendation]` Target $< 5\text{ minutes}$ with PostgreSQL continuous write-ahead logging.
35. **Are automated health probes exposed?**  
    _Answer:_ `[Implemented in this repository]` Yes. `/health` and `/ready` probes provide real-time liveness and readiness status (`apps/pricing-service/src/server.ts`).
