import type { AuditEvent } from "@northstar/domain";

export interface AuditRepository {
  append(event: AuditEvent): Promise<void>;
  getEventsBySession(sessionId: string): Promise<AuditEvent[]>;
  getEventsByCorrelationId?(correlationId: string): Promise<AuditEvent[]>;
  getLastHash(sessionId: string): Promise<string | null>;
  clear?(): Promise<void> | void;
  close?(): Promise<void>;
}
