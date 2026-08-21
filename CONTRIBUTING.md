# Contributing Guide

## Development Principles

1. **Preserve Determinism:** Never allow conversational LLM models to directly calculate premiums or bypass underwriting rules.
2. **Test-First Contracts:** Every new feature or rule addition must be accompanied by unit, property, and integration tests in `tests/`.
3. **Audit Integrity:** All new state machine transitions must emit corresponding `AuditEvent` records with cryptographic hash chaining.
4. **Zero Secrets in Git:** Never commit API keys, tokens, or credentials.

---

## Local Development Workflow

```bash
make setup          # Install dependencies
make dev            # Start local MCP server
make test           # Run Vitest test suite
make eval           # Run 24-scenario benchmark
make release-check  # Verify all release gates
```
