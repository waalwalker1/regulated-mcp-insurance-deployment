import { randomUUID } from 'node:crypto';
import type { AuditEvent, AuditEventType, AuditActor } from '@northstar/domain';
import { redactMetadata } from './redactor.js';
import { calculateEventHash } from './hasher.js';

export const GENESIS_HASH = '0'.repeat(64);

export class AuditStore {
  private events: AuditEvent[] = [];
  private sessionLastHashMap = new Map<string, string>();

  /**
   * Append an audit event to the tamper-evident chain
   */
  async recordEvent(params: {
    sessionId: string;
    correlationId: string;
    eventType: AuditEventType;
    actor: AuditActor;
    ruleVersion?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    const eventId = randomUUID();
    const timestamp = new Date().toISOString();
    const previousHash = this.sessionLastHashMap.get(params.sessionId) || GENESIS_HASH;
    const sanitizedMetadata = redactMetadata(params.metadata || {});

    const currentHash = calculateEventHash(
      previousHash,
      eventId,
      params.sessionId,
      params.correlationId,
      timestamp,
      params.eventType,
      params.actor,
      params.ruleVersion,
      sanitizedMetadata
    );

    const event: AuditEvent = {
      eventId,
      sessionId: params.sessionId,
      correlationId: params.correlationId,
      timestamp,
      eventType: params.eventType,
      actor: params.actor,
      ruleVersion: params.ruleVersion,
      metadata: sanitizedMetadata,
      previousHash,
      currentHash
    };

    this.events.push(event);
    this.sessionLastHashMap.set(params.sessionId, currentHash);

    return event;
  }

  /**
   * Get all events for a given session ID
   */
  async getEventsBySession(sessionId: string): Promise<AuditEvent[]> {
    return this.events.filter((e) => e.sessionId === sessionId);
  }

  /**
   * Get all events matching a correlation ID
   */
  async getEventsByCorrelationId(correlationId: string): Promise<AuditEvent[]> {
    return this.events.filter((e) => e.correlationId === correlationId);
  }

  /**
   * Verify cryptographic integrity of a session's event chain
   */
  async verifyChainIntegrity(sessionId: string): Promise<{
    isValid: boolean;
    eventCount: number;
    failedAtEventId?: string;
  }> {
    const sessionEvents = await this.getEventsBySession(sessionId);
    if (sessionEvents.length === 0) {
      return { isValid: true, eventCount: 0 };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (const event of sessionEvents) {
      if (event.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          eventCount: sessionEvents.length,
          failedAtEventId: event.eventId
        };
      }

      const calculatedCurrentHash = calculateEventHash(
        event.previousHash,
        event.eventId,
        event.sessionId,
        event.correlationId,
        event.timestamp,
        event.eventType,
        event.actor,
        event.ruleVersion,
        event.metadata
      );

      if (calculatedCurrentHash !== event.currentHash) {
        return {
          isValid: false,
          eventCount: sessionEvents.length,
          failedAtEventId: event.eventId
        };
      }

      expectedPrevHash = event.currentHash;
    }

    return { isValid: true, eventCount: sessionEvents.length };
  }

  /**
   * Clear events (used during tests / cleanup)
   */
  clear(): void {
    this.events = [];
    this.sessionLastHashMap.clear();
  }
}

export const globalAuditStore = new AuditStore();
