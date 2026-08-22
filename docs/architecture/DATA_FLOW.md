# End-to-End Quotation Data Flow Architecture

## 1. High-Level Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / LLM Client
    participant Server as Northstar MCP Server
    participant Flow as Waniwani StateGraph Flow
    participant Evaluator as Deterministic Rules Core
    participant Store as Session Store (PostgreSQL)
    participant Audit as Append-Only Audit Store

    Customer->>Server: Call get_home_insurance_quote(initial input)
    Server->>Flow: Execute Flow StateGraph
    Flow->>Customer: Interrupt(collect_property)
    Customer->>Flow: Provide { country: 'FR', postcode: '75008', propertyType: 'apartment', occupancyType: 'owner_occupied' }
    Flow->>Customer: Interrupt(collect_risk)
    Customer->>Flow: Provide { constructionYearBand: '2000_2015', floorAreaBand: '50_100_sqm', claimsCount5Years: 0 }
    Flow->>Evaluator: evaluateEligibility(validatedInput)
    Evaluator-->>Flow: Outcome: ELIGIBLE
    Flow->>Customer: Interrupt(select_coverage)
    Customer->>Flow: Provide { coverageTier: 'comfort', deductible: 300 }
    Flow->>Customer: Interrupt(confirm_parameters: summary)
    Customer->>Flow: Confirm details (parametersConfirmed: true)
    Flow->>Customer: Interrupt(request_consent: consent_v1_2026)
    Customer->>Flow: Grant consent (hasConsented: true)
    Flow->>Evaluator: calculatePricing(validatedInput, ruleSet)
    Evaluator-->>Flow: PricingBreakdown + SHA-256 Fingerprint
    Flow->>Store: Persist Quote & Session State
    Flow->>Audit: Append chained audit events (SHA-256)
    Flow-->>Customer: Return Issued Indicative Quote (Non-binding)
```

---

## 2. Invalidation & Correction Data Flow

```mermaid
flowchart TD
    A[Customer Requests Correction] --> B{Correction Field Tier}
    B -->|Tier 1: Structural / Risk Factors| C[Invalidate Active Quote]
    C --> D[Archive to Historical Quotes]
    D --> E[Clear Consent & Confirmation Timestamps]
    E --> F[Reset State to COLLECTING_PROPERTY]
    B -->|Tier 2: Coverage / Deductible| G[Invalidate Active Quote]
    G --> H[Clear Consent & Confirmation Timestamps]
    H --> I[Reset State to COLLECTING_COVERAGE]
    B -->|Tier 3: Contact Email| J[Update Session Input In-Place]
    J --> K[Preserve Active Quote & Consent]
```

---

## 3. Cryptographic Hash Chain Data Flow

Every audit event is cryptographically linked to its predecessor:

$$\text{Event}_{n}.\text{currentHash} = \text{SHA256}\left(\text{Event}_{n-1}.\text{currentHash} \parallel \text{Event}_{n}.\text{eventId} \parallel \text{Event}_{n}.\text{sessionId} \parallel \dots\right)$$

This provides a tamper-evident audit record and allows deterministic external verification via `npm run audit:verify -- <sessionId>`. Verification validates that retained events have not been modified, inserted, or reordered within the sequence. Detecting tail-deletion requires an externally retained final event hash or record count.
