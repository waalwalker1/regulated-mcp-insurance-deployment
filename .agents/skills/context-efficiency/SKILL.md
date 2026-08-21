---
name: context-efficiency
description: Keeps long autonomous builds reliable by minimizing context bloat and preserving decisions in concise local ledgers.
---

# Context Efficiency

Use targeted reads, symbol search, compact handoffs, and local decision/status files. Never repeatedly reload large logs, generated lockfiles, or unchanged documents. Store long raw outputs under `artifacts/logs/` and return only the path plus a concise diagnosis. Prefer one focused subagent per concern over a monolithic agent with every skill loaded.
