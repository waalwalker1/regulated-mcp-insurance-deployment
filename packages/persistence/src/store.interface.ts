import type { FunnelSession } from '@northstar/domain';

export interface SessionStore {
  createSession(sessionId: string, correlationId: string, ttlSeconds?: number): Promise<FunnelSession>;
  getSession(sessionId: string): Promise<FunnelSession | null>;
  saveSession(session: FunnelSession): Promise<void>;
  deleteSession(sessionId: string): Promise<boolean>;
  cleanExpiredSessions(): Promise<number>;
  listSessions(): Promise<FunnelSession[]>;
  close(): Promise<void>;
}
