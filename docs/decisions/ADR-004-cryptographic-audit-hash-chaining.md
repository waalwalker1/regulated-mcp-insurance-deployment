# ADR-004: Cryptographic Append-Only Audit Hash Chaining

- **Status:** Accepted
- **Date:** 2026-08-21
- **Deciders:** Engineering Architecture Team

## Context & Problem Statement

Regulated insurance funnels require verifiable proof of every lifecycle event (session creation, property submission, risk updates, consent grants, calculation runs, adjustments, and corrections). Traditional unstructured application logs lack tamper-evidence and cannot be verified mathematically.

## Decision Drivers

- Tamper-evident verification of session event histories.
- Traceability back to session genesis.
- Automatic PII redaction prior to hashing/storage to maintain GDPR compliance.

## Decision Outcome

Implement an append-only `AuditStore` where every event is cryptographically linked to the previous event in that session using SHA-256 hash chaining:

$$\text{currentHash} = \text{SHA256}(\text{eventId} + \text{sessionId} + \text{correlationId} + \text{timestamp} + \text{eventType} + \text{actor} + \text{canonicalJson}(\text{metadata}) + \text{previousHash})$$

The genesis event links to a fixed 64-character zero-hash (`000...000`). A standalone verification algorithm (`AuditStore.verifyChain()`) traverses the sequence and validates every link.

### Positive Consequences

- Any modification, deletion, or insertion of historical events immediately invalidates the cryptographic hash chain.
- Independent verification CLI (`npm run verify:audit`) can audit stored event streams.
