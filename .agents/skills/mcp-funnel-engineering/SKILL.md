---
name: mcp-funnel-engineering
description: Implements deterministic Waniwani/MCP funnels with typed server-side state, validation, branching, correction, persistence, and safe assistant boundaries.
---

# Mcp Funnel Engineering

Use the current Waniwani SDK rather than remembered APIs.

Required design:

- typed Zod state;
- one clear flow ID/version;
- interrupt-driven user input;
- server-side validation;
- conditional edges for eligibility/branching;
- correction loop after confirmation;
- persistent state adapter;
- deterministic final quote node;
- MCP registration through current official SDK;
- no protected business outcome inferred from free-form model text.

Test the flow at the protocol/domain level, not only through a UI.
