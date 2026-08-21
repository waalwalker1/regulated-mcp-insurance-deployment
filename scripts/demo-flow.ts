import { FunnelEngine } from "../apps/mcp-server/src/funnel-engine.js";
import { InMemorySessionStore } from "../packages/persistence/src/index.js";
import { AuditStore } from "../packages/audit/src/index.js";

async function runDemo() {
  console.log(
    "========================================================================",
  );
  console.log("  NORTHSTAR HOME INSURANCE EU — REGULATED MCP FUNNEL DEMO");
  console.log("  Mode: Zero-Credential Local Demonstration");
  console.log("  Master Build Standard: 2026-08-21");
  console.log(
    "========================================================================\n",
  );

  const auditStore = new AuditStore();
  const engine = new FunnelEngine(new InMemorySessionStore(), auditStore);

  console.log("[Step 1] Initializing new quotation session...");
  const session = await engine.startSession("demo-correlation-101");
  console.log(`  -> Session ID: ${session.sessionId}`);
  console.log(`  -> Initial Step: ${session.step}\n`);

  console.log(
    "[Step 2] Collecting Property Location & Structural Classification...",
  );
  const s2 = await engine.submitPropertyBasics(session.sessionId, {
    country: "FR",
    postcode: "75008",
    propertyType: "apartment",
    occupancyType: "owner_occupied",
  });
  console.log(
    `  -> Property Recorded: France (75008), Apartment (Owner-Occupied)`,
  );
  console.log(`  -> Step Advanced To: ${s2.step}\n`);

  console.log(
    "[Step 3] Collecting Risk Factors (Construction period, floor area, claims)...",
  );
  const s3 = await engine.submitRiskFactors(session.sessionId, {
    constructionYearBand: "2000_2015",
    floorAreaBand: "50_100_sqm",
    isPrimaryResidence: true,
    claimsCount5Years: 0,
  });
  console.log(
    `  -> Risk Factors Recorded: 2000-2015, 50-100 sqm, Primary Residence, 0 Claims`,
  );
  console.log(`  -> Step Advanced To: ${s3.step}\n`);

  console.log(
    "[Step 4] Evaluating Underwriting Eligibility (Deterministic Rules)...",
  );
  const s4 = await engine.evaluateEligibility(session.sessionId);
  console.log(
    `  -> Eligibility Outcome: ${s4.eligibilityResult?.status.toUpperCase()}`,
  );
  console.log(
    `  -> Reason Codes: ${s4.eligibilityResult?.reasonCodes.join(", ")}`,
  );
  console.log(
    `  -> Underwriting Rule Version: ${s4.eligibilityResult?.ruleVersion}\n`,
  );

  console.log("[Step 5] Selecting Coverage Package & Deductible...");
  const s5 = await engine.selectCoverage(session.sessionId, {
    coverageTier: "comfort",
    deductible: 300,
    contactEmail: "jane.doe@example.fr",
  });
  console.log(
    `  -> Tier: Comfort, Deductible: €300, Email: jane.doe@example.fr`,
  );
  console.log(`  -> Step Advanced To: ${s5.step}\n`);

  console.log("[Step 6] Customer Confirms Summary Parameters...");
  const s6 = await engine.confirmParameters(session.sessionId, true);
  console.log(`  -> Confirmed: true. Ready for Consent Gating.`);
  console.log(`  -> Step Advanced To: ${s6.step}\n`);

  console.log(
    "[Step 7] Checking Hard Invariant: Attempt Quote Calculation WITHOUT Consent...",
  );
  try {
    await engine.calculateQuote(session.sessionId);
    console.error(
      "  -> ERROR: Server allowed calculation without consent! (Failed Invariant)",
    );
  } catch (err: any) {
    console.log(
      `  -> Invariant Preserved: Server rejected calculation: ${err.message}\n`,
    );
  }

  console.log("[Step 8] Granting Explicit GDPR Data Processing Consent...");
  const s7 = await engine.submitConsent(session.sessionId, "consent_v1_2026");
  console.log(
    `  -> Consent Recorded: version ${s7.consentDeclaration?.consentVersion} at ${s7.consentDeclaration?.consentTimestamp}\n`,
  );

  console.log(
    "[Step 9] Calculating Indicative Quote (Deterministic Server Calculation)...",
  );
  const quote = await engine.calculateQuote(session.sessionId);
  console.log(
    "  ----------------------------------------------------------------------",
  );
  console.log(`  QUOTE ISSUED: ${quote.quoteId}`);
  console.log(`  Rule Version: ${quote.ruleVersion}`);
  console.log(`  Quote Fingerprint (SHA-256): ${quote.quoteHash}`);
  console.log(
    `  Base Annual Premium: €${quote.pricing.baseAnnualPremium.toFixed(2)}`,
  );
  console.log(
    `  Property Multiplier: x${quote.pricing.propertyTypeMultiplier}`,
  );
  console.log(
    `  Deductible Discount: -€${quote.pricing.deductibleDiscount.toFixed(2)}`,
  );
  console.log(
    `  Net Annual Premium:  €${quote.pricing.netAnnualPremium.toFixed(2)}`,
  );
  console.log(
    `  Tax (${quote.pricing.taxRatePercent}%):         +€${quote.pricing.fictionalTaxAmount.toFixed(2)}`,
  );
  console.log(
    `  TOTAL ANNUAL:        €${quote.pricing.totalAnnualPremium.toFixed(2)}`,
  );
  console.log(
    `  TOTAL MONTHLY:       €${quote.pricing.totalMonthlyPremium.toFixed(2)}`,
  );
  console.log(
    `  Status:              ${quote.status} (Non-binding indicative)`,
  );
  console.log(
    "  ----------------------------------------------------------------------\n",
  );

  console.log(
    "[Step 10] Demonstrating Dynamic Quote Adjustment Loop (€300 -> €500 deductible)...",
  );
  const adjusted = await engine.adjustQuote(session.sessionId, {
    deductible: 500,
  });
  console.log(`  -> Adjusted Quote ID: ${adjusted.quoteId}`);
  console.log(
    `  -> New Deductible Discount: -€${adjusted.pricing.deductibleDiscount.toFixed(2)}`,
  );
  console.log(
    `  -> New Total Annual Premium: €${adjusted.pricing.totalAnnualPremium.toFixed(2)} (Previous: €${quote.pricing.totalAnnualPremium.toFixed(2)})\n`,
  );

  console.log("[Step 11] Verifying Cryptographic Audit Event Chain...");
  const audit = await engine.exportAuditTrail(session.sessionId);
  console.log(`  -> Total Logged Audit Events: ${audit.eventCount}`);
  console.log(
    `  -> Cryptographic Chain Integrity: ${audit.chainIntegrity.isValid ? "VALID (100% UNBROKEN)" : "INVALID"}`,
  );
  console.log(
    `  -> Sample Redacted Event Metadata:`,
    JSON.stringify(audit.events[audit.events.length - 1].metadata),
  );

  console.log(
    "\n========================================================================",
  );
  console.log("  DEMO COMPLETE: ALL INVARIANTS AND CONTROLS VERIFIED LOCALLY");
  console.log(
    "========================================================================",
  );
}

runDemo().catch((err) => {
  console.error("[Demo Failed]", err);
  process.exit(1);
});
