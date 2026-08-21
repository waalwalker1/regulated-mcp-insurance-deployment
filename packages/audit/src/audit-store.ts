import { randomUUID } from 'node:crypto';
import type { AuditEvent, AuditEventType } from '@northstar/domain';
import { redactMetadata } from './redactor.js';
import { calculateEventHash } from './hasher.js';
import type { AuditRepository } from './audit-repository.js';
import { MemoryAuditRepository } from './memory-audit-repository.js';
import { PostgresAuditRepository } from './postgres-audit-repository.js';

export const GENESIS_HASH = '0'.repeat(64);

export class AuditStore {
  private readonly repository: AuditRepository;

  constructor(repository?: AuditRepository) {
    if (repository) {
      this.repository = repository;
    } else if (process.env.PERSISTENCE_MODE === 'postgres' && process.env.DATABASE_URL) {
      this.repository = new PostgresAuditRepository(process.env.DATABASE_URL);
    } else {
      this.repository = new MemoryAuditRepository();
    }
  }

  /**
   * Append an audit event to the tamper-evident chain
   */
  async recordEvent(params: {
    sessionId: string;
    correlationId: string;
    eventType: AuditEventType;
    actor: 'user' | 'assistant' | 'server' | 'admin-demo';
    ruleVersion?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    const eventId = randomUUID();
    const timestamp = new Date().toISOString();
    const lastHash = await this.repository.getLastHash(params.sessionId);
    const previousHash = lastHash || GENESIS_HASH;
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

    await this.repository.append(event);
    return event;
  }

  /**
   * Get all events for a given session ID
   */
  async getEventsBySession(sessionId: string): Promise<AuditEvent[]> {
    return this.repository.getEventsBySession(sessionId);
  }

  /**
   * Get all events matching a correlation ID
   */
  async getEventsByCorrelationId(correlationId: string): Promise<AuditEvent[]> {
    if (this.repository.getEventsByCorrelationId) {
      return this.repository.getEventsByCorrelationId(correlationId);
    }
    return [];
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
        event.metadata || {}
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
  async clear(): Promise<void> {
    if (this.repository.clear) {
      await this.repository.clear();
    }
  }

  async close(): Promise<void> {
    if (this.repository.close) {
      await this.repository.close();
    }
  }
}

export const globalAuditStore = new AuditStore();
