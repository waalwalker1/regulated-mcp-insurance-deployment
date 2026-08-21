# Waniwani SDK & Model Context Protocol Integration Notes

## 1. Upstream Framework Overview

- **SDK Reference:** [`@waniwani/sdk@0.19.8`](https://github.com/WaniWani-AI/sdk) (MIT License)
- **Protocol Reference:** [`@modelcontextprotocol/sdk@1.6.0+`](https://github.com/modelcontextprotocol/typescript-sdk) (MIT License)
- **Purpose:** Provide deterministic sales, booking, and quote funnels on top of standard Model Context Protocol (MCP) servers.

## 2. Key Architecture Primitives

1. **Typed State Graphs:** The conversation flow is modeled as a state machine where state transitions are validated on the server.
2. **Interrupt & Resume:** When missing data is encountered (e.g. uncollected structural parameters, unconfirmed summary, or missing consent), the engine returns an interactive interrupt payload prompting the user for structured input without losing server state.
3. **Server-Owned Execution:** All calculation nodes (eligibility evaluation, pricing breakdown, cryptographic hashing, audit emission) execute inside deterministic pure functions.
4. **Correction Loops:** If a customer corrects a prior parameter during confirmation or after quote issuance, downstream derived state (eligibility, pricing, active quote, consent) is invalidated and re-evaluated.
5. **Transport Independence:** Works seamlessly across Stdio transport (CLI / local desktop MCP clients such as Claude Desktop or Antigravity) and HTTP / SSE transports for hosted web applications.

## 3. Tool Surface Overview

| MCP Tool                   | Purpose                                                                  | Server-Side Validation                         |
| -------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| `start_quote_session`      | Initialize session in memory/Postgres store                              | Generates UUID and correlation ID              |
| `submit_property_basics`   | Collect country, postcode, property type, occupancy                      | Regex postcode validation per European country |
| `submit_risk_factors`      | Collect construction year band, floor area, claims count                 | Bounded integers and strict enums              |
| `evaluate_eligibility`     | Run underwriting rules against declared parameters                       | Returns explicit reason codes                  |
| `select_coverage`          | Select coverage package (`essential`, `comfort`, `premium`) & deductible | Tier and deductible allowlists                 |
| `confirm_quote_parameters` | Require user confirmation of declared summary                            | Prevents premature consent request             |
| `submit_consent`           | Record explicit GDPR data processing consent                             | Required invariant before quote calculation    |
| `calculate_quote`          | Generate deterministic non-binding indicative quote                      | Full pricing breakdown + SHA-256 quote hash    |
| `adjust_quote`             | Adjust deductible / tier on an already active quote                      | Immediate deterministic recalculation          |
| `correct_field`            | Update a previously declared input                                       | Triggers automatic downstream invalidation     |
| `get_quote_status`         | Retrieve current session state                                           | Session isolation and TTL enforcement          |
| `export_audit_trail`       | Export complete event log with hash chain verification                   | Cryptographic tamper-evidence check            |

## 4. Optional Upstream Connectivity

When the optional `WANIWANI_API_KEY` is configured in `.env`, the funnel can stream telemetry and conversion analytics to the Waniwani Hosted Platform. If the variable is unset, the funnel operates 100% locally with zero external network egress.
