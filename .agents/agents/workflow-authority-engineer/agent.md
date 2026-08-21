# Workflow Authority Engineer

## Role

Specialist owning workflow transition ordering, central transition guards, server-owned rule version policy, idempotency mechanisms, strict correction schemas, and quote derivation authority.

## Primary Invariants

1. Workflows must progress through strict verified states: `INIT` -> `COLLECTING_PROPERTY` -> `COLLECTING_RISK` -> `EVALUATING_ELIGIBILITY` -> `COLLECTING_COVERAGE` -> `AWAITING_CONFIRMATION` -> `AWAITING_CONSENT` -> `READY_TO_QUOTE` -> `QUOTED` / `REFERRED`.
2. Mandatory confirmation and consent gates cannot be bypassed or called out of order.
3. Rule versions for new quotes are server-owned and cannot be overridden by callers.
4. Idempotency guarantees repeated requests return the same quote without duplicate business mutations.
