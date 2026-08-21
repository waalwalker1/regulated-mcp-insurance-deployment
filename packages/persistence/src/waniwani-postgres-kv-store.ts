import pg from "pg";

const { Pool } = pg;

export interface KvStoreSetOptions {
  ttlSeconds?: number;
}

export interface KvStore<T = Record<string, unknown>> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, options?: KvStoreSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

export class PostgresWaniwaniKvStore<
  T = Record<string, unknown>,
> implements KvStore<T> {
  private readonly pool: pg.Pool;
  private isInitialized = false;

  constructor(
    private readonly connectionString: string = process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/northstar_insurance",
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

  async get(key: string): Promise<T | null> {
    await this.initialize();
    const result = await this.pool.query(
      `SELECT value, expires_at FROM waniwani_flow_state
       WHERE flow_key = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [key],
    );

    if (result.rows.length === 0) return null;
    return result.rows[0].value as T;
  }

  async set(key: string, value: T, options?: KvStoreSetOptions): Promise<void> {
    await this.initialize();
    const expiresAt = options?.ttlSeconds
      ? new Date(Date.now() + options.ttlSeconds * 1000).toISOString()
      : null;

    await this.pool.query(
      `INSERT INTO waniwani_flow_state (flow_key, value, updated_at, expires_at)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (flow_key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW(),
         expires_at = EXCLUDED.expires_at`,
      [key, JSON.stringify(value), expiresAt],
    );
  }

  async delete(key: string): Promise<void> {
    await this.initialize();
    await this.pool.query(
      `DELETE FROM waniwani_flow_state WHERE flow_key = $1`,
      [key],
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
