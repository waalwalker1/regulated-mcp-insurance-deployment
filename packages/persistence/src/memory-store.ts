import { randomUUID } from 'node:crypto';
import type { FunnelSession, IndicativeQuote } from '@northstar/domain';
import type { SessionStore, IdempotencyRecord } from './store.interface.js';

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, { session: FunnelSession; expiresAtEpoch: number }>();
  private readonly quotes = new Map<string, IndicativeQuote[]>();
  private readonly idempotencyRecords = new Map<string, { record: IdempotencyRecord; expiresAtEpoch: number }>();

  constructor(private readonly defaultTtlSeconds: number = 3600) {}

  async createSession(
    sessionId: string = randomUUID(),
    correlationId: string = randomUUID(),
    ttlSeconds: number = this.defaultTtlSeconds
  ): Promise<FunnelSession> {
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

    this.sessions.set(sessionId, { session, expiresAtEpoch });
    return JSON.parse(JSON.stringify(session)) as FunnelSession;
  }

  async saveSession(session: FunnelSession): Promise<void> {
    const expiresAtDate = new Date(session.expiresAt);
    const expiresAtEpoch = isNaN(expiresAtDate.getTime())
      ? Date.now() + this.defaultTtlSeconds * 1000
      : expiresAtDate.getTime();

    // Deep clone to prevent direct object reference mutation bugs
    const cloned = JSON.parse(JSON.stringify(session)) as FunnelSession;
    this.sessions.set(session.sessionId, { session: cloned, expiresAtEpoch });
  }

  async getSession(sessionId: string): Promise<FunnelSession | null> {
    const entry = this.sessions.get(sessionId);
    if (!entry) return null;

    if (Date.now() > entry.expiresAtEpoch) {
      this.sessions.delete(sessionId);
      return null;
    }

    return JSON.parse(JSON.stringify(entry.session)) as FunnelSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const existed = this.sessions.delete(sessionId);
    this.quotes.delete(sessionId);
    return existed;
  }

  async saveQuote(quote: IndicativeQuote): Promise<void> {
    const list = this.quotes.get(quote.sessionId) ?? [];
    list.push(JSON.parse(JSON.stringify(quote)) as IndicativeQuote);
    this.quotes.set(quote.sessionId, list);
  }

  async getQuoteHistory(sessionId: string): Promise<IndicativeQuote[]> {
    const list = this.quotes.get(sessionId) ?? [];
    return JSON.parse(JSON.stringify(list)) as IndicativeQuote[];
  }

  async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    const entry = this.idempotencyRecords.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAtEpoch) {
      this.idempotencyRecords.delete(key);
      return null;
    }
    return JSON.parse(JSON.stringify(entry.record)) as IdempotencyRecord;
  }

  async saveIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
    const expiresAtEpoch = new Date(record.expiresAt).getTime();
    this.idempotencyRecords.set(record.idempotencyKey, {
      record: JSON.parse(JSON.stringify(record)) as IdempotencyRecord,
      expiresAtEpoch: isNaN(expiresAtEpoch) ? Date.now() + 86400 * 1000 : expiresAtEpoch
    });
  }

  async cleanExpiredSessions(): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [id, entry] of this.sessions.entries()) {
      if (now > entry.expiresAtEpoch) {
        this.sessions.delete(id);
        count++;
      }
    }
    for (const [key, entry] of this.idempotencyRecords.entries()) {
      if (now > entry.expiresAtEpoch) {
        this.idempotencyRecords.delete(key);
      }
    }
    return count;
  }
}
