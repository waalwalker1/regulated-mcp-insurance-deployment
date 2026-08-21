# AGENTS.md — Waniwani Regulated MCP Insurance Deployment Kit

> **Mission:** Deliver a production-shaped, interview-defensible reference kit demonstrating how a European insurer exposes a deterministic, non-binding home-insurance quote funnel through Model Context Protocol (MCP) while maintaining server-owned validation, pricing, consent, auditability, and clear hosted/self-hosted deployment boundaries.

## Target-Role Context
- **Target Role:** Waniwani Forward Deployed Engineer (FDE).
- **Core Ownership:** The lifecycle between a signed enterprise deal and live deployment — discovery, architecture, procurement/security evidence, solution design, and delivery governance.
- **Brand & Affiliation:** Independent open-source technical proof-of-work built with public MIT-licensed SDKs. Not affiliated with or endorsed by Waniwani.

## Priority Tiers
- **P0 (Mandatory):** Deterministic quote domain, Zod validation, MCP funnel with interrupts/correction loops, consent gating, append-only audit trail, zero-credential local demo path, FDE discovery & solution pack, procurement/security evidence library, unit/integration/adversarial test suite, reproducible evaluation script.
- **P1 (Production Polish):** Docker Compose local stack, structured JSON logging with correlation IDs, demo scripts, interview walkthroughs.
- **P2 (Stretch):** Optional PostgreSQL/Redis adapter demonstrations, optional telemetry adapters (active only when explicit environment variables are configured).

## Non-Negotiable Invariants
1. **Server Authority:** The LLM is strictly a conversational extraction and rendering interface. The deterministic server owns state transitions, required fields, validation, eligibility, pricing calculations, rule versions, consent gating, and audit logging.
2. **Pricing Determinism:** LLM output can never directly set or alter premiums, multipliers, taxes, or eligibility outcomes.
3. **Consent Gating:** No final quote is issued or contact details processed without explicit, recorded consent.
4. **Evidence Truth:** Every claim, metric, or architectural guarantee must be backed by code, passing tests, or recorded commands. Unmeasured items must be explicitly marked as "not measured".
5. **No Paid Credential Blocker:** The core P0 workflow must run end-to-end locally with zero external API keys or cloud dependencies.

## Canonical Command Interface
```bash
make setup          # Install dependencies (idempotent, local)
make dev            # Run local interactive MCP server & quote engine
make lint           # Lint codebase (Biome / ESLint)
make typecheck      # Run TypeScript compiler checks (strict mode)
make test           # Run unit and integration test suites (Vitest)
make eval           # Execute deterministic evaluation suite and generate reports
make demo           # Run automated end-to-end demo flow with sample scenarios
make security       # Run dependency audit and local secret scans
make build          # Production bundle build
make release-check  # Aggregate all mandatory release quality gates
make clean-generated # Clean temporary build/eval artifacts
```

## Control Plane & Ledgers
- Specifications: [BUILD_SPEC.md](./BUILD_SPEC.md)
- Status Ledger: [docs/agent/STATUS.json](./docs/agent/STATUS.json)
- Task Dependency DAG: [docs/agent/TASK_DAG.md](./docs/agent/TASK_DAG.md)
- Architecture Decisions: [docs/agent/DECISIONS.md](./docs/agent/DECISIONS.md)
- Evidence Ledger: [docs/agent/EVIDENCE_LEDGER.md](./docs/agent/EVIDENCE_LEDGER.md)
- Source Snapshot: [docs/agent/SOURCE_SNAPSHOT.md](./docs/agent/SOURCE_SNAPSHOT.md)
- Assumptions Ledger: [docs/agent/ASSUMPTIONS.md](./docs/agent/ASSUMPTIONS.md)
- Release Audit: [docs/agent/RELEASE_AUDIT.md](./docs/agent/RELEASE_AUDIT.md)
- Remediation Release Audit: [docs/agent/REMEDIATION_RELEASE_AUDIT.md](./docs/agent/REMEDIATION_RELEASE_AUDIT.md)

## Subsystem & File Ownership
- **Orchestrator:** Root configs, Makefile, package coordination, releases.
- **SDK Specialist:** `apps/mcp-server/**`, SDK integration adapters, `docs/architecture/WANIWANI_SDK_NOTES.md`.
- **Domain Engineer:** `packages/domain/**`, `packages/rules/**`, deterministic pricing/eligibility.
- **Persistence & Audit:** `packages/persistence/**`, `packages/audit/**`, state lifecycle.
- **Security & Procurement:** `docs/procurement/**`, `SECURITY.md`, `PRIVACY.md`, threat models.
- **FDE Discovery Architect:** `docs/fde/**`, architecture diagrams, deployment trade-off matrices.
- **Integration QA:** `tests/**`, `evals/**`, evaluation scripts, automated regression test runs.
- **Docs & Release:** `README.md`, `docs/portfolio/**`, demo guides, changelogs.
