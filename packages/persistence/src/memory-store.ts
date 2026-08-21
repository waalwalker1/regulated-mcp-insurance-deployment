import type { FunnelSession } from '@northstar/domain';
import type { SessionStore } from './store.interface.js';

export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, FunnelSession>();

  async createSession(
    sessionId: string,
    correlationId: string,
    ttlSeconds: number = 3600
  ): Promise<FunnelSession> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

    const session: FunnelSession = {
      sessionId,
      step: 'INIT',
      partialInput: {},
      historicalQuotes: [],
      correctionCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt,
      correlationId
    };

    this.sessions.set(sessionId, structuredClone(session));
    return session;
  }

  async getSession(sessionId: string): Promise<FunnelSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return structuredClone(session);
  }

  async saveSession(session: FunnelSession): Promise<void> {
    session.updatedAt = new Date().toISOString();
    this.sessions.set(session.sessionId, structuredClone(session));
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async cleanExpiredSessions(): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        this.sessions.delete(id);
        count++;
      }
    }
    return count;
  }

  async listSessions(): Promise<FunnelSession[]> {
    const now = Date.now();
    const valid: FunnelSession[] = [];
    for (const session of this.sessions.values()) {
      if (new Date(session.expiresAt).getTime() >= now) {
        valid.push(structuredClone(session));
      }
    }
    return valid;
  }

  async close(): Promise<void> {
    this.sessions.clear();
  }
}
