# Data Flow and Classification Guide

## 1. Data Classification Inventory

| Data Element           | Sensitivity Tier | Purpose                                   | Storage Target              | Retention Period                | Redacted in Logs?           |
| ---------------------- | ---------------- | ----------------------------------------- | --------------------------- | ------------------------------- | --------------------------- |
| `country`              | INTERNAL         | Regional pricing & tax rate determination | Session Store / Audit Event | 30 days (Session TTL)           | No                          |
| `postcode`             | INTERNAL         | Geographic risk zone calculation          | Session Store / Audit Event | 30 days                         | No                          |
| `propertyType`         | INTERNAL         | Structural risk multiplier                | Session Store / Audit Event | 30 days                         | No                          |
| `occupancyType`        | INTERNAL         | Occupancy risk multiplier                 | Session Store / Audit Event | 30 days                         | No                          |
| `floorAreaBand`        | INTERNAL         | Volume multiplier                         | Session Store / Audit Event | 30 days                         | No                          |
| `constructionYearBand` | INTERNAL         | Infrastructure age multiplier             | Session Store / Audit Event | 30 days                         | No                          |
| `claimsCount5Years`    | INTERNAL         | Loss history multiplier                   | Session Store / Audit Event | 30 days                         | No                          |
| `contactEmail`         | RESTRICTED_PII   | Non-binding quote PDF delivery (Optional) | Session Store (Memory/DB)   | Purged on session completion    | **Yes (ja***@example.com)** |
| `consentDeclaration`   | CONFIDENTIAL     | Proof of GDPR processing consent          | Session Store & Audit Chain | 7 years (Statutory requirement) | No                          |
| `quoteHash`            | INTERNAL         | Cryptographic fingerprint of quote        | Quote Record & Audit Chain  | 7 years                         | No                          |

---

## 2. End-to-End Quoting Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Prospective Customer
    participant Assistant as MCP Assistant / LLM
    participant MCP as Northstar MCP Gateway
    participant Rules as Deterministic Rules Core
    participant Audit as Cryptographic Audit Store
    participant DB as Session Store (PostgreSQL)

    User->>Assistant: "I need home insurance for my apartment in Paris (75008)."
    Assistant->>MCP: submit_property_basics({ country: 'FR', postcode: '75008', ... })
    MCP->>DB: Save validated property fields (TTL 3600s)
    MCP->>Audit: Record 'field.received' event (SHA-256 Chained)
    MCP-->>Assistant: Prompt for structural risk details

    User->>Assistant: "Built in 2010, 75 sqm, 0 claims."
    Assistant->>MCP: submit_risk_factors({ year: '2000_2015', area: '50_100_sqm', claims: 0 })
    MCP->>Rules: evaluateEligibility(input, 'v1')
    Rules-->>MCP: { status: 'eligible', reasonCodes: ['RISK_CRITERIA_MET'] }
    MCP-->>Assistant: Prompt for confirmation and consent

    User->>Assistant: "Confirmed. I give consent to process my data."
    Assistant->>MCP: submit_consent({ hasConsented: true, version: 'consent_v1_2026' })
    MCP->>Audit: Record 'consent.granted' event
    Assistant->>MCP: calculate_quote()
    MCP->>Rules: calculatePricing(input, 'v1')
    Rules-->>MCP: PricingBreakdown (€161.66 total annual)
    MCP->>Audit: Record 'quote.calculated' and 'quote.presented'
    MCP-->>Assistant: Present indicative quote breakdown and mandatory disclosure
    Assistant-->>User: Display €161.66 annual / €13.47 monthly quote
```
