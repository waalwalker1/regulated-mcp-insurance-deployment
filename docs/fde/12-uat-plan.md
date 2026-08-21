# User Acceptance Testing (UAT) Plan

## 1. Test Scope & Methodology
UAT validates the end-to-end user experience, underwriting accuracy, and security controls across 5 categories:

| Category | Test Scenarios | Verification Method | Acceptance Criteria |
|---|---|---|---|
| **A. Happy Path Quoting** | France, Spain, Portugal, Germany, Italy properties across apartment, house, and villa categories | Automated script + MCP client session | Premium calculated accurately to exact cents matching actuarial spreadsheets. |
| **B. Underwriting Referrals** | $\ge 4$ claims in 5 years, or large villa ($>250\text{ m}^2$) with 2 claims | Trigger `evaluate_eligibility` | Session transitions to `REFERRED` with explicit reason codes. |
| **C. Correction & Adjustment** | Changing property type after quote issuance; adjusting deductible from €300 to €1000 | Invoke `correct_field` and `adjust_quote` | Downstream quote invalidated on critical change; deductible adjusted immediately without restarting funnel. |
| **D. Consent & Privacy Gate** | Attempt quote calculation prior to consent; submit valid consent declaration | Invoke `calculate_quote` | Rejected with `[CONSENT_REQUIRED]` until `submit_consent` is invoked. |
| **E. Audit Chain Integrity** | Complete full quoting journey and export audit log | Invoke `export_audit_trail` | 100% valid SHA-256 hash sequence from genesis. |
