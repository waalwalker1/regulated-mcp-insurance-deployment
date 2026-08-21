import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgresSessionStore } from '../../packages/persistence/src/postgres-store.js';
import { PostgresAuditRepository } from '../../packages/audit/src/postgres-audit-repository.js';
import { AuditStore } from '../../packages/audit/src/audit-store.js';
import type { FunnelSession, IndicativeQuote } from '../../packages/domain/src/index.js';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

describe('Integration: Real PostgreSQL Persistence & Restart Durability', () => {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/northstar_insurance';
  let isPostgresAvailable = false;
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 1500
    });

    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      isPostgresAvailable = true;
    } catch {
      console.warn('[Postgres Integration] PostgreSQL not available on localhost:5432. Marking test as NOT_EXECUTED.');
      isPostgresAvailable = false;
    }
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it('should persist session and survive store recreation (restart test)', async () => {
    if (!isPostgresAvailable) {
      console.log('Skipping Postgres restart test: database unavailable in local environment');
      return;
    }

    const sessionId = randomUUID();
    const correlationId = 'corr-pg-restart-1';

    // Store Instance 1: Create session
    const store1 = new PostgresSessionStore(dbUrl);
    await store1.initialize();

    const session: FunnelSession = {
      sessionId,
      correlationId,
      step: 'COLLECTING_PROPERTY',
      partialInput: { country: 'FR', postcode: '75008' },
      historicalQuotes: [],
      correctionCount: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    };

    await store1.saveSession(session);
    await store1.close();

    // Store Instance 2: Simulate process restart and read persisted session
    const store2 = new PostgresSessionStore(dbUrl);
    const restored = await store2.getSession(sessionId);

    expect(restored).toBeDefined();
    expect(restored?.sessionId).toBe(sessionId);
    expect(restored?.partialInput.country).toBe('FR');
    expect(restored?.partialInput.postcode).toBe('75008');

    // Clean up
    await store2.deleteSession(sessionId);
    await store2.close();
  });

  it('should persist audit events durably and verify hash chain integrity across restart', async () => {
    if (!isPostgresAvailable) {
      console.log('Skipping Postgres audit restart test: database unavailable in local environment');
      return;
    }

    const sessionId = randomUUID();
    const correlationId = 'corr-pg-audit-1';

    // Audit Store 1: Record chained events
    const auditRepo1 = new PostgresAuditRepository(dbUrl);
    const auditStore1 = new AuditStore(auditRepo1);

    await auditStore1.recordEvent({
      sessionId,
      correlationId,
      eventType: 'session.started',
      actor: 'user',
      metadata: { note: 'Initial event' }
    });

    await auditStore1.recordEvent({
      sessionId,
      correlationId,
      eventType: 'consent.granted',
      actor: 'user',
      metadata: { consentVersion: 'consent_v1_2026' }
    });

    await auditStore1.close();

    // Audit Store 2: Read and verify chain after process restart
    const auditRepo2 = new PostgresAuditRepository(dbUrl);
    const auditStore2 = new AuditStore(auditRepo2);

    const verification = await auditStore2.verifyChainIntegrity(sessionId);
    expect(verification.isValid).toBe(true);
    expect(verification.eventCount).toBe(2);

    await auditStore2.close();
  });
});
