import { describe, it, expect } from 'vitest';
import { createSessionStore } from '../packages/persistence/src/factory.js';
import { InMemorySessionStore } from '../packages/persistence/src/memory-store.js';
import { FunnelEngine } from '../apps/mcp-server/src/funnel-engine.js';
import { AuditStore } from '../packages/audit/src/audit-store.js';
import { getRuleSet } from '../packages/rules/src/registry.js';
import type { FunnelSession } from '../packages/domain/src/types.js';
import { randomUUID } from 'node:crypto';

describe('Failure Injection & Resilience Tests', () => {
  it('should fail startup immediately when PERSISTENCE_MODE=postgres and DATABASE_URL is missing', () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    expect(() => createSessionStore('postgres')).toThrow(/PERSISTENCE_CONFIG_ERROR/);

    process.env.DATABASE_URL = originalEnv;
  });

  it('should safely expire sessions after TTL and reject access', async () => {
    const store = new InMemorySessionStore(1); // 1 second TTL
    const sessionId = randomUUID();

    const session: FunnelSession = {
      sessionId,
      correlationId: 'corr-fail-ttl',
      step: 'COLLECTING_PROPERTY',
      partialInput: {},
      historicalQuotes: [],
      correctionCount: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString() // Expired in past
    };

    await store.saveSession(session);
    const fetched = await store.getSession(sessionId);
    expect(fetched).toBeNull();
  });

  it('should throw safe domain error when requesting an unknown rule set', () => {
    expect(() => getRuleSet('non_existent_rule_version')).toThrow(/Unknown insurance rule version/);
  });

  it('should fail closed when attempting quote generation without prior consent', async () => {
    const engine = new FunnelEngine(new InMemorySessionStore(), new AuditStore());
    const session = await engine.startSession();
    await engine.submitPropertyBasics(session.sessionId, {
      country: 'FR',
      postcode: '75008',
      propertyType: 'apartment',
      occupancyType: 'owner_occupied'
    });
    await engine.submitRiskFactors(session.sessionId, {
      constructionYearBand: '2000_2015',
      floorAreaBand: '50_100_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 0
    });
    await engine.evaluateEligibility(session.sessionId);
    await engine.selectCoverage(session.sessionId, { coverageTier: 'comfort', deductible: 300 });
    await engine.confirmParameters(session.sessionId, true);

    // Calculate before consent
    await expect(engine.calculateQuote(session.sessionId)).rejects.toThrow(/CONSENT_REQUIRED/);
  });
});
