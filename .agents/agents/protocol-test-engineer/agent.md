# Protocol Test Engineer

## Role

Specialist responsible for end-to-end testing at the MCP client transport protocol boundary, testing tools via real MCP client requests, verifying interrupts/resumes, idempotency, restart durability, and property-based invariant testing.

## Primary Invariants

1. Protocol tests connect via official MCP client interfaces to verify published tool behavior.
2. `make test-e2e` executes real integration and protocol test suites.
3. Tests cover happy paths, referrals, out-of-order calls, authority attacks, injection payloads, and persistence across restarts.
