# 5-Minute Demonstration Script (Video / Live Recording Guide)

## Video Timeline & Spoken Transcript

### 1. Problem Statement (00:00–00:30)
> *"Welcome. Today we are demonstrating the Northstar Regulated MCP Insurance Deployment Kit. In regulated European insurance, conversational AI can dramatically improve customer quote funnels, but regulations like GDPR and Solvency II forbid nondeterministic price calculations, unrecorded consent, or black-box state transitions. Here is how we solve this."*

### 2. Architecture Overview (00:30–01:00)
> *"Our architecture strictly separates the conversational layer from the deterministic core. The AI assistant connects via standard Model Context Protocol (MCP). The server owns state transitions, Zod validation, pure-function pricing formulas, and an append-only audit log with SHA-256 hash chaining."*

### 3. Live Quoting Demo (01:00–02:30)
> *"Let's run `make demo`. We initialize a new session and submit property details for an apartment in Paris. Notice how the server validates the French 5-digit postcode and advances the state to risk factors. We declare the property was built in 2010 with 0 claims. The server evaluates eligibility and prompts for coverage selection."*

### 4. Demonstrating Invariant & Consent Enforcement (02:30–03:30)
> *"Here is the hard invariant: If we attempt to calculate a quote before the customer gives consent, the server immediately rejects the request with `[CONSENT_REQUIRED]`. Once explicit consent is granted, the server executes pure actuarial formulas, outputting a €161.66 annual premium with complete multiplier breakdown and a unique SHA-256 quote fingerprint."*

### 5. Correction & Adjustment Loops (03:30–04:15)
> *"If the customer decides to increase their deductible from €300 to €500, we invoke `adjust_quote`. The premium is immediately recalculated down to €126.26 without restarting the funnel. Finally, we inspect the audit trail: all 10 events are cryptographically verified with 100% chain integrity."*

### 6. Enterprise Deliverables & Wrap-Up (04:15–05:00)
> *"Beyond code, this kit includes 16 FDE delivery documents, a 35-question security questionnaire, and a 24-scenario automated evaluation suite. The entire repository is open-source, reproducible in zero-credential local mode with `make release-check`, and production-shaped for enterprise deployment."*
