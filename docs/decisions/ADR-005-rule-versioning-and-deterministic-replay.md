# ADR-005: Rule Versioning and Deterministic Quote Replay

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Engineering Architecture Team

## Context & Problem Statement

Actuarial tables and underwriting criteria evolve over time. When a dispute arises or a historical quote needs verification months later, re-evaluating the quote against the active production rules could produce a different premium, creating legal exposure.

## Decision Drivers

- Immutable historical quote reproduction.
- Multi-version rule co-existence (`northstar-home-eu-v1`, `v2`).
- Canonical SHA-256 quote fingerprinting.

## Decision Outcome

Structure business logic into immutable, explicitly versioned rule modules registered in a centralized `RuleRegistry`. Each generated quote records the active `ruleVersion` along with a canonical SHA-256 fingerprint of the inputs, pricing breakdown, and eligibility outcome.

### Positive Consequences

- Historical quotes can be replayed and verified with 100% mathematical parity against their original rule set version.
- Upgrading to `v2` does not alter or invalidate existing `v1` quote records.
