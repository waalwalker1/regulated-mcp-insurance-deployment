# Assumptions Ledger

| Assumption ID | Assumption | Why Necessary | Risk if False | Validation Action | Affects Public Claims? |
|---|---|---|---|---|---|
| **ASM-001** | Northstar Home Insurance EU is a fictional insurer | Demonstrates regulated workflows without infringing on real trademarks, proprietary rate tables, or underwriting secrets | None (intentional synthetic domain) | README and all doc heroes explicitly state non-binding, fictional nature | Yes (must be prominently labeled) |
| **ASM-002** | Local zero-credential runner satisfies interview demo requirements | Reviewers rarely possess paid enterprise keys at initial repository evaluation time | Low — repository provides instant standalone runnable state | `make demo` and `make test` run without `.env` configuration | Yes (marketed as zero-credential local) |
| **ASM-003** | Node.js v20+ with npm is available on local machine | Monorepo package management and execution | High if missing Node.js runtime | Environment verified in Phase W0 (`node v20.20.1`, `npm 10.8.2`) | No |
| **ASM-004** | Pricing coefficients are illustrative models, not actuarial advice | Showcase multi-factor multipliers and breakdown without claiming financial adequacy | Confusion if mistaken for real rates | Explicit disclaimers in rule schemas and UI outputs | Yes (must state illustrative only) |
| **ASM-005** | Cryptographic hash chaining in audit log simulates tamper-evident log stream | Demonstrates audit integrity concept in software architecture | Not legally certified as non-repudiable proof | Clearly document as application-level audit proof | Yes (no false legal claims) |
