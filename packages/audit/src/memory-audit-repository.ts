import type { AuditEvent } from "@northstar/domain";
import type { AuditRepository } from "./audit-repository.js";

export class MemoryAuditRepository implements AuditRepository {
  private events: AuditEvent[] = [];
  private sessionLastHashMap = new Map<string, string>();

  async append(event: AuditEvent): Promise<void> {
    this.events.push(JSON.parse(JSON.stringify(event)) as AuditEvent);
    this.sessionLastHashMap.set(event.sessionId, event.currentHash);
  }

  async getEventsBySession(sessionId: string): Promise<AuditEvent[]> {
    const list = this.events.filter((e) => e.sessionId === sessionId);
    return JSON.parse(JSON.stringify(list)) as AuditEvent[];
  }

  async getEventsByCorrelationId(correlationId: string): Promise<AuditEvent[]> {
    const list = this.events.filter((e) => e.correlationId === correlationId);
    return JSON.parse(JSON.stringify(list)) as AuditEvent[];
  }

  async getLastHash(sessionId: string): Promise<string | null> {
    return this.sessionLastHashMap.get(sessionId) ?? null;
  }

  clear(): void {
    this.events = [];
    this.sessionLastHashMap.clear();
  }
}
