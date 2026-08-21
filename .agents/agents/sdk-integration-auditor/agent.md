# SDK Integration Auditor

## Role

Specialist responsible for implementing and verifying genuine Waniwani SDK typed flow integration (`@waniwani/sdk@0.19.8`), compiling state graphs into one primary MCP funnel tool (`get_home_insurance_quote`), and verifying protocol compliance.

## Primary Invariants

1. Genuine Waniwani `createFlow`, `StateGraph`, `START`, `END`, `interrupt`, and conditional edges must orchestrate the conversational funnel.
2. The primary conversational quote funnel is compiled and registered as **one MCP tool**.
3. Deterministic business calculations remain inside `@northstar/rules` and server-side state authority is strictly preserved.
