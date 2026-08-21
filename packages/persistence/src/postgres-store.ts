import { randomUUID } from 'node:crypto';
import pg from 'pg';
import type { FunnelSession, IndicativeQuote } from '@northstar/domain';
import type { SessionStore, IdempotencyRecord } from './store.interface.js';

const { Pool } = pg;

export class PostgresSessionStore implements SessionStore {
  private readonly pool: pg.Pool;
  private isInitialized = false;

  constructor(
    private readonly connectionString: string = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/northstar_insurance',
    private readonly defaultTtlSeconds: number = 3600
  ) {
    this.pool = new Pool({
      connectionString: this.connectionString,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(64) PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS quote_sessions (
          session_id UUID PRIMARY KEY,
          correlation_id VARCHAR(128) NOT NULL,
          step VARCHAR(64) NOT NULL,
          payload JSONB NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_quote_sessions_expires_at ON quote_sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_quote_sessions_correlation_id ON quote_sessions(correlation_id);

        CREATE TABLE IF NOT EXISTS quote_history (
          quote_id UUID PRIMARY KEY,
          session_id UUID NOT NULL,
          rule_version VARCHAR(64) NOT NULL,
          input_snapshot JSONB NOT NULL,
          eligibility_snapshot JSONB NOT NULL,
          pricing_snapshot JSONB NOT NULL,
          quote_hash VARCHAR(64) NOT NULL,
          status VARCHAR(32) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_quote_history_session_id ON quote_history(session_id);

        CREATE TABLE IF NOT EXISTS audit_events (
          event_id UUID PRIMARY KEY,
          session_id UUID NOT NULL,
          correlation_id VARCHAR(128) NOT NULL,
          event_type VARCHAR(64) NOT NULL,
          actor VARCHAR(32) NOT NULL,
          rule_version VARCHAR(64),
          metadata JSONB,
          previous_hash VARCHAR(64) NOT NULL,
          current_hash VARCHAR(64) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audit_events_session_id ON audit_events(session_id, created_at);

        CREATE TABLE IF NOT EXISTS idempotency_records (
          idempotency_key VARCHAR(255) PRIMARY KEY,
          session_id UUID NOT NULL,
          operation VARCHAR(64) NOT NULL,
          request_fingerprint VARCHAR(128) NOT NULL,
          response_payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_records(expires_at);
      `);
      this.isInitialized = true;
    } finally {
      client.release();
    }
  }

  async createSession(
    sessionId: string = randomUUID(),
    correlationId: string = randomUUID(),
    ttlSeconds: number = this.defaultTtlSeconds
  ): Promise<FunnelSession> {
    await this.initialize();
    const now = new Date();
    const expiresAtEpoch = Date.now() + ttlSeconds * 1000;
    const expiresAt = new Date(expiresAtEpoch).toISOString();

    const session: FunnelSession = {
      sessionId,
      correlationId,
      step: 'INIT',
      partialInput: {},
      historicalQuotes: [],
      correctionCount: 0,
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt
    };

    await this.saveSession(session);
    return session;
  }

  async saveSession(session: FunnelSession): Promise<void> {
    await this.initialize();
    const expiresAt = session.expiresAt || new Date(Date.now() + this.defaultTtlSeconds * 1000).toISOString();
    const payload = JSON.stringify(session);

    await this.pool.query(
      `INSERT INTO quote_sessions (session_id, correlation_id, step, payload, version, updated_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (session_id) DO UPDATE SET
         step = EXCLUDED.step,
         payload = EXCLUDED.payload,
         version = quote_sessions.version + 1,
         updated_at = NOW(),
         expires_at = EXCLUDED.expires_at`,
      [session.sessionId, session.correlationId, session.step, payload, session.version ?? 1, expiresAt]
    );
  }

  async getSession(sessionId: string): Promise<FunnelSession | null> {
    await this.initialize();
    const result = await this.pool.query(
      `SELECT payload, expires_at FROM quote_sessions
       WHERE session_id = $1 AND expires_at > NOW()`,
      [sessionId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0].payload as FunnelSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    await this.initialize();
    const result = await this.pool.query(
      `DELETE FROM quote_sessions WHERE session_id = $1`,
      [sessionId]
    );
    await this.pool.query(`DELETE FROM quote_history WHERE session_id = $1`, [sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  async saveQuote(quote: IndicativeQuote): Promise<void> {
    await this.initialize();
    await this.pool.query(
      `INSERT INTO quote_history (quote_id, session_id, rule_version, input_snapshot, eligibility_snapshot, pricing_snapshot, quote_hash, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (quote_id) DO UPDATE SET status = EXCLUDED.status`,
      [
        quote.quoteId,
        quote.sessionId,
        quote.ruleVersion,
        JSON.stringify(quote.input),
        JSON.stringify(quote.eligibility),
        JSON.stringify(quote.pricing),
        quote.quoteHash,
        quote.status,
        quote.expiresAt
      ]
    );
  }

  async getQuoteHistory(sessionId: string): Promise<IndicativeQuote[]> {
    await this.initialize();
    const result = await this.pool.query(
      `SELECT quote_id, session_id, rule_version, input_snapshot, eligibility_snapshot, pricing_snapshot, quote_hash, status, created_at, expires_at
       FROM quote_history WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows.map((row) => ({
      quoteId: row.quote_id,
      sessionId: row.session_id,
      ruleVersion: row.rule_version,
      input: row.input_snapshot,
      eligibility: row.eligibility_snapshot,
      pricing: row.pricing_snapshot,
      quoteHash: row.quote_hash,
      mandatoryDisclosure: 'Indicative non-binding quotation.',
      isBinding: false,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at.toISOString()
    }));
  }

  async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    await this.initialize();
    const result = await this.pool.query(
      `SELECT idempotency_key, session_id, operation, request_fingerprint, response_payload, created_at, expires_at
       FROM idempotency_records WHERE idempotency_key = $1 AND expires_at > NOW()`,
      [key]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      idempotencyKey: row.idempotency_key,
      sessionId: row.session_id,
      operation: row.operation,
      requestFingerprint: row.request_fingerprint,
      responsePayload: row.response_payload,
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at.toISOString()
    };
  }

  async saveIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
    await this.initialize();
    await this.pool.query(
      `INSERT INTO idempotency_records (idempotency_key, session_id, operation, request_fingerprint, response_payload, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (idempotency_key) DO UPDATE SET response_payload = EXCLUDED.response_payload`,
      [
        record.idempotencyKey,
        record.sessionId,
        record.operation,
        record.requestFingerprint,
        JSON.stringify(record.responsePayload),
        record.expiresAt
      ]
    );
  }

  async cleanExpiredSessions(): Promise<number> {
    await this.initialize();
    const result = await this.pool.query(`DELETE FROM quote_sessions WHERE expires_at < NOW()`);
    await this.pool.query(`DELETE FROM idempotency_records WHERE expires_at < NOW()`);
    return result.rowCount ?? 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
