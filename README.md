# Regulated MCP Insurance Deployment Kit
### Deterministic Quoting Architecture & Enterprise Delivery Kit for European Insurance

[![CI](https://github.com/northstar-ai/regulated-mcp-insurance-deployment/actions/workflows/ci.yml/badge.svg)](https://github.com/northstar-ai/regulated-mcp-insurance-deployment/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js: v20+](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](https://www.typescriptlang.org/)

> **A production-shaped reference implementation showing how a European insurer can expose a deterministic, non-binding home-insurance quote journey through Model Context Protocol (MCP) while maintaining server-owned validation, pricing calculations, mandatory GDPR consent gating, and tamper-evident auditability.**

---

## 1. The Business Problem
Conversational AI assistants dramatically improve insurance quote conversion, but financial regulations (**EU AI Act, GDPR, Solvency II, and insurance conduct standards**) forbid unvetted, nondeterministic price setting or non-auditable eligibility decisions. 

Traditional conversational bots suffer from three fatal flaws in regulated finance:
1. **Pricing Hallucination:** LLMs invent or alter premiums and discounts nondeterministically.
2. **Regulatory Non-Compliance:** Quotes issued without explicit, recorded consent violate GDPR Article 6 & 7.
3. **Black-Box State Transitions:** Regulators cannot reconstruct the exact sequence of user inputs and actuarial rules.

This deployment kit demonstrates the **deterministic server-authority pattern**: the AI assistant provides conversational natural-language extraction, while the compiled server core owns all state transitions, validation, actuarial formulas, consent gating, and cryptographic audit logging.

---

## 2. Architecture Overview

```mermaid
flowchart LR
    subgraph Conversational Boundary
        Client[MCP Client / User Assistant]
    end

    subgraph Northstar MCP Server
        Sanitizer[Input Sanitizer & Regex Guard]
        StateMachine[Funnel State Machine]
        Store[(Session Store: Memory / Postgres)]
    end

    subgraph Deterministic Core
        Rules[Actuarial Pricing Engine (v1/v2)]
        Eligibility[Underwriting Eligibility Evaluator]
        ConsentGuard[GDPR Consent Gate]
        Audit[Append-Only SHA-256 Audit Store]
    end

    Client -->|MCP Tool Calls| Sanitizer
    Sanitizer --> StateMachine
    StateMachine <--> Store
    StateMachine --> Eligibility
    StateMachine --> ConsentGuard
    ConsentGuard --> Rules
    StateMachine --> Audit
```

### Core Invariants
- **Server Pricing Authority:** Premiums are calculated via pure functions in compiled TypeScript (`packages/rules/src/pricing.ts`). Client payloads cannot mutate prices.
- **Mandatory Consent Gate:** Quote issuance is hard-blocked until explicit data processing consent is recorded (`[CONSENT_REQUIRED]`).
- **Cryptographic Audit Trail:** Every lifecycle event appends a SHA-256 hash chaining back to session genesis (`packages/audit/src/audit-store.ts`).
- **Zero-Credential Local Path:** Fully testable and runnable locally without paid third-party API credentials.

---

## 3. Key Capabilities
- **Multi-Country European Addressing:** Regex-validated postcode formats for France (`FR`), Spain (`ES`), Portugal (`PT`), Germany (`DE`), and Italy (`IT`).
- **Underwriting Eligibility & Referrals:** Evaluates risk combinations (e.g. claims $>3$, large high-value villas) and emits explicit machine-readable reason codes.
- **State Correction & Invalidation Loops:** Altering previously confirmed risk parameters automatically invalidates active quotes and resets consent.
- **Dynamic Quote Adjustment:** Modify coverage tiers (`essential`, `comfort`, `premium`) and deductibles (€150 to €1000) on active quotes without restarting the funnel.
- **Hosted SaaS & Customer VPC Blueprints:** Complete deployment manifests, Docker Compose local stack, and a multi-criteria decision matrix.
- **Enterprise Delivery & Procurement Pack:** 32 comprehensive artifacts including a 35-question security questionnaire, STRIDE threat model, RTM, RACI, and UAT plans.

---

## 4. Quickstart

### Prerequisites
- Node.js `v20.x` or later
- npm `v10.x` or later (Docker optional for containerized PostgreSQL)

### 1-Command Verification
```bash
# 1. Install dependencies (idempotent, local)
make setup

# 2. Run the full interactive demonstration
make demo

# 3. Run all unit and integration tests (32 tests)
make test

# 4. Run the 24-scenario automated evaluation benchmark
make eval

# 5. Execute all release audit quality gates
make release-check
```

---

## 5. 60-Second Quoting Transcript

```text
[User]      "Hi, I need home insurance for my apartment in Paris (75008)."
[Assistant] submit_property_basics({ country: 'FR', postcode: '75008', propertyType: 'apartment', occupancyType: 'owner_occupied' })
[Server]    -> Status: PROPERTY_RECORDED. State advanced to COLLECTING_RISK.

[User]      "It was built in 2010, 75 sqm, primary residence, 0 claims in past 5 years."
[Assistant] submit_risk_factors({ constructionYearBand: '2000_2015', floorAreaBand: '50_100_sqm', isPrimaryResidence: true, claimsCount5Years: 0 })
[Server]    -> Status: RISK_FACTORS_RECORDED.

[Assistant] evaluate_eligibility()
[Server]    -> Outcome: ELIGIBLE (Reason: RISK_CRITERIA_MET). Rule version: northstar-home-eu-v1.

[User]      "I'd like the Comfort tier with a €300 deductible."
[Assistant] select_coverage({ coverageTier: 'comfort', deductible: 300 })
[Assistant] confirm_quote_parameters({ confirmed: true })
[Server]    -> Status: PARAMETERS_CONFIRMED. State advanced to AWAITING_CONSENT.

[Invariant] calculate_quote() -> Throws [CONSENT_REQUIRED] "Cannot calculate quote without verified consent."

[User]      "I agree to the data processing terms."
[Assistant] submit_consent({ consentVersion: 'consent_v1_2026' })
[Assistant] calculate_quote()
[Server]    -> QUOTE ISSUED (ID: 90484678-f868...)
               Base Annual: €180.00 | Property Multiplier: x0.9 | Deductible Discount: -€25.00
               Net Annual:  €137.00 | Tax (18%): +€24.66
               TOTAL:       €161.66 / year (€13.47 / month)
               Fingerprint: 36d5b534f844c6e43243398f3fb42436c251712183d3e0036f239a7bc168d56a (SHA-256)
               Status:      Active (Non-binding indicative)
```

---

## 6. Repository Structure

```text
├── apps/
│   ├── mcp-server/              # Model Context Protocol server (Stdio/HTTP)
│   └── pricing-service/         # Fastify microservice (/health, /ready, /metrics, /calculate)
├── packages/
│   ├── domain/                  # Zod validation schemas, error taxonomy, state machine
│   ├── rules/                   # Actuarial pricing engine, versioned rules (v1, v2), eligibility
│   ├── persistence/             # SessionStore interface (In-Memory with TTL & PostgreSQL)
│   ├── audit/                   # Append-only audit store with SHA-256 hash chaining & redactor
│   └── security/                # Input sanitization, prompt injection detection, data catalog
├── docs/
│   ├── fde/                     # 16-document Enterprise FDE Delivery Pack (RTM, RACI, UAT, etc.)
│   ├── procurement/             # 16-document Procurement & Security Library (35-question FAQ, DPIA)
│   ├── architecture/            # Threat model (STRIDE), Hosted vs VPC blueprints, SDK notes
│   ├── portfolio/               # Role requirement map, interview walkthrough, STAR stories
│   └── DEMO_SCRIPT.md           # 5-minute video recording script
├── tests/                       # Unit, property, integration, and adversarial security tests
├── scripts/
│   ├── demo-flow.ts             # Interactive demonstration runner
│   ├── run-eval.ts              # 24-scenario automated evaluation benchmark
│   └── anonymize-session.ts     # GDPR Article 17 right-to-erasure utility
├── Makefile                     # Canonical developer command interface
├── docker-compose.yml           # Local multi-container deployment stack
└── .github/workflows/ci.yml     # Automated CI verification pipeline
```

---

## 7. Measured Evidence & Evaluation Results

All claims in this repository are backed by passing code and automated evaluation benchmarks:

| Evaluation Dimension | Measurement Tool | Scenarios / Tests | Measured Result |
|---|---|---|---|
| **Type Safety** | TypeScript Compiler (`tsc --noEmit`) | Monorepo Strict Mode | **0 Type Errors** |
| **Unit & Integration Suite** | Vitest Test Runner (`npm run test`) | 11 Test Suites, 32 Tests | **32 Passed (100%)** |
| **Evaluation Benchmark** | Automated Evaluation Runner (`npm run eval`) | 24 Multi-Country Scenarios | **24 Passed (100%, 10ms execution)** |
| **Security Audit** | npm Dependency Audit (`npm run security`) | 193 Dependencies | **0 High/Critical Vulnerabilities** |
| **Audit Chain Integrity** | SHA-256 Cryptographic Verification | Lifecycle Event Logs | **100% Unbroken Hash Chains** |

*Raw benchmark results are exported to [`artifacts/evals/flow-evaluation.json`](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/artifacts/evals/flow-evaluation.json).*

---

## 8. Enterprise Delivery & Procurement Pack
- **[Executive Solution Brief](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/docs/fde/00-executive-solution-brief.md)**
- **[Client Discovery Questionnaire](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/docs/fde/01-client-discovery-questionnaire.md)**
- **[Requirements Traceability Matrix (RTM)](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/docs/fde/03-requirements-traceability-matrix.md)**
- **[Hosted vs. Self-Hosted Decision Matrix](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/docs/fde/07-hosted-vs-self-hosted-decision-matrix.md)**
- **[35-Question Enterprise Security Questionnaire](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/docs/procurement/12-security-questionnaire-sample.md)**
- **[STRIDE Threat Model](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/docs/architecture/THREAT_MODEL.md)**
- **[Data Protection Impact Assessment (DPIA) Inputs](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/docs/procurement/14-dpia-input-template.md)**

---

## 9. Known Limitations
1. **Indicative Quotation Only:** Northstar Home Insurance EU is a synthetic reference model. Issued quotes are non-binding and do not bind legal underwriting contracts or collect payment.
2. **Illustrative Actuarial Factors:** Pricing coefficients in `packages/rules/src/v1.ts` are simplified demonstration multipliers and do not reflect proprietary actuarial tables.
3. **No External Cloud Deployment Claim:** The repository is validated locally via zero-credential runners and Docker Compose; no third-party cloud infrastructure was provisioned.

---

## 10. Non-Affiliation Statement & License
This repository is an independent technical proof-of-work demonstration built with open-source MIT-licensed packages (`@waniwani/sdk`, `@modelcontextprotocol/sdk`). It is not affiliated with, endorsed by, or sponsored by Waniwani AI, Anthropic, or any commercial insurer.

Licensed under the [MIT License](file:///Users/dhananjay/Library/CloudStorage/OneDrive-URV/Personal%20Docs/CV/GitHub_Projects_JOB/WaniWani/LICENSE).
