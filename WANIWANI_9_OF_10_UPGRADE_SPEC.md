# Waniwani Regulated MCP Insurance Deployment Kit
## 9/10 Remediation & Upgrade Specification

**Repository:** `waalwalker1/regulated-mcp-insurance-deployment`  
**Target release:** `v0.2.0`  
**Purpose:** Upgrade the existing proof-of-work repository from a strong portfolio prototype into a technically credible, evidence-tight, Waniwani-specific Forward Deployed Engineering showcase that can survive detailed review by a senior engineer, security reviewer, solutions architect, or hiring manager.

---

# 0. EXECUTIVE DIRECTIVE

Do **not** rebuild this repository from scratch.

Preserve what is already strong:

- the deterministic pricing and eligibility core;
- the typed Zod domain model;
- versioned rules;
- consent gating concept;
- quote replay concept;
- append-only hash-chain audit concept;
- FDE discovery/delivery documentation;
- procurement/security pack;
- automated functional evaluation;
- adversarial tests;
- open-source packaging;
- local zero-credential developer experience.

The purpose of this remediation is to fix the gap between **what the repository claims** and **what the implementation actually proves**.

The upgraded repository must be able to withstand this reviewer question:

> "If I clone this repository and trace every important claim from README → architecture → source code → automated test → CI evidence, do the claims remain true?"

The answer after this upgrade must be **yes**.

The target is not "more code." The target is:

1. stronger Waniwani-specific proof;
2. real persistence and deployment behavior;
3. enforced workflow invariants;
4. protocol-level testing;
5. accurate security/compliance wording;
6. measurable evidence;
7. zero inflated claims.

---

# 1. FINAL TARGET SCORE

The repository should be considered **9/10 or better** only when all P0 acceptance criteria in this document are satisfied.

### Target scoring model

| Dimension | Weight | Target |
|---|---:|---:|
| Waniwani SDK / role-specific proof | 15 | 14+ |
| Deterministic domain logic & invariants | 18 | 17+ |
| MCP / protocol correctness | 12 | 11+ |
| Persistence, audit & deployment realism | 12 | 10+ |
| Security / privacy engineering | 10 | 9+ |
| Tests, evaluation & CI evidence | 12 | 11+ |
| FDE / procurement documentation | 12 | 11+ |
| Recruiter / OSS / evidence quality | 9 | 8+ |
| **Total** | **100** | **90+** |

---

# 2. NON-NEGOTIABLE PRINCIPLES

## 2.1 Evidence before claims

Never write:

- "production ready";
- "enterprise ready";
- "durable Postgres";
- "HTTP transport";
- "Waniwani SDK flow";
- "multi-tenant";
- "GDPR compliant";
- "CI verified";
- "concurrency safe";
- "tamper proof";
- "zero vulnerabilities";

unless the repository contains direct, reproducible evidence supporting the exact statement.

Prefer wording such as:

- "production-shaped reference implementation";
- "durable PostgreSQL-backed demo path";
- "tamper-evident hash chain";
- "demonstrates explicit consent gating";
- "synthetic regulatory reference architecture";
- "tested for session isolation under the included test model";
- "no high/critical dependency findings at the time of the recorded release check."

## 2.2 Legal accuracy

This repository is a technical demonstration, not legal advice.

Do not state categorically that:

- GDPR always requires consent for insurance quotation;
- GDPR Articles 6 and 7 prohibit quotes without consent;
- the EU AI Act necessarily applies to every demonstrated component;
- Solvency II directly mandates the specific software architecture.

Instead say:

> This reference implementation intentionally chooses explicit consent as a product and auditability invariant. A real insurer must determine its lawful basis, notices, retention, automated-decision obligations, and sector-specific requirements with its DPO, compliance team, and legal counsel.

## 2.3 Server-owned authority

The caller, LLM, MCP client, and browser must never control:

- rule version used for a new quote;
- eligibility result;
- calculated premium;
- calculated tax;
- quote status;
- required workflow order;
- consent state;
- audit event hashes.

## 2.4 Waniwani-specificity is mandatory

The repository is being used as proof for a Waniwani-oriented Forward Deployed Engineering role.

Installing `@waniwani/sdk` without using it is insufficient.

The upgraded implementation must demonstrate the current official architectural model:

> **one typed state graph → one MCP funnel tool**

The deterministic insurance domain logic can remain modular and independent. Waniwani should orchestrate the conversational funnel around that deterministic core.

---

# 3. REMEDIATION AGENT SYSTEM

Use the repository's existing Antigravity agent structure. Reuse existing agents where appropriate, but add the following remediation agents if equivalent specialists do not already exist.

Create:

```text
.agents/agents/
  sdk-integration-auditor/
  workflow-authority-engineer/
  persistence-deployment-engineer/
  protocol-test-engineer/
  evidence-documentation-auditor/
  independent-red-team-reviewer/
```

Each agent must write a handoff under:

```text
docs/agent-handoffs/remediation/
```

No agent may mark its own work "final release ready."

Only `independent-red-team-reviewer` may recommend the final release verdict after all tests and evidence checks have executed.

---

## 3.1 sdk-integration-auditor

### Mission

Implement and verify genuine Waniwani SDK integration against the currently installed/tested SDK version.

### Prompt

```text
You are the Waniwani SDK Integration Auditor.

Your task is to upgrade this existing insurance MCP repository so that it genuinely demonstrates Waniwani's current typed-flow model rather than merely depending on @waniwani/sdk.

First inspect:
- package-lock.json
- apps/mcp-server/
- docs/architecture/WANIWANI_SDK_NOTES.md
- the installed @waniwani/sdk package API
- the official Waniwani SDK repository/docs corresponding to the tested version.

Do not infer APIs from memory.

Build one typed Waniwani flow that represents the insurance quote journey and compiles/registers as one MCP tool. Preserve deterministic business calculations in @northstar/rules and server-side state authority.

Required flow characteristics:
- typed Zod state;
- interrupt/resume for missing user fields;
- explicit branching for eligibility/referral;
- confirmation step;
- explicit consent step;
- correction/re-ask behavior;
- deterministic quote calculation node;
- server-side state persistence;
- one funnel tool exposed to the MCP client.

Add protocol-level automated tests that call the actual registered MCP tool through an MCP client transport.

Remove or rewrite any documentation claim that cannot be proven.

Write:
docs/agent-handoffs/remediation/sdk-integration-audit.md

Include exact package version, API primitives used, test paths, commands executed, and limitations.
```

---

## 3.2 workflow-authority-engineer

### Mission

Make workflow order, policy version, idempotency, correction validation, and quote authority impossible to bypass.

### Prompt

```text
You are the Workflow Authority Engineer.

Audit every public mutation in:
- apps/mcp-server/src/funnel-engine.ts
- apps/mcp-server/src/server.ts
- packages/domain/src/state-machine.ts
- apps/pricing-service/

Find any path where a caller can:
- call steps out of order;
- consent before confirmation;
- calculate without confirmation;
- select the rule version;
- forge derived values;
- create duplicate quotes by retrying;
- mutate correction fields without runtime validation.

Remediate these issues with centralized transition guards and runtime schemas.

Every public workflow mutation must prove its required current state.

The active rule version for new quotes must come from server configuration or an internal RulePolicyProvider, never from arbitrary MCP/API client input.

Historical replay may accept a historical rule version only through a clearly separated replay/admin/internal path.

Implement idempotency for quote calculation and adjustment.

Add adversarial tests for invalid state order, replayed requests, forged derived fields, caller-selected rule versions, malformed corrections, and duplicate tool calls.

Write:
docs/agent-handoffs/remediation/workflow-authority-audit.md
```

---

## 3.3 persistence-deployment-engineer

### Mission

Replace simulated persistence with real durable persistence and make Docker deployment truthful.

### Prompt

```text
You are the Persistence & Deployment Engineer.

Inspect the current PostgresSessionStore and audit persistence path.

The existing repository must never call an in-memory Map "PostgreSQL persistence."

Implement real PostgreSQL-backed storage with:
- parameterized SQL;
- migrations/schema bootstrap;
- session CRUD;
- TTL/expiry behavior;
- quote history persistence;
- optimistic concurrency/version field or safe transactional update strategy;
- connection lifecycle;
- integration tests against a real Postgres test service.

Persist audit events durably as well, or explicitly downgrade documentation claims. Target state is durable audit storage with per-session hash-chain verification across process restart.

Fix the GDPR/anonymization CLI so it operates on the same durable store as the application.

Add a restart persistence test:
1. create session and quote;
2. terminate/recreate service/store;
3. read same session and audit chain;
4. verify quote replay and chain integrity.

Make docker-compose represent a real working topology.

The MCP service container must expose a transport that actually listens on the mapped port, or the port mapping must be removed.

Write:
docs/agent-handoffs/remediation/persistence-deployment-audit.md
```

---

## 3.4 protocol-test-engineer

### Mission

Test the product at the protocol boundary rather than only by calling internal classes.

### Prompt

```text
You are the Protocol Test Engineer.

Keep existing unit tests, but add tests at the real MCP boundary.

Required:
- launch the MCP server;
- connect an MCP client;
- list exposed tools;
- invoke the Waniwani compiled funnel tool;
- exercise interrupt/resume;
- complete a valid quote;
- attempt invalid/out-of-order actions;
- verify server-controlled pricing;
- verify correction behavior;
- verify consent behavior;
- verify audit evidence;
- verify multiple sessions remain isolated.

Also add HTTP/Streamable HTTP protocol smoke tests if HTTP transport is implemented.

Do not call FunnelEngine directly in tests labeled "protocol" or "end-to-end."

Create:
tests/protocol/
tests/integration/

Fix make test-e2e so the directory it invokes actually exists and contains tests.

Write:
docs/agent-handoffs/remediation/protocol-test-audit.md
```

---

## 3.5 evidence-documentation-auditor

### Mission

Make README, RTM, build report, badges, links, metrics, and compliance language provably accurate.

### Prompt

```text
You are the Evidence & Documentation Auditor.

Treat every public sentence in README.md, docs/BUILD_REPORT.md, docs/agent/RELEASE_AUDIT.md, docs/fde/, docs/procurement/, and docs/architecture/ as a claim that must map to evidence.

Fix:
- local file:/// links;
- claims unsupported by implementation;
- legal/compliance overstatements;
- misleading "verified" labels;
- references to transport/persistence that are not real;
- claims of Waniwani SDK usage that are not demonstrated;
- claims of multi-tenancy if only session isolation is tested;
- performance claims based only on in-process 10ms execution.

Create:
docs/CLAIMS_EVIDENCE_MATRIX.md

Columns:
Claim ID
Public Claim
Source Document
Implementation Evidence
Test Evidence
CI/Artifact Evidence
Status
Limitations

No claim can be marked VERIFIED without at least implementation + test evidence.

Write:
docs/agent-handoffs/remediation/evidence-documentation-audit.md
```

---

## 3.6 independent-red-team-reviewer

### Mission

Try to disprove the release.

### Prompt

```text
You are the Independent Red-Team Release Reviewer.

You did not implement the changes.

Attempt to disprove every major portfolio claim.

Focus on:
- Waniwani SDK authenticity;
- protocol behavior;
- state-order bypass;
- rule-version tampering;
- pricing tampering;
- idempotency;
- correction validation;
- consent semantics;
- persistence across restart;
- audit persistence/integrity;
- GDPR erasure/anonymization path;
- Docker runtime;
- HTTP transport;
- broken documentation links;
- false "verified" labels;
- secret exposure;
- CI reproducibility;
- test coverage blind spots.

You are not permitted to approve based on documentation alone.

Run the release commands from a clean checkout.

Output:
docs/agent/REMEDIATION_RELEASE_AUDIT.md

Allowed verdicts:
- RELEASE_BLOCKED
- RELEASE_READY_WITH_DOCUMENTED_LIMITATIONS
- RELEASE_READY_9_OF_10_TARGET

The 9/10 verdict requires every P0 criterion in this spec to pass.
```

---

# 4. P0 — REAL WANIWANI SDK FLOW

This is the single most important job-specific upgrade.

## 4.1 Required architecture

Refactor toward:

```text
MCP Client
   |
   v
Waniwani compiled flow
(one MCP tool)
   |
   +--> typed interrupt/resume
   +--> typed flow state
   +--> conditional edges
   +--> correction loops
   |
   v
Insurance Application Service
   |
   +--> EligibilityPort
   +--> PricingPort
   +--> ConsentPolicy
   +--> AuditPort
   +--> Session/Flow Store
```

The Waniwani flow owns orchestration.

The insurance domain owns deterministic business decisions.

The LLM owns neither.

## 4.2 Flow stages

Suggested logical stages:

```text
START
 -> property_details
 -> risk_details
 -> eligibility
       -> referral_end (if referral/decline)
       -> coverage_selection
 -> confirmation
       -> correction branch if rejected
 -> consent
 -> quote_calculation
 -> quote_presentation
 -> END
```

## 4.3 Use Waniwani primitives

Use the actual installed API, expected to include current equivalents of:

```ts
createFlow(...)
START
END
interrupt(...)
addNode(...)
addEdge(...)
conditional edge / branch primitive
MemoryKvStore or custom KV adapter
.compile(...)
flow.register(mcpServer)
```

Do not copy this pseudocode blindly. Verify actual package exports first.

## 4.4 One MCP tool

The primary public experience must be one flow-driven tool.

Optional diagnostic/admin MCP tools may exist separately only if clearly labeled non-customer-facing.

A hiring reviewer should be able to see the exact Waniwani value proposition in the implementation:

> typed multi-step funnel, deterministic server state, one MCP tool.

## 4.5 Platform integration

If using `withWaniwani(server)` or another official wrapper:

- verify the exact current API;
- keep platform connectivity optional;
- zero-credential local mode must still work;
- never invent a custom Waniwani endpoint;
- never claim analytics were actually sent unless tested against a real authorized account.

If hosted integration is not tested, write:

> Optional platform adapter is wired according to the upstream SDK API but not exercised in the public zero-credential release test.

---

# 5. P0 — STATE MACHINE AUTHORITY

The existing transition graph must become enforceable behavior, not documentation.

## 5.1 Central state guard

Every state-changing operation must call a central method, for example:

```ts
assertStep(session, expectedSteps)
transition(session, targetStep)
```

or use the Waniwani graph itself as the primary order authority.

Direct uncontrolled assignments such as:

```ts
session.step = 'AWAITING_CONSENT'
```

should not be scattered through business methods.

## 5.2 Required order

At minimum:

```text
INIT
COLLECTING_PROPERTY
COLLECTING_RISK
EVALUATING_ELIGIBILITY
COLLECTING_COVERAGE
AWAITING_CONFIRMATION
AWAITING_CONSENT
READY_TO_QUOTE
QUOTED
```

Referral may branch to:

```text
REFERRED
```

## 5.3 Confirmation is mandatory

A quote cannot be calculated merely because all fields and consent happen to exist.

The server must be able to prove:

```text
parameters_confirmed_at != null
consent_granted_at != null
eligibility == eligible
current_state == READY_TO_QUOTE
```

before issuing a quote.

## 5.4 Consent cannot be accepted from an invalid step

Attempting consent in:

- INIT;
- COLLECTING_PROPERTY;
- COLLECTING_RISK;
- REFERRED;

must fail with a machine-readable domain error.

## 5.5 Correct field invalidation

Define a central dependency map.

Example:

```text
country             -> eligibility + pricing + quote + consent/confirmation invalidation
postcode            -> eligibility/quote invalidation according to policy
propertyType        -> eligibility + pricing + quote
occupancyType       -> pricing + quote
constructionYear    -> eligibility + pricing + quote
floorArea           -> eligibility + pricing + quote
primaryResidence    -> eligibility + pricing + quote if used
claims              -> eligibility + pricing + quote
coverageTier        -> pricing + quote
deductible          -> pricing + quote
contactEmail        -> delivery/contact only
```

Do not hard-code a partial ad hoc list in one method.

## 5.6 Correction schema

Use a discriminated or strict Zod schema for corrections.

Never spread arbitrary client arguments into domain state.

---

# 6. P0 — SERVER-OWNED RULE VERSION

The current public API must not allow the client to decide the active policy/rule version for a new quote.

## 6.1 Implement

Create something similar to:

```ts
interface RulePolicyProvider {
  currentRuleVersion(context: QuoteContext): string;
}
```

The default local implementation can return:

```text
northstar-home-eu-v2
```

or the chosen tested active version.

## 6.2 Remove from customer-facing API

Remove `ruleVersion` from:

- the primary MCP quote flow input;
- public `/quote/calculate`;
- public `/quote/evaluate`;

unless there is a strong documented business reason.

## 6.3 Historical replay

Historical quote replay is different.

Implement:

```ts
replayHistoricalQuote({
  quoteId,
  originalRuleVersion
})
```

using the rule version recorded in the immutable historical quote.

The caller should not arbitrarily pick a version to obtain a cheaper quote.

---

# 7. P0 — IDEMPOTENCY

A real forward-deployed transaction flow must tolerate retries.

## 7.1 Quote calculation

Support:

```text
idempotencyKey
```

or a deterministic request key derived from:

```text
sessionId
confirmedInputFingerprint
consentVersion
ruleVersion
operation
```

Repeated calls with the same idempotency key must return the same quote identity or stored response, not mint new quotes.

## 7.2 Adjustment

Same principle for quote adjustment.

## 7.3 Audit

Retries should generate an appropriate event:

```text
request.replayed
```

rather than duplicate the full business transition.

## 7.4 Tests

Required:

- same request 10 times → one business quote;
- concurrent same key → one result;
- different correction fingerprint → new quote allowed;
- expired idempotency record → documented behavior.

---

# 8. P0 — REAL POSTGRESQL

The `PostgresSessionStore` must use PostgreSQL.

No hidden in-memory fallback may be presented as persistence.

## 8.1 Driver

Use one well-supported library:

- `pg`; or
- `postgres`.

Prefer the smallest solution consistent with maintainability.

## 8.2 Schema

Suggested tables:

```sql
quote_sessions
quote_history
audit_events
idempotency_records
schema_migrations
```

### quote_sessions

Include at least:

```text
session_id UUID PK
correlation_id
state
payload JSONB
version INTEGER
created_at
updated_at
expires_at
```

### quote_history

Include:

```text
quote_id UUID PK
session_id
rule_version
input_snapshot JSONB
eligibility_snapshot JSONB
pricing_snapshot JSONB
quote_hash
status
created_at
expires_at
```

### audit_events

Include:

```text
event_id UUID PK
session_id
correlation_id
event_type
actor
rule_version
metadata JSONB
previous_hash
current_hash
created_at
```

## 8.3 Concurrency

Use either:

- optimistic concurrency with version checks; or
- transaction/row lock when updating workflow state.

A simple example:

```sql
UPDATE quote_sessions
SET payload=$1, version=version+1
WHERE session_id=$2 AND version=$3
```

If zero rows update, raise a conflict and retry/reload.

## 8.4 No silent fallback

If `PERSISTENCE_MODE=postgres` and database initialization fails:

```text
FAIL STARTUP
```

Do not quietly switch to memory.

That behavior is dangerous in regulated workflows because operators may believe state is durable when it is not.

## 8.5 Migrations

Provide a deterministic command:

```bash
npm run db:migrate
```

or:

```bash
make db-migrate
```

The schema must not depend on a developer manually creating tables.

---

# 9. P0 — DURABLE AUDIT TRAIL

Hash chaining is a good concept, but the evidence must survive process restart.

## 9.1 Persist audit rows

Replace the global in-memory-only store with an interface:

```ts
interface AuditRepository {
  append(event): Promise<AuditEvent>;
  listBySession(sessionId): Promise<AuditEvent[]>;
  verify(sessionId): Promise<AuditVerification>;
}
```

Adapters:

```text
MemoryAuditRepository   # tests/local lightweight
PostgresAuditRepository # durable deployment
```

## 9.2 Chain atomicity

When possible, append audit record and state mutation transactionally or document the failure model.

At minimum, avoid this failure:

```text
business state committed
audit event lost
```

without detection.

## 9.3 Terminology

Use:

> tamper-evident

not:

> tamper-proof

SHA-256 chaining detects modification if trusted roots/records are retained; it does not magically prevent database administrators from rewriting the entire history.

## 9.4 Verification

Add:

```bash
npm run audit:verify -- <sessionId>
```

or an equivalent utility.

---

# 10. P0 — GDPR ERASURE / ANONYMIZATION PATH

The CLI must work on actual stored data.

## 10.1 Define the policy

Because audit and erasure can conflict, explicitly document:

- what personal fields are anonymized;
- what non-personal audit evidence is retained;
- whether identifiers are pseudonymized;
- retention rationale;
- limitations.

Do not claim generic "GDPR Article 17 compliance."

## 10.2 Make the CLI real

The script must:

1. connect to configured persistence;
2. locate the persisted session;
3. anonymize permitted personal fields;
4. anonymize/pseudonymize historical quote snapshots as required;
5. redact permitted audit metadata;
6. append an erasure/anonymization audit event;
7. verify the remaining chain or implement an integrity-preserving tombstone strategy;
8. return a machine-readable result.

## 10.3 Test

Create an integration test using PostgreSQL.

---

# 11. P0 — REAL MCP TRANSPORT

## 11.1 Stdio

Keep stdio as the simplest local mode.

## 11.2 HTTP mode

If the README, Docker Compose, diagrams, or deployment pack advertise hosted HTTP behavior, implement an actual current MCP HTTP transport supported by the installed MCP SDK.

Prefer current **Streamable HTTP** if supported by the installed version.

Suggested environment:

```text
MCP_TRANSPORT=stdio|http
MCP_PORT=3000
```

## 11.3 HTTP health

Expose a real health/readiness endpoint for the hosted process.

Example:

```text
GET /health
GET /ready
POST /mcp
```

## 11.4 Docker

The `mcp-server` Docker container must run in HTTP mode if port 3000 is published.

Do not publish a port for a stdio-only process.

## 11.5 Protocol smoke test

Run against the container, not an internal class.

---

# 12. P0 — PRICING SERVICE ARCHITECTURE CONSISTENCY

The repository currently includes a pricing microservice and a direct in-process pricing engine.

Choose a truthful architecture.

## Recommended pattern

Create:

```ts
interface PricingPort {
  calculate(input, ruleContext): Promise<PricingBreakdown>;
  evaluate(input, ruleContext): Promise<EligibilityResult>;
}
```

Implement:

```text
LocalDeterministicPricingAdapter
HttpPricingServiceAdapter
```

### Local mode

Zero credentials, no network dependency.

### Hosted/container mode

MCP application uses `HttpPricingServiceAdapter` pointing at:

```text
PRICING_SERVICE_URL
```

Add:

- timeout;
- retry policy for safe requests;
- structured error mapping;
- circuit/open behavior or simple bounded failure behavior;
- correlation ID propagation.

If you do not connect the service, explicitly call it an independent demonstration service rather than implying the MCP server uses it.

---

# 13. P0 — QUOTE FINGERPRINT

The quote fingerprint should represent the exact non-PII decision snapshot.

## 13.1 Canonical payload

Include:

```text
ruleVersion
validated decision inputs
isPrimaryResidence
eligibility status
eligibility reason codes
full pricing breakdown
currency
quote semantics/version
```

Exclude personal contact information unless there is a compelling reason.

## 13.2 Canonical JSON

Do not depend on incidental object key insertion order.

Implement stable serialization.

## 13.3 Test

Property:

```text
same canonical inputs + same rules => same fingerprint
any decision-relevant mutation => different fingerprint
```

---

# 14. P0 — ADVERSARIAL TESTS THAT ACTUALLY ATTACK THE BOUNDARY

Expand tests so their names correspond to real attacks.

Required cases:

## State attacks

- consent in INIT;
- quote calculation before confirmation;
- quote calculation before consent;
- adjust before quote;
- quote after referral;
- correction with invalid state;
- repeated calls after completion.

## Authority attacks

- send `premium: 0`;
- send `tax: 0`;
- send `eligibility: true`;
- send `isBinding: true`;
- send cheaper `ruleVersion`;
- send fabricated quote hash;
- manipulate quote status.

The server should ignore/reject derived fields because they are not part of the customer input schema.

## Injection / malformed input

- obvious prompt injection;
- Unicode/control characters;
- overlong payload;
- malformed postcode;
- malformed email;
- unknown fields;
- object/prototype-like payloads where relevant.

Do not sell regex detection as the main security control.

The stronger security property is:

> untrusted text is data; no text can override deterministic server code.

---

# 15. P0 — REAL END-TO-END TEST DIRECTORY

Create:

```text
tests/integration/
tests/protocol/
```

Fix:

```bash
make test-e2e
```

so it runs actual tests.

At least one E2E test must use PostgreSQL.

At least one protocol test must use a real MCP client/transport.

---

# 16. P0 — CI 2.0

Update `.github/workflows/ci.yml`.

## 16.1 Dependency installation

Use:

```bash
npm ci
```

with the committed lockfile.

Avoid `npm install --legacy-peer-deps` unless there is a documented upstream compatibility reason.

If legacy peer resolution is truly required, document why.

## 16.2 CI jobs

Prefer multiple jobs for clearer evidence:

```text
quality
unit-tests
integration-postgres
protocol-tests
docker-smoke
security
docs-links
release-gate
```

## 16.3 Quality

Add real:

- ESLint;
- Prettier check;
- TypeScript strict typecheck.

Do not label TypeScript compilation as lint.

## 16.4 Coverage

Establish thresholds.

Suggested baseline:

```text
lines: 85%
functions: 85%
statements: 85%
branches: 80%
```

Critical deterministic packages (`rules`, `domain`) should aim higher.

Coverage percentage itself is not the goal; uncovered high-risk branches should be reviewed manually.

## 16.5 PostgreSQL service

CI must start a real PostgreSQL service or container and run persistence tests.

## 16.6 Docker smoke

Required:

```bash
docker compose build
docker compose up -d
wait for health
run protocol quote smoke
docker compose down -v
```

## 16.7 Docs links

Use a markdown link checker.

Zero `file:///Users/...` links may remain.

## 16.8 Security

At minimum:

- `npm audit --audit-level=high`;
- secret scan;
- container/dependency scan if practical.

Optional but valuable:

- CycloneDX SBOM;
- Trivy image scan;
- CodeQL.

Do not make optional third-party SaaS a requirement for local development.

---

# 17. P0 — RELEASE CHECK

Unify `package.json` and `Makefile`.

There should be one canonical local gate.

Example:

```bash
make release-check
```

It should execute all checks that are reasonable locally:

```text
format-check
lint
typecheck
unit tests
coverage
functional eval
protocol tests
Postgres integration (when Docker available)
Docker smoke
docs link check
security audit
demo
claims evidence validator
```

If Docker is unavailable, the command must clearly mark the corresponding gate as **NOT EXECUTED**, not "passed."

A release report must distinguish:

```text
PASS
FAIL
NOT_EXECUTED
```

---

# 18. P0 — README REPAIR

## 18.1 Remove all local file links

Replace:

```text
file:///Users/...
```

with repository-relative links:

```md
[Evaluation results](artifacts/evals/flow-evaluation.json)
```

## 18.2 Hero wording

Recommended:

> A production-shaped reference implementation of a regulated insurance quotation funnel built with Waniwani's typed MCP flow model. The conversational layer collects and validates inputs while deterministic server-side components own workflow state, eligibility, policy version, pricing, consent gating, quote identity, and audit evidence.

## 18.3 Compliance wording

Replace categorical statements such as:

> GDPR forbids...

with:

> This demonstration intentionally requires explicit consent before quote calculation as an auditable workflow invariant. Real deployments must establish the appropriate lawful basis and disclosures with the insurer's compliance and data-protection teams.

## 18.4 Clearly separate

Create three labels:

```text
IMPLEMENTED & TESTED
REFERENCE ARCHITECTURE
NOT CLAIMED
```

Example:

### Implemented & tested
- Waniwani typed funnel;
- deterministic quoting;
- Postgres persistence;
- protocol test;
- audit chain;
- Docker local topology.

### Reference architecture
- hosted SaaS;
- customer VPC;
- enterprise IAM;
- production observability integration.

### Not claimed
- insurer production use;
- actuarial validity;
- legal compliance certification;
- SOC 2 / ISO certification;
- real customer outcomes.

## 18.5 Measured evidence

Do not print a 10ms functional eval as if it proves production latency.

Rename:

```text
24-scenario in-process functional evaluation
```

Add separate protocol-level latency metrics only after measuring them.

---

# 19. P0 — CLAIMS EVIDENCE MATRIX

Create:

```text
docs/CLAIMS_EVIDENCE_MATRIX.md
```

Example:

| Claim | Implementation | Test | CI Artifact | Status | Limitation |
|---|---|---|---|---|---|
| Waniwani one-tool typed funnel | `apps/mcp-server/src/waniwani-flow.ts` | `tests/protocol/waniwani-flow.test.ts` | protocol-test job | VERIFIED | local stdio + local HTTP |
| Durable session persistence | `PostgresSessionStore` | restart integration test | integration-postgres | VERIFIED | single-region demo |
| Tamper-evident audit | `PostgresAuditRepository` | restart + corruption test | integration-postgres | VERIFIED | not external immutable ledger |
| Explicit consent gate | flow node + policy | boundary test | protocol-test | VERIFIED | demo product invariant, not generic GDPR assertion |
| Hosted Waniwani analytics | optional wrapper | none | none | NOT_MEASURED | requires account/key |

Automate basic validation where practical.

---

# 20. P0 — RTM RE-AUDIT

Do not leave every row as VERIFIED by default.

Allowed states:

```text
VERIFIED
PARTIALLY_VERIFIED
REFERENCE_ONLY
NOT_IMPLEMENTED
NOT_MEASURED
```

Review every existing RTM row.

Specific areas to scrutinize:

- email dispatch;
- multi-tenancy;
- durable PostgreSQL;
- container deployment;
- HTTP MCP;
- audit across process restart;
- Waniwani SDK flow;
- concurrent updates;
- GDPR erasure;
- hosted platform analytics.

---

# 21. P1 — OBSERVABILITY

After P0 is complete, add lightweight production-shaped observability.

## Structured logs

Use structured JSON logs with:

```text
correlationId
sessionId or pseudonymous session handle
operation
state
result
durationMs
ruleVersion
```

Never emit contact email or full quote payload into normal logs.

## OpenTelemetry

Add spans around:

```text
mcp.flow
flow.node
eligibility.evaluate
pricing.calculate
persistence.read/write
audit.append
pricing.http
```

Local exporter may be console/OTLP.

## Metrics

At minimum:

```text
quote_attempt_total
quote_success_total
quote_referral_total
consent_block_total
correction_total
idempotent_replay_total
flow_duration_ms
pricing_duration_ms
persistence_error_total
```

---

# 22. P1 — BETTER EVALUATION

Keep the 24 deterministic scenarios, but rename them accurately.

Then add:

## Functional benchmark

```text
24 deterministic in-process cases
```

## Protocol benchmark

For example:

```text
100 complete MCP sessions
5-country mix
valid + referral + correction cases
```

Measure:

```text
pass rate
p50 latency
p95 latency
p99 latency
error count
```

## Concurrency exercise

Run a bounded local exercise such as:

```text
50 concurrent independent sessions
```

The point is not performance bragging.

The point is to prove:

- no state leakage;
- no duplicate quote under idempotency;
- safe persistence updates;
- correct audit chains.

Do not call this "load tested for production."

---

# 23. P1 — PROPERTY-BASED TESTING

Use `fast-check` or equivalent for high-value deterministic properties.

Examples:

```text
same valid input + same rule version => same price
same decision snapshot => same fingerprint
invalid postcode never validates
claims outside allowed range never validate
higher deductible never produces a negative premium
all successful quotes are non-binding
all successful quotes contain disclosure
no referred case produces an active quote
```

---

# 24. P1 — FAILURE INJECTION

Forward-deployed engineers must demonstrate failure handling.

Add controlled tests for:

```text
Postgres unavailable at startup
Postgres unavailable mid-request
pricing HTTP timeout
pricing HTTP 500
duplicate request
audit append failure
expired session
unknown rule registry entry
malformed persisted record
```

Document what the system does.

Prefer safe failure to silent fallback.

---

# 25. P1 — DATA FLOW & TRUST BOUNDARIES

Create:

```text
docs/architecture/DATA_FLOW.md
```

Include a Mermaid diagram showing:

```text
User/MCP client
Waniwani flow
domain validation
application service
pricing
Postgres
audit
optional Waniwani hosted platform
```

Mark:

```text
trusted boundary
untrusted boundary
PII fields
derived fields
server-owned fields
network egress
```

---

# 26. P1 — OPERATIONS RUNBOOK

Create:

```text
docs/operations/RUNBOOK.md
```

Include:

- start/stop;
- health checks;
- migration;
- backup/restore demo;
- audit verification;
- session expiry cleanup;
- incident triage;
- rollback to prior rules;
- disabling new quote issuance;
- dependency failure behavior.

This is valuable FDE proof because it shows deployment ownership beyond coding.

---

# 27. P2 — OPTIONAL VISUAL AUDIT EXPLORER

Only after P0/P1.

A tiny local web viewer can improve recruiter/demo usability.

It should show:

- state progression;
- user-provided vs server-derived fields;
- eligibility reason codes;
- rule version;
- pricing breakdown;
- audit event chain;
- quote fingerprint;
- correction invalidation.

Do not build a large frontend.

The FDE value is architecture and delivery judgment, not visual polish.

---

# 28. FILES EXPECTED TO CHANGE

Likely changes:

```text
README.md
package.json
package-lock.json
Makefile
docker-compose.yml
.github/workflows/ci.yml

apps/mcp-server/src/index.ts
apps/mcp-server/src/server.ts
apps/mcp-server/src/funnel-engine.ts
apps/mcp-server/src/waniwani-flow.ts              # new
apps/mcp-server/src/application-service.ts         # optional/new
apps/mcp-server/src/transports/http.ts             # new if appropriate

apps/pricing-service/src/server.ts

packages/domain/src/state-machine.ts
packages/domain/src/schemas.ts
packages/domain/src/types.ts

packages/persistence/src/postgres-store.ts
packages/persistence/src/migrations/*
packages/persistence/src/store.interface.ts

packages/audit/src/audit-store.ts
packages/audit/src/postgres-audit-repository.ts
packages/audit/src/*

packages/rules/src/pricing.ts
packages/rules/src/registry.ts

scripts/anonymize-session.ts
scripts/run-eval.ts
scripts/release-report.ts                          # optional/new
scripts/verify-links.ts                            # optional if not using external checker

tests/integration/*
tests/protocol/*
tests/adversarial.test.ts
tests/persistence-postgres.test.ts
tests/idempotency.test.ts
tests/state-order.test.ts
tests/rule-authority.test.ts

docs/CLAIMS_EVIDENCE_MATRIX.md
docs/BUILD_REPORT.md
docs/agent/REMEDIATION_RELEASE_AUDIT.md
docs/architecture/WANIWANI_SDK_NOTES.md
docs/architecture/DATA_FLOW.md
docs/operations/RUNBOOK.md
docs/fde/03-requirements-traceability-matrix.md
```

Do not create files merely to inflate repository size.

---

# 29. ACCEPTANCE TEST MATRIX

The release is blocked unless these pass.

| ID | Test | Required |
|---|---|---:|
| A01 | real Waniwani `createFlow`-style typed flow is used | YES |
| A02 | primary funnel is registered as one MCP tool | YES |
| A03 | interrupt/resume tested via real MCP client | YES |
| A04 | state order cannot be bypassed | YES |
| A05 | confirmation required before consent/quote | YES |
| A06 | client cannot choose new-quote rule version | YES |
| A07 | client cannot inject premium/eligibility/status | YES |
| A08 | quote calculation idempotent under retries | YES |
| A09 | correction schema strict and validated | YES |
| A10 | critical correction invalidates correct downstream state | YES |
| A11 | Postgres adapter executes real SQL | YES |
| A12 | session survives store/service recreation | YES |
| A13 | audit survives restart | YES |
| A14 | audit chain verifies after restart | YES |
| A15 | anonymization utility changes actual persistent record | YES |
| A16 | Docker MCP service serves its advertised transport | YES |
| A17 | Docker Postgres is actually used | YES |
| A18 | pricing service topology is truthful | YES |
| A19 | actual protocol E2E test exists | YES |
| A20 | `make test-e2e` works | YES |
| A21 | `npm ci` clean checkout works | YES |
| A22 | CI uses real lint + formatting check | YES |
| A23 | CI runs PostgreSQL integration | YES |
| A24 | CI runs Docker smoke | YES |
| A25 | zero `file:///Users/` links | YES |
| A26 | README compliance wording is non-categorical | YES |
| A27 | CLAIMS_EVIDENCE_MATRIX exists | YES |
| A28 | RTM statuses match actual proof | YES |
| A29 | current 24-case eval labeled functional, not production performance | YES |
| A30 | no secrets committed | YES |
| A31 | no unsupported Waniwani platform telemetry claim | YES |
| A32 | clean release report distinguishes PASS/FAIL/NOT_EXECUTED | YES |

---

# 30. NEGATIVE ACCEPTANCE TESTS

The following must fail safely:

```text
quote before property data
risk submission before session
consent before confirmation
quote before consent
quote after referral
client supplied ruleVersion
client supplied premium
client supplied eligibility result
client supplied isBinding=true
invalid correction payload
unknown correction field
reused idempotency key with conflicting payload
expired session
invalid persisted state
Postgres unavailable in postgres mode
```

Each failure should return:

```text
stable machine-readable error code
safe user-facing message
correlation ID
no secret/PII leak
appropriate audit/operational evidence when possible
```

---

# 31. RELEASE EVIDENCE ARTIFACTS

Generate under:

```text
artifacts/release/v0.2.0/
```

At minimum:

```text
test-summary.json
coverage-summary.json
functional-eval.json
protocol-eval.json
postgres-integration-summary.json
docker-smoke-summary.json
security-summary.json
docs-link-summary.json
claims-evidence-summary.json
release-verdict.json
```

Do not commit enormous raw logs.

Commit compact machine-readable summaries and preserve detailed logs as CI artifacts where appropriate.

---

# 32. RECRUITER-LEVEL 90-SECOND EXPERIENCE

After remediation, someone opening the repository should understand this in under 90 seconds:

1. **Problem:** conversational insurance quoting needs deterministic server authority.
2. **Why Waniwani:** typed state graph compiles the multi-step quote journey into one MCP tool.
3. **What AI does:** conversational input/rendering.
4. **What AI cannot do:** price, approve eligibility, choose policy version, bypass consent, alter audit.
5. **What is real:** flow, MCP protocol, rules, Postgres, audit, Docker, tests.
6. **What is reference-only:** real insurer integrations, production actuarial tables, certifications.
7. **How to prove it:** one command + linked evidence matrix.

Recommended README quick proof section:

```bash
npm ci
make release-check
```

And, if Docker is required for full integration:

```bash
make integration-up
make test-e2e
make integration-down
```

---

# 33. INTERVIEW DEMO TARGET

A 5-minute interview demo should show:

## Minute 0–1
Architecture:
- one Waniwani MCP flow;
- deterministic server core;
- Postgres;
- audit.

## Minute 1–3
Happy path:
- start quote;
- interrupt/resume;
- invalid postcode re-ask;
- eligibility;
- coverage;
- confirmation;
- consent;
- quote.

## Minute 3–4
Adversarial path:
- try premium override;
- try cheaper rule version;
- try quote before confirmation;
- show rejection.

## Minute 4–5
Enterprise proof:
- audit chain;
- restart persistence;
- RTM;
- hosted vs self-hosted decision matrix;
- claims evidence matrix.

End with limitations, not hype.

---

# 34. WHAT NOT TO BUILD

Do not spend the remediation sprint on:

- a fancy consumer UI;
- actual payment collection;
- real insurer policy binding;
- AI-generated underwriting;
- a large Kubernetes platform;
- a complex event bus;
- dozens of microservices;
- fake enterprise SSO;
- fake Waniwani hosted analytics;
- fake customer metrics;
- mock SOC 2 badges.

These will not increase the score as much as proving the core claims.

---

# 35. FINAL ONE-SHOT ANTIGRAVITY PROMPT

Paste the following into Antigravity from the root of the existing repository:

```text
You are upgrading an existing public proof-of-work repository. Do not rebuild it from scratch.

Read WANIWANI_9_OF_10_UPGRADE_SPEC.md in full before changing code.

Goal:
Raise this repository to a defensible 9/10 technical proof-of-work for a Waniwani Forward Deployed Engineering role.

Priority:
P0 evidence integrity and real behavior over feature count.

Non-negotiable outcomes:
1. genuine current @waniwani/sdk typed-flow integration;
2. one primary Waniwani flow compiled/registered as one MCP tool;
3. protocol-level MCP tests;
4. enforced state order and confirmation/consent invariants;
5. server-owned active rule version;
6. idempotent quote operations;
7. strict correction schemas;
8. real PostgreSQL persistence, no fake Map-backed "Postgres";
9. durable audit storage and restart verification;
10. functioning persistent anonymization/erasure demonstration;
11. truthful real hosted MCP transport if Docker maps a port;
12. truthful pricing-service integration or clearly documented separation;
13. CI with npm ci, lint, format check, unit, protocol, Postgres integration, Docker smoke, security and docs-link validation;
14. zero local file:/// links;
15. compliance/legal wording corrected;
16. claims-evidence matrix mapping public claims to source + tests + CI evidence;
17. RTM re-audited;
18. independent red-team release audit.

Use the existing agent system. Create the remediation agents in this spec only where no equivalent exists. Parallelize independent work, but centralize changes to workflow authority and shared schemas to avoid conflicting edits.

For every important change:
- add or update tests;
- update evidence docs;
- preserve backward compatibility when sensible;
- do not claim success until a command actually ran;
- record NOT_EXECUTED when the environment prevents a test.

Before release, run from a clean checkout:
npm ci
make release-check

Also execute the Docker/Postgres/protocol integration gates required by this spec.

The final output must include:
- exact files changed;
- exact commands run;
- test counts;
- coverage;
- functional evaluation result;
- protocol evaluation result;
- Postgres restart evidence;
- Docker smoke evidence;
- security results;
- unresolved limitations;
- docs/agent/REMEDIATION_RELEASE_AUDIT.md.

Do not stop at planning. Implement, test, remediate failures, re-run, and finish only when all P0 acceptance criteria pass or clearly report RELEASE_BLOCKED.
```

---

# 36. FINAL DEFINITION OF DONE

The repository reaches the intended **9/10** standard when a skeptical senior reviewer can clone it and confirm all of the following:

- Waniwani SDK is not decorative; it drives the funnel.
- The funnel behaves as one typed MCP flow/tool.
- Internal classes are not the only thing being tested; real protocol tests exist.
- Workflow order cannot be bypassed.
- Server owns rules and calculated fields.
- Repeated requests are safe.
- PostgreSQL is actually PostgreSQL.
- Audit evidence survives restart.
- The privacy/anonymization demo modifies the real store.
- Docker maps ports to services that actually listen.
- CI verifies the same important properties claimed by the README.
- Documentation contains no laptop-local links.
- Legal/compliance language is careful.
- Every major portfolio claim maps to code + test + evidence.
- Remaining limitations are explicit.
- The project looks like a Forward Deployed Engineer built it for an enterprise technical evaluation, not like an AI-generated repository optimized for file count.

**The target is credibility under inspection.**
