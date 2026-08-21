# Domain Model and Deterministic Rules Architecture

## 1. Architectural Mission
The core requirement of the Northstar Home Insurance EU reference implementation is **strict server-side ownership of pricing, eligibility, validation, consent, and audit records**. The AI assistant / MCP client acts exclusively as a conversational field extraction and presentation interface. The model has **zero authority** to:
- calculate or override insurance premiums;
- relax or alter underwriting eligibility thresholds;
- bypass required GDPR/data processing consent;
- persist unvalidated state transitions.

## 2. Domain Schema Hierarchy
All schemas are strictly defined using [Zod](https://github.com/colinhacks/zod) in [`packages/domain/src/schemas.ts`](../../packages/domain/src/schemas.ts).

### User-Supplied Fields
| Field | Type / Enum | Validation Rules | Purpose |
|---|---|---|---|
| `country` | `'FR' \| 'ES' \| 'PT' \| 'DE' \| 'IT'` | ISO 3166-1 alpha-2, restricted to supported demo countries | Base rate and regulatory tax determination |
| `postcode` | `string` | Regex-validated per country (e.g. `FR`/`DE`/`ES`/`IT`: 5 digits, `PT`: 4-3 digits) | Geographic risk zone verification |
| `propertyType` | `'apartment' \| 'detached_house' \| 'semi_detached' \| 'terraced_house' \| 'villa'` | Strict enum | Structural risk factor multiplier |
| `occupancyType` | `'owner_occupied' \| 'tenant' \| 'landlord'` | Strict enum | Usage risk factor multiplier |
| `constructionYearBand` | `'pre_1970' \| '1970_1999' \| '2000_2015' \| 'post_2015'` | Strict enum | Age of infrastructure multiplier |
| `floorAreaBand` | `'under_50_sqm' \| '50_100_sqm' \| '101_150_sqm' \| '151_250_sqm' \| 'over_250_sqm'` | Strict enum | Replacement cost volume |
| `isPrimaryResidence` | `boolean` | Boolean | Primary occupancy vs holiday home risk |
| `claimsCount5Years` | `number` (integer 0–10) | Bounded integer; >3 triggers referral | Historical claims loss multiplier |
| `coverageTier` | `'essential' \| 'comfort' \| 'premium'` | Default: `comfort` | Scope of coverage multiplier |
| `deductible` | `150 \| 300 \| 500 \| 1000` (EUR) | Default: `300` | Out-of-pocket discount subtraction |
| `contactEmail` | `string` (email, optional) | Valid email format; only processed after consent | Delivery of non-binding summary |

### Server-Derived Fields
- `normalizedRegion`: Derived region classification.
- `eligibilityStatus`: `'eligible' | 'referral_required' | 'declined'`.
- `reasonCodes`: Machine-readable audit codes (e.g., `['RISK_CRITERIA_MET']`, `['CLAIMS_THRESHOLD_EXCEEDED']`).
- `pricingBreakdown`: Transparent audit object detailing each multiplier applied to the base rate.
- `netAnnualPremium`: Gross premium minus deductible discount.
- `fictionalTaxAmount`: Country-specific insurance premium tax.
- `totalAnnualPremium`: Final non-binding annual total.
- `totalMonthlyPremium`: Annual / 12 rounded to cents.
- `quoteHash`: Deterministic SHA-256 fingerprint over non-PII decision parameters.
- `ruleVersion`: Version identifier (e.g., `northstar-home-eu-v1`).
- `expiresAt`: ISO-8601 timestamp (30 days from calculation).

---

## 3. Deterministic Pricing Formula
The premium is computed as a pure function:

$$\text{grossAnnual} = \text{baseRate}(\text{country}) \times \mu_{\text{property}} \times \mu_{\text{occupancy}} \times \mu_{\text{area}} \times \mu_{\text{year}} \times \mu_{\text{claims}} \times \mu_{\text{tier}}$$

$$\text{netAnnual} = \max\left(50.00, \text{grossAnnual} - \text{discount}(\text{deductible})\right)$$

$$\text{tax} = \text{round}\left(\text{netAnnual} \times \tau(\text{country}), 2\right)$$

$$\text{totalAnnual} = \text{netAnnual} + \text{tax}$$

$$\text{totalMonthly} = \text{round}\left(\frac{\text{totalAnnual}}{12}, 2\right)$$

All multipliers and coefficients reside in versioned configurations ([`packages/rules/src/v1.ts`](../../packages/rules/src/v1.ts)).

---

## 4. Rule Versioning and Replay Guarantee
Every generated quote persists its `ruleVersion`. If underwriting rules are revised (e.g., in [`v2.ts`](../../packages/rules/src/v2.ts)), historical quotes retain their original `ruleVersion` and can be deterministically re-evaluated to reproduce the identical premium and cryptographic hash.
