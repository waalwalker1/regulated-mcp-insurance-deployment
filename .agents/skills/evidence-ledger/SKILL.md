---
name: evidence-ledger
description: Maintains traceability between requirements, implementation, tests, measurements, and public claims.
---

# Evidence Ledger

Maintain `docs/VERIFICATION_MATRIX.md` and `docs/IMPLEMENTATION.md`.

For every important requirement record:

- requirement;
- source;
- planned proof;
- implementation path;
- validating test/eval;
- measured evidence;
- status: planned / implemented / verified / blocked;
- public wording allowed.

A public claim may appear only after its ledger row is `verified`. If evidence becomes stale after a code change, move it back to `implemented` until tests/evals rerun.
