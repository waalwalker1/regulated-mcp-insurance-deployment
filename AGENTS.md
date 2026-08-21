# AGENTS.md — Regulated MCP Insurance Reference Architecture

> **Mission:** Deliver a production-shaped open-source reference implementation demonstrating how a European insurer exposes a deterministic, non-binding home-insurance quote funnel through Model Context Protocol (MCP) while maintaining server-owned validation, pure pricing rules, consent gating, and tamper-evident auditability.

---

## Architectural Invariants

1. **Server Authority:** The conversational model is strictly an extraction and rendering interface. The compiled server owns state transitions, required fields, validation, eligibility, pricing calculations, rule versions, consent gating, and audit logging.
2. **Pricing Determinism:** AI outputs can never directly set or alter premiums, risk multipliers, taxes, or eligibility outcomes.
3. **Consent Gating:** No final quote is issued or contact details processed without explicit, recorded user consent.
4. **Truth in Evidence:** Every claim, metric, or architectural guarantee must be backed by passing code and automated tests. Unmeasured items must be explicitly marked as "not measured".
5. **Zero-Credential Local Run:** The core workflow must run end-to-end locally with zero external API keys or cloud dependencies.

---

## Developer Command Interface

```bash
make setup          # Install dependencies (idempotent, local)
make dev            # Run local interactive MCP server & quote engine
make lint           # Lint codebase (ESLint)
make typecheck      # Run TypeScript compiler checks (strict mode)
make test           # Run unit and integration test suites (Vitest)
make eval           # Execute deterministic evaluation suite and generate reports
make demo           # Run automated end-to-end demo flow with sample scenarios
make security       # Run dependency audit and local secret scans
make build          # Production bundle build
make release-check  # Aggregate all mandatory release quality gates
make clean-generated # Clean temporary build/eval artifacts
```

---

## Architecture & Verification Ledgers

- Implementation Summary: [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md)
- Verification Matrix: [docs/VERIFICATION_MATRIX.md](./docs/VERIFICATION_MATRIX.md)
- Release Validation: [docs/RELEASE_VALIDATION.md](./docs/RELEASE_VALIDATION.md)
- Architecture Decisions: [docs/decisions/](./docs/decisions/)
- Enterprise Delivery Pack: [docs/enterprise-delivery/](./docs/enterprise-delivery/)
- Security & Procurement Library: [docs/procurement/](./docs/procurement/)

---

## Subsystem & File Ownership

- **Orchestration:** Root configs, `Makefile`, package coordination, releases.
- **MCP Server & Flows:** `apps/mcp-server/**`, Waniwani flow integration, transports.
- **Domain & Rules:** `packages/domain/**`, `packages/rules/**`, deterministic pricing/eligibility.
- **Persistence & Audit:** `packages/persistence/**`, `packages/audit/**`, state lifecycle, OCC, hash chaining.
- **Security & Privacy:** `packages/security/**`, `docs/procurement/**`, `SECURITY.md`, `PRIVACY.md`, threat models.
- **Enterprise Delivery:** `docs/enterprise-delivery/**`, architecture diagrams, deployment trade-off matrices.
- **Test Engineering:** `tests/**`, evaluation scripts, automated regression test runs.
- **Documentation:** `README.md`, `docs/demo/**`, `docs/guides/**`, changelogs.
