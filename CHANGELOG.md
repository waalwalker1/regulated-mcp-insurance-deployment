# Changelog

All notable changes to the Northstar Regulated MCP Insurance Deployment Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-21

### Added

- **MCP Funnel Server:** Model Context Protocol gateway with typed state graph, interrupt/resume flows, and dynamic adjustment tools.
- **Deterministic Rules Core:** Pure-function pricing breakdown, country-specific tax calculations, and eligibility engine with explicit reason codes.
- **Rule Versioning & Replay:** Versioned rule sets (`northstar-home-eu-v1`, `v2`) with cryptographic quote hash verification and historical replay tests.
- **Append-Only Audit Store:** Cryptographic SHA-256 hash chaining with automated PII redaction and chain verification tool.
- **Enterprise Delivery Pack:** 16 comprehensive FDE documents including executive solution brief, discovery questionnaires, RTM, RACI, UAT, and runbooks.
- **Procurement & Security Evidence:** 16 procurement documents including 35-question security questionnaire, data residency matrix, threat model, and DPIA inputs.
- **Verification Suites:** 32 Vitest unit/integration tests and a 24-scenario automated evaluation benchmark runner.
