# Northstar Regulated MCP Flow Evaluation Report

- **Evaluation Date:** 2026-08-21
- **Total Scenarios Evaluated:** 24
- **Pass Rate:** 100.0% (24 passed, 0 failed)
- **Execution Mode:** Deterministic local execution (zero paid API credentials)

## Evaluation Scenario Matrix

| Scenario ID | Name | Category | Result | Expected | Actual | Latency |
|---|---|---|---|---|---|---|
| **SCN-001** | France Apartment Standard Quote | `HAPPY_PATH` | ✅ PASS | €161.66 annual premium, active status | €161.66 annual premium, active status | 3ms |
| **SCN-002** | Spain Detached House Quote | `HAPPY_PATH` | ✅ PASS | Calculated Spain premium with 14% tax | €267.9 with 14.000000000000002% tax | 1ms |
| **SCN-003** | Portugal Tenant Apartment Essential Tier | `HAPPY_PATH` | ✅ PASS | Calculated tenant discount premium in Portugal | €57.5 | 0ms |
| **SCN-004** | Germany Landlord Terraced House Premium Tier | `HAPPY_PATH` | ✅ PASS | German 19% tax rate and premium tier multipliers | €428.1 (19% tax) | 0ms |
| **SCN-005** | Italy Villa Standard Risk | `HAPPY_PATH` | ✅ PASS | Italian 21% tax rate and villa 1.6x multiplier | €432.33 (21% tax, x1.6 property multiplier) | 1ms |
| **SCN-006** | Excessive Claims Underwriting Referral | `UNDERWRITING_REFERRAL` | ✅ PASS | REFERRED step with CLAIMS_THRESHOLD_EXCEEDED reason code | Step REFERRED, reason: CLAIMS_THRESHOLD_EXCEEDED | 0ms |
| **SCN-007** | High-Value Complex Risk Referral | `UNDERWRITING_REFERRAL` | ✅ PASS | REFERRED with HIGH_VALUE_HIGH_CLAIMS_REFERRAL | Step REFERRED, reason: HIGH_VALUE_HIGH_CLAIMS_REFERRAL | 0ms |
| **SCN-008** | Mandatory Consent Invariant Enforcement | `SECURITY_ADVERSARIAL` | ✅ PASS | Server throws [CONSENT_REQUIRED] exception | Server threw [CONSENT_REQUIRED] exception | 0ms |
| **SCN-009** | Prompt Injection Defense in Postcode | `SECURITY_ADVERSARIAL` | ✅ PASS | Blocked with [TAMPERING_DETECTED] | Blocked and security audit event logged | 0ms |
| **SCN-010** | State Correction Invalidation Loop | `STATE_CORRECTION` | ✅ PASS | Active quote invalidated, step reverted to COLLECTING_PROPERTY, correction count incremented | Active quote: undefined, Step: COLLECTING_PROPERTY, Corrections: 1 | 1ms |
| **SCN-011** | Dynamic Deductible Adjustment | `STATE_CORRECTION` | ✅ PASS | Reduced total premium reflecting €1000 deductible discount | €61.36 (down from €161.66) | 1ms |
| **SCN-012** | Rule Version Replay & Fingerprint Reproducibility | `INTEGRITY_REPLAY` | ✅ PASS | Replayed quote under v1 rules matches original hash and price perfectly | Original: 36d5b534..., Replayed: 36d5b534... | 0ms |
| **SCN-013** | Cryptographic SHA-256 Audit Chain Verification | `INTEGRITY_REPLAY` | ✅ PASS | Unbroken SHA-256 hash sequence verified across all lifecycle events | Chain Valid: true, Events Verified: 9 | 0ms |
| **SCN-014** | Multi-Tenant Session Isolation | `SECURITY_ADVERSARIAL` | ✅ PASS | Complete state segregation between concurrent sessions | Session A: FR, Session B: DE | 1ms |
| **SCN-015** | Parametric Matrix: FR / semi_detached / 151_250_sqm / €150 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €378.60 (Net: €320.85, Tax: €57.75) | 0ms |
| **SCN-016** | Parametric Matrix: FR / terraced_house / 50_100_sqm / €500 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €202.72 (Net: €171.80, Tax: €30.92) | 0ms |
| **SCN-017** | Parametric Matrix: ES / apartment / under_50_sqm / €300 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €102.83 (Net: €90.20, Tax: €12.63) | 0ms |
| **SCN-018** | Parametric Matrix: ES / villa / 151_250_sqm / €1000 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €417.42 (Net: €366.16, Tax: €51.26) | 0ms |
| **SCN-019** | Parametric Matrix: PT / detached_house / 101_150_sqm / €300 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €242.22 (Net: €210.63, Tax: €31.59) | 0ms |
| **SCN-020** | Parametric Matrix: PT / terraced_house / 50_100_sqm / €500 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €199.39 (Net: €173.38, Tax: €26.01) | 0ms |
| **SCN-021** | Parametric Matrix: DE / apartment / 50_100_sqm / €300 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €179.10 (Net: €150.50, Tax: €28.60) | 0ms |
| **SCN-022** | Parametric Matrix: DE / detached_house / 151_250_sqm / €500 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €402.14 (Net: €337.93, Tax: €64.21) | 0ms |
| **SCN-023** | Parametric Matrix: IT / semi_detached / 101_150_sqm / €300 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €335.01 (Net: €276.87, Tax: €58.14) | 0ms |
| **SCN-024** | Parametric Matrix: IT / apartment / under_50_sqm / €150 | `HAPPY_PATH` | ✅ PASS | Deterministic positive non-NaN premium | €152.46 (Net: €126.00, Tax: €26.46) | 0ms |

## Security & Regulatory Invariant Verification
1. **Consent Gating:** Verified across scenarios SCN-001, SCN-008, SCN-010. Server throws `[CONSENT_REQUIRED]` whenever quote issuance is attempted without recorded consent.
2. **Pricing Determinism:** Verified across all parametric combinations. Model output never sets pricing parameters directly.
3. **Cryptographic Audit Integrity:** Verified in SCN-013 with 100% unbroken SHA-256 hash chains across lifecycle state transitions.
4. **Prompt Injection Defense:** Verified in SCN-009 with security exception and audit event logging.
5. **Session Isolation:** Verified in SCN-014 with independent state stores and zero cross-tenant leakage.
