import { describe, it, expect, beforeEach } from 'vitest';
import { AuditStore, redactMetadata } from '../packages/audit/src/index.js';

describe('Audit Store & Cryptographic Hash Chaining', () => {
  let auditStore: AuditStore;

  beforeEach(() => {
    auditStore = new AuditStore();
  });

  it('records events with unbroken SHA-256 hash chaining', async () => {
    const sessionId = 'session-audit-123';
    const correlationId = 'corr-audit-123';

    const e1 = await auditStore.recordEvent({
      sessionId,
      correlationId,
      eventType: 'session.started',
      actor: 'user',
      metadata: { channel: 'mcp' }
    });

    const e2 = await auditStore.recordEvent({
      sessionId,
      correlationId,
      eventType: 'field.received',
      actor: 'user',
      metadata: { country: 'FR', postcode: '75008' }
    });

    const e3 = await auditStore.recordEvent({
      sessionId,
      correlationId,
      eventType: 'consent.granted',
      actor: 'user',
      metadata: { consentVersion: 'v1' }
    });

    expect(e1.previousHash).toBe('0'.repeat(64));
    expect(e2.previousHash).toBe(e1.currentHash);
    expect(e3.previousHash).toBe(e2.currentHash);

    const verification = await auditStore.verifyChainIntegrity(sessionId);
    expect(verification.isValid).toBe(true);
    expect(verification.eventCount).toBe(3);
  });

  it('redacts sensitive fields like email and tokens', () => {
    const raw = {
      country: 'FR',
      contactEmail: 'jane.doe@example.com',
      apiKey: 'sk-secret-12345',
      nested: {
        email: 'admin@insurance.eu',
        city: 'Paris'
      }
    };

    const redacted = redactMetadata(raw);
    expect(redacted.country).toBe('FR');
    expect(redacted.contactEmail).toBe('ja***@example.com');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect((redacted.nested as any).email).toBe('ad***@insurance.eu');
    expect((redacted.nested as any).city).toBe('Paris');
  });
});
