---
name: test-first-contract
description: Turns requirements and invariants into executable tests before or alongside implementation.
---

# Test First Contract

For every P0 capability:

1. state the invariant in plain English;
2. write a failing test or acceptance check;
3. implement the minimal real behavior;
4. make the test pass;
5. add a negative/edge case;
6. map the test to the evidence ledger.

Do not chase global coverage percentages. Prioritize business invariants, security boundaries, data provenance, error handling, and public demo flows.
