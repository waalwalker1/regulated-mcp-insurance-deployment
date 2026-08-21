import { AuditStore } from '../packages/audit/src/index.js';

async function verifyAudit(sessionId?: string) {
  const targetSessionId = sessionId || process.argv[2];
  if (!targetSessionId) {
    console.error('Usage: npm run audit:verify -- <sessionId>');
    process.exit(1);
  }

  console.log(`[Audit Verify] Verifying SHA-256 hash chain for session: ${targetSessionId}`);
  const auditStore = new AuditStore();

  try {
    const events = await auditStore.getEventsBySession(targetSessionId);
    console.log(`[Audit Verify] Found ${events.length} audit events for session.`);

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      console.log(`  [${i + 1}] ${e.timestamp} | ${e.eventType} | Actor: ${e.actor} | Hash: ${e.currentHash.substring(0, 16)}... (Prev: ${e.previousHash.substring(0, 16)}...)`);
    }

    const result = await auditStore.verifyChainIntegrity(targetSessionId);
    if (result.isValid) {
      console.log(`\n==> SUCCESS: Cryptographic hash chain is 100% VALID (${result.eventCount} events verified from genesis).`);
      process.exit(0);
    } else {
      console.error(`\n==> INTEGRITY FAILURE: Audit chain broken at event ID: ${result.failedAtEventId}`);
      process.exit(1);
    }
  } finally {
    await auditStore.close();
  }
}

verifyAudit().catch((err) => {
  console.error('[Audit Verify Error]', err);
  process.exit(1);
});
