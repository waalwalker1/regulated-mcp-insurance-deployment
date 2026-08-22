# Quick Technical Demonstration (5-Minute Walkthrough Guide)

## Timeline & Walkthrough Script

### 1. Overview & Problem Context (00:00–00:30)

> _"Welcome. Today we are demonstrating the Northstar Regulated MCP Insurance reference architecture. Insurance and financial-services workflows require careful control over pricing logic, consent and lawful processing, decision traceability, data handling, and auditability. This reference implementation demonstrates one architecture for enforcing those controls around a conversational interface."_

### 2. Architecture Overview (00:30–01:00)

> _"Our architecture strictly separates conversational natural-language extraction from the deterministic server core. The client connects via standard Model Context Protocol (MCP). The compiled server owns all state transitions, Zod validation, pure-function pricing formulas, and a tamper-evident audit log with continuous SHA-256 hash chaining."_

### 3. Execution of Quoting Workflow (01:00–02:30)

> _"Running `npm run demo`: we initialize a new quotation session and submit property details for an apartment in Paris. The server validates the French 5-digit postcode and advances the state to risk factors. We declare construction period and claims history. The server evaluates underwriting eligibility and prompts for coverage selection."_

### 4. Invariant & Consent Enforcement (02:30–03:30)

> _"Here is a key invariant: If quote calculation is attempted before the customer explicitly confirms parameters and grants consent, the server strictly rejects the request with `[CONSENT_REQUIRED]`. Once explicit consent is granted, the server executes pure actuarial formulas, outputting an indicative premium with complete multiplier breakdown and a unique SHA-256 quote fingerprint."_

### 5. State Correction & Dynamic Adjustment Loops (03:30–04:15)

> _"If the customer adjusts their deductible from €300 to €500, we invoke `adjust_quote`. The premium recalculates deterministically to €126.26 without restarting the funnel. Finally, we inspect the audit trail: all 10 lifecycle events are cryptographically verified with 100% unbroken chain integrity."_

### 6. Enterprise Documentation & Verification (04:15–05:00)

> _"Beyond the executable system, the repository includes enterprise delivery documentation covering discovery, requirements traceability, deployment planning, UAT, security review, and operational handover. The entire codebase is verified with unit, protocol, property, and 24-scenario automated evaluation suites running locally in zero-credential mode."_
