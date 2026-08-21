# ADR-002: Deterministic Server Authority over State Progression and Pricing

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Engineering Architecture Team

## Context & Problem Statement

Large language models (LLMs) used in conversational interfaces are non-deterministic and susceptible to hallucinations, prompt injections, and invalid calculations. In regulated domains such as insurance quotation, premiums, tax levies, discounts, and underwriting eligibility must remain 100% deterministic and legally auditable.

## Decision Drivers

- Regulatory compliance (EU AI Act, market conduct rules).
- Actuarial determinism: identical inputs must always yield identical prices.
- Mandatory consent gating: no personal data or quote may be processed without explicit consent.
- Prevention of prompt injection bypasses.

## Considered Options

1. **LLM Pricing:** Allow LLM to compute premiums based on system prompt instructions.
2. **Hybrid Verification:** LLM calculates quote and a backend service loosely verifies.
3. **Strict Server Authority:** LLM is strictly a conversational extraction and rendering interface. The compiled server owns all validation, state transitions, eligibility evaluation, actuarial calculations, and consent gating.

## Decision Outcome

Strict Server Authority. The LLM has zero authority to set, adjust, or bypass pricing or eligibility rules. All inputs are validated via Zod schemas, passed through pure TypeScript pricing functions, and checked against mandatory consent and confirmation state gates.

### Positive Consequences

- Guaranteed pricing reproducibility across repeated runs.
- Absolute prevention of price manipulation via adversarial prompt injection.
- Machine-readable reason codes for all underwriting and referral decisions.
