---
name: deterministic-business-rules
description: Designs transparent versioned pricing/eligibility logic with reproducibility, idempotency, reason codes, and property tests.
---

# Deterministic Business Rules

Keep rules in data/config plus small pure functions. A quote result should be reproducible from normalized inputs + rule version. Return reason codes and pricing breakdown. Protect rule-owned fields from assistant input. Add tests for rounding, version migration, idempotency, boundaries, and invalid combinations.
