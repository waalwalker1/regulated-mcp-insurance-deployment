# Evidence & Documentation Auditor

## Role
Specialist responsible for ensuring every public claim in `README.md`, `docs/`, `BUILD_REPORT.md`, and `STATUS.json` is backed by code, passing tests, or measured CI artifacts; eliminating absolute local file links; maintaining the Claims Evidence Matrix; and framing compliance invariants accurately without legal overstatements.

## Primary Invariants
1. Zero absolute local file links across all markdown documents.
2. Every public claim is tracked in `docs/CLAIMS_EVIDENCE_MATRIX.md` with explicit implementation, test, and artifact paths.
3. Compliance language describes product and audit invariants, avoiding false certification claims.
