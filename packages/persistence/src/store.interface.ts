import type { FunnelSession, IndicativeQuote } from "@northstar/domain";

export interface IdempotencyRecord {
  idempotencyKey: string;
  sessionId: string;
  operation: string;
  requestFingerprint: string;
  responsePayload: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

export interface SessionStore {
  createSession(
    sessionId: string,
    correlationId?: string,
    ttlSeconds?: number,
  ): Promise<FunnelSession>;
  saveSession(session: FunnelSession): Promise<void>;
  getSession(sessionId: string): Promise<FunnelSession | null>;
  deleteSession(sessionId: string): Promise<boolean>;
  anonymizeSession?(sessionId: string): Promise<boolean>;
  saveQuote(quote: IndicativeQuote): Promise<void>;
  getQuoteHistory(sessionId: string): Promise<IndicativeQuote[]>;
  getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null>;
  saveIdempotencyRecord(record: IdempotencyRecord): Promise<void>;
  cleanExpiredSessions(): Promise<number>;
  close?(): Promise<void>;
}
