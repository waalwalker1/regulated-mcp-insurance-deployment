import { createSessionStore } from '../packages/persistence/src/index.js';
import { globalAuditStore } from '../packages/audit/src/index.js';

/**
 * GDPR Article 17 Right to Erasure / Session Anonymization CLI utility
 */
async function anonymizeSession(sessionId: string) {
  if (!sessionId) {
    console.error('Usage: npx tsx scripts/anonymize-session.ts <sessionId>');
    process.exit(1);
  }

  const store = createSessionStore();
  const session = await store.getSession(sessionId);

  if (!session) {
    console.error(`Session '${sessionId}' not found or already deleted.`);
    process.exit(1);
  }

  console.log(`[GDPR Erasure] Anonymizing session: ${sessionId}`);

  // Redact personal inputs
  if (session.partialInput.contactEmail) {
    session.partialInput.contactEmail = '[DELETED_GDPR_ART17]';
  }
  if (session.validatedInput?.contactEmail) {
    session.validatedInput.contactEmail = undefined;
  }

  await store.saveSession(session);

  // Record audit erasure event
  await globalAuditStore.recordEvent({
    sessionId,
    correlationId: session.correlationId,
    eventType: 'session.completed',
    actor: 'admin-demo',
    metadata: {
      action: 'gdpr_erasure_request',
      status: 'completed',
      erasureTimestamp: new Date().toISOString()
    }
  });

  console.log(`[GDPR Erasure] Successfully anonymized session ${sessionId}. Audit record logged.`);
}

const targetSession = process.argv[2];
if (targetSession) {
  anonymizeSession(targetSession).catch(console.error);
} else {
  console.log('Anonymization script loaded. Provide sessionId argument to execute.');
}
