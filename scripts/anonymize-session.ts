import { createSessionStore } from "../packages/persistence/src/index.js";
import { AuditStore } from "../packages/audit/src/index.js";

/**
 * GDPR Article 17 Right to Erasure / Session Anonymization CLI utility
 */
async function anonymizeSession(sessionId?: string) {
  const targetSession = sessionId || process.argv[2];
  if (!targetSession) {
    console.error("Usage: npx tsx scripts/anonymize-session.ts <sessionId>");
    process.exit(1);
  }

  const store = createSessionStore();
  const auditStore = new AuditStore();

  try {
    const session = await store.getSession(targetSession);

    if (!session) {
      console.error(`Session '${targetSession}' not found or already deleted.`);
      process.exit(1);
    }

    console.log(`[GDPR Erasure] Anonymizing session: ${targetSession}`);

    // Call store-level anonymization
    if (store.anonymizeSession) {
      await store.anonymizeSession(targetSession);
    } else {
      // Fallback
      delete session.partialInput.contactEmail;
      if (session.validatedInput) delete session.validatedInput.contactEmail;
      if (session.activeQuote?.input)
        delete session.activeQuote.input.contactEmail;
      for (const h of session.historicalQuotes) {
        if (h.input) delete h.input.contactEmail;
      }
      await store.saveSession(session);
    }

    // Record audit erasure event with hash chain preservation (no PII)
    await auditStore.recordEvent({
      sessionId: targetSession,
      correlationId: session.correlationId,
      eventType: "session.anonymized",
      actor: "admin-demo",
      metadata: {
        action: "gdpr_erasure_request",
        status: "completed",
        erasureTimestamp: new Date().toISOString(),
      },
    });

    const verifyResult = await auditStore.verifyChainIntegrity(targetSession);
    console.log(
      `[GDPR Erasure] Successfully anonymized session ${targetSession}. Audit chain integrity: ${verifyResult.isValid ? "VALID" : "BROKEN"}`,
    );
  } finally {
    if (store.close) await store.close();
    await auditStore.close();
  }
}

const target = process.argv[2];
if (target) {
  anonymizeSession(target).catch(console.error);
} else {
  console.log(
    "Anonymization script loaded. Provide sessionId argument to execute.",
  );
}
