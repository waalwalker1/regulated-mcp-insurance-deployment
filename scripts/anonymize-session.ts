import { createSessionStore } from '../packages/persistence/src/index.js';
import { AuditStore } from '../packages/audit/src/index.js';

/**
 * GDPR Article 17 Right to Erasure / Session Anonymization CLI utility
 */
async function anonymizeSession(sessionId?: string) {
  const targetSession = sessionId || process.argv[2];
  if (!targetSession) {
    console.error('Usage: npx tsx scripts/anonymize-session.ts <sessionId>');
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

    // Redact personal inputs in active session
    if (session.partialInput.contactEmail) {
      session.partialInput.contactEmail = '[DELETED_GDPR_ART17]';
    }
    if (session.validatedInput?.contactEmail) {
      session.validatedInput.contactEmail = undefined;
    }
    if (session.activeQuote?.input.contactEmail) {
      session.activeQuote.input.contactEmail = undefined;
    }

    // Redact historical quotes
    for (const h of session.historicalQuotes) {
      if (h.input.contactEmail) {
        h.input.contactEmail = undefined;
      }
    }

    session.version = (session.version ?? 0) + 1;
    session.updatedAt = new Date().toISOString();
    await store.saveSession(session);

    // Record audit erasure event with hash chain preservation
    await auditStore.recordEvent({
      sessionId: targetSession,
      correlationId: session.correlationId,
      eventType: 'session.anonymized',
      actor: 'admin-demo',
      metadata: {
        action: 'gdpr_erasure_request',
        status: 'completed',
        erasureTimestamp: new Date().toISOString()
      }
    });

    const verifyResult = await auditStore.verifyChainIntegrity(targetSession);
    console.log(`[GDPR Erasure] Successfully anonymized session ${targetSession}. Audit chain integrity: ${verifyResult.isValid ? 'VALID' : 'BROKEN'}`);
  } finally {
    if (store.close) await store.close();
    await auditStore.close();
  }
}

const target = process.argv[2];
if (target) {
  anonymizeSession(target).catch(console.error);
} else {
  console.log('Anonymization script loaded. Provide sessionId argument to execute.');
}
