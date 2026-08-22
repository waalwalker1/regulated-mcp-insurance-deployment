import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  DomainError,
  type FunnelSession,
  type IndicativeQuote,
} from "@northstar/domain";
import type { SessionStore, IdempotencyRecord } from "./store.interface.js";

const { Pool } = pg;

export class PostgresSessionStore implements SessionStore {
  private readonly pool: pg.Pool;
  private isInitialized = false;

  constructor(
    private readonly connectionString: string = process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/northstar_insurance",
    private readonly defaultTtlSeconds: number = 3600,
  ) {
    this.pool = new Pool({
      connectionString: this.connectionString,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
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
          id BIGSERIAL,
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

        ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS id BIGSERIAL;
        CREATE INDEX IF NOT EXISTS idx_audit_events_session_id ON audit_events(session_id, id ASC);

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

        CREATE TABLE IF NOT EXISTS waniwani_flow_state (
          flow_key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ
        );

        CREATE INDEX IF NOT EXISTS idx_waniwani_flow_state_expires ON waniwani_flow_state(expires_at);
      `);
      this.isInitialized = true;
    } finally {
      client.release();
    }
  }

  async createSession(
    sessionId: string = randomUUID(),
    correlationId: string = randomUUID(),
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<FunnelSession> {
    await this.initialize();
    const now = new Date();
    const expiresAtEpoch = Date.now() + ttlSeconds * 1000;
    const expiresAt = new Date(expiresAtEpoch).toISOString();

    const session: FunnelSession = {
      sessionId,
      correlationId,
      step: "INIT",
      partialInput: {},
      historicalQuotes: [],
      correctionCount: 0,
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt,
    };

    const payload = JSON.stringify(session);
    await this.pool.query(
      `INSERT INTO quote_sessions (session_id, correlation_id, step, payload, version, created_at, updated_at, expires_at)
       VALUES ($1, $2, $3, $4, 1, NOW(), NOW(), $5)
       ON CONFLICT (session_id) DO NOTHING`,
      [sessionId, correlationId, session.step, payload, expiresAt],
    );

    return session;
  }

  /**
   * Save session using compare-and-swap Optimistic Concurrency Control
   */
  async saveSession(session: FunnelSession): Promise<void> {
    await this.initialize();
    const expiresAt =
      session.expiresAt ||
      new Date(Date.now() + this.defaultTtlSeconds * 1000).toISOString();
    const expectedVersion = session.version ?? 1;

    // Check if session exists
    const checkRes = await this.pool.query(
      `SELECT version FROM quote_sessions WHERE session_id = $1`,
      [session.sessionId],
    );

    if (checkRes.rows.length === 0) {
      // New insert
      session.version = 1;
      const payload = JSON.stringify(session);
      await this.pool.query(
        `INSERT INTO quote_sessions (session_id, correlation_id, step, payload, version, created_at, updated_at, expires_at)
         VALUES ($1, $2, $3, $4, 1, NOW(), NOW(), $5)`,
        [
          session.sessionId,
          session.correlationId,
          session.step,
          payload,
          expiresAt,
        ],
      );
      return;
    }

    // Atomic compare-and-swap update
    const nextVersion = expectedVersion + 1;
    session.version = nextVersion;
    const payload = JSON.stringify(session);

    const updateRes = await this.pool.query(
      `UPDATE quote_sessions
       SET step = $1, payload = $2, version = $3, updated_at = NOW(), expires_at = $4
       WHERE session_id = $5 AND version = $6
       RETURNING version`,
      [
        session.step,
        payload,
        nextVersion,
        expiresAt,
        session.sessionId,
        expectedVersion,
      ],
    );

    if ((updateRes.rowCount ?? 0) === 0) {
      throw new DomainError(
        "CONCURRENT_MODIFICATION",
        `Session '${session.sessionId}' was concurrently modified by another process. Expected version ${expectedVersion}.`,
      );
    }

    session.version = updateRes.rows[0].version;
  }

  async getSession(sessionId: string): Promise<FunnelSession | null> {
    await this.initialize();
    const result = await this.pool.query(
      `SELECT payload, version, expires_at FROM quote_sessions
       WHERE session_id = $1 AND expires_at > NOW()`,
      [sessionId],
    );

    if (result.rows.length === 0) return null;
    const rawPayload = result.rows[0].payload;
    const session = (
      typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload
    ) as FunnelSession;
    session.version = result.rows[0].version;
    return session;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    await this.initialize();
    const result = await this.pool.query(
      `DELETE FROM quote_sessions WHERE session_id = $1`,
      [sessionId],
    );
    await this.pool.query(`DELETE FROM quote_history WHERE session_id = $1`, [
      sessionId,
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Scrub personal contact data across sessions and historical quote snapshots
   */
  async anonymizeSession(sessionId: string): Promise<boolean> {
    await this.initialize();
    const session = await this.getSession(sessionId);
    if (!session) return false;

    // Scrub session payload
    delete session.partialInput.contactEmail;
    if (session.validatedInput) {
      delete session.validatedInput.contactEmail;
    }
    if (session.activeQuote?.input) {
      delete session.activeQuote.input.contactEmail;
    }
    for (const h of session.historicalQuotes) {
      if (h.input) delete h.input.contactEmail;
    }

    session.updatedAt = new Date().toISOString();
    const payload = JSON.stringify(session);

    await this.pool.query(
      `UPDATE quote_sessions SET payload = $1, updated_at = NOW() WHERE session_id = $2`,
      [payload, sessionId],
    );

    // Scrub quote_history table snapshots
    await this.pool.query(
      `UPDATE quote_history
       SET input_snapshot = input_snapshot - 'contactEmail'
       WHERE session_id = $1`,
      [sessionId],
    );

    return true;
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
        quote.expiresAt,
      ],
    );
  }

  async getQuoteHistory(sessionId: string): Promise<IndicativeQuote[]> {
    await this.initialize();
    const result = await this.pool.query(
      `SELECT quote_id, session_id, rule_version, input_snapshot, eligibility_snapshot, pricing_snapshot, quote_hash, status, created_at, expires_at
       FROM quote_history WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId],
    );

    return result.rows.map((row) => ({
      quoteId: row.quote_id,
      sessionId: row.session_id,
      ruleVersion: row.rule_version,
      input: row.input_snapshot,
      eligibility: row.eligibility_snapshot,
      pricing: row.pricing_snapshot,
      quoteHash: row.quote_hash,
      mandatoryDisclosure: "Indicative non-binding quotation.",
      isBinding: false,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
    }));
  }

  async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    await this.initialize();
    const result = await this.pool.query(
      `SELECT idempotency_key, session_id, operation, request_fingerprint, response_payload, created_at, expires_at
       FROM idempotency_records WHERE idempotency_key = $1 AND expires_at > NOW()`,
      [key],
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
      expiresAt: row.expires_at.toISOString(),
    };
  }

  async saveIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
    await this.initialize();
    await this.pool.query(
      `INSERT INTO idempotency_records (idempotency_key, session_id, operation, request_fingerprint, response_payload, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        record.idempotencyKey,
        record.sessionId,
        record.operation,
        record.requestFingerprint,
        JSON.stringify(record.responsePayload),
        record.expiresAt,
      ],
    );
  }

  async cleanExpiredSessions(): Promise<number> {
    await this.initialize();
    const result = await this.pool.query(
      `DELETE FROM quote_sessions WHERE expires_at < NOW()`,
    );
    await this.pool.query(
      `DELETE FROM idempotency_records WHERE expires_at < NOW()`,
    );
    await this.pool.query(
      `DELETE FROM waniwani_flow_state WHERE expires_at < NOW()`,
    );
    return result.rowCount ?? 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
