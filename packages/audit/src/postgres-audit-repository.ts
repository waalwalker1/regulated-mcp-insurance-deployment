import pg from "pg";
import type { AuditEvent } from "@northstar/domain";
import type { AuditRepository } from "./audit-repository.js";

const { Pool } = pg;

export class PostgresAuditRepository implements AuditRepository {
  private readonly pool: pg.Pool;

  constructor(
    connectionString: string = process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/northstar_insurance",
  ) {
    this.pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });
  }

  async append(event: AuditEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_events (
        event_id, session_id, correlation_id, event_type, actor, rule_version, metadata, previous_hash, current_hash, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        event.eventId,
        event.sessionId,
        event.correlationId,
        event.eventType,
        event.actor,
        event.ruleVersion ?? null,
        JSON.stringify(event.metadata ?? {}),
        event.previousHash,
        event.currentHash,
        event.timestamp,
      ],
    );
  }

  async getEventsBySession(sessionId: string): Promise<AuditEvent[]> {
    const res = await this.pool.query(
      `SELECT event_id, session_id, correlation_id, event_type, actor, rule_version, metadata, previous_hash, current_hash, created_at
       FROM audit_events WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId],
    );

    return res.rows.map((row) => ({
      eventId: row.event_id,
      sessionId: row.session_id,
      correlationId: row.correlation_id,
      eventType: row.event_type,
      actor: row.actor,
      ruleVersion: row.rule_version ?? undefined,
      metadata: row.metadata ?? {},
      previousHash: row.previous_hash,
      currentHash: row.current_hash,
      timestamp: row.created_at.toISOString(),
    }));
  }

  async getEventsByCorrelationId(correlationId: string): Promise<AuditEvent[]> {
    const res = await this.pool.query(
      `SELECT event_id, session_id, correlation_id, event_type, actor, rule_version, metadata, previous_hash, current_hash, created_at
       FROM audit_events WHERE correlation_id = $1 ORDER BY created_at ASC`,
      [correlationId],
    );

    return res.rows.map((row) => ({
      eventId: row.event_id,
      sessionId: row.session_id,
      correlationId: row.correlation_id,
      eventType: row.event_type,
      actor: row.actor,
      ruleVersion: row.rule_version ?? undefined,
      metadata: row.metadata ?? {},
      previousHash: row.previous_hash,
      currentHash: row.current_hash,
      timestamp: row.created_at.toISOString(),
    }));
  }

  async getLastHash(sessionId: string): Promise<string | null> {
    const res = await this.pool.query(
      `SELECT current_hash FROM audit_events WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [sessionId],
    );
    if (res.rows.length === 0) return null;
    return res.rows[0].current_hash;
  }

  async clear(): Promise<void> {
    await this.pool.query(`TRUNCATE TABLE audit_events`);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
