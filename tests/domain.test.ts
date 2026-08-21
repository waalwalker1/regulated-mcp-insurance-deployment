import { describe, it, expect } from 'vitest';
import {
  QuoteInputSchema,
  ConsentDeclarationSchema,
  FunnelStateMachine,
  type FunnelSession
} from '../packages/domain/src/index.js';

describe('Domain Schemas & Validation', () => {
  it('validates a correct full quote input for France', () => {
    const valid = {
      country: 'FR',
      postcode: '75008',
      propertyType: 'apartment',
      occupancyType: 'owner_occupied',
      constructionYearBand: '2000_2015',
      floorAreaBand: '50_100_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 0,
      coverageTier: 'comfort',
      deductible: 300
    };

    const parsed = QuoteInputSchema.parse(valid);
    expect(parsed.country).toBe('FR');
    expect(parsed.postcode).toBe('75008');
  });

  it('rejects invalid country or bad postcode format', () => {
    const invalid = {
      country: 'FR',
      postcode: 'INVALID-POSTCODE',
      propertyType: 'apartment',
      occupancyType: 'tenant',
      constructionYearBand: 'post_2015',
      floorAreaBand: 'under_50_sqm',
      isPrimaryResidence: true,
      claimsCount5Years: 0
    };

    expect(() => QuoteInputSchema.parse(invalid)).toThrow(/Invalid postal code format/);
  });

  it('enforces explicit consent true', () => {
    const validConsent = {
      hasConsentedToDataProcessing: true,
      consentVersion: 'consent_v1_2026',
      consentTimestamp: new Date().toISOString()
    };
    expect(ConsentDeclarationSchema.parse(validConsent).hasConsentedToDataProcessing).toBe(true);

    const invalidConsent = {
      hasConsentedToDataProcessing: false,
      consentVersion: 'consent_v1_2026',
      consentTimestamp: new Date().toISOString()
    };
    expect(() => ConsentDeclarationSchema.parse(invalidConsent)).toThrow();
  });
});

describe('Funnel State Machine', () => {
  function createTestSession(): FunnelSession {
    return {
      sessionId: 'test-session-123',
      step: 'INIT',
      partialInput: {},
      historicalQuotes: [],
      correctionCount: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      correlationId: 'corr-test-123'
    };
  }

  it('allows valid step transitions', () => {
    const session = createTestSession();
    expect(FunnelStateMachine.canTransition(session.step, 'COLLECTING_PROPERTY')).toBe(true);
    FunnelStateMachine.transition(session, 'COLLECTING_PROPERTY');
    expect(session.step).toBe('COLLECTING_PROPERTY');

    FunnelStateMachine.transition(session, 'COLLECTING_RISK');
    expect(session.step).toBe('COLLECTING_RISK');
  });

  it('throws on invalid step jumps', () => {
    const session = createTestSession();
    expect(() => FunnelStateMachine.transition(session, 'QUOTED')).toThrow(/Cannot transition funnel session/);
  });

  it('handles correction loop by resetting step and invalidating prior quote', () => {
    const session = createTestSession();
    session.step = 'QUOTED';
    session.partialInput = {
      country: 'FR',
      postcode: '75008',
      propertyType: 'apartment',
      claimsCount5Years: 0
    };
    session.activeQuote = {
      quoteId: 'dummy-quote',
      sessionId: session.sessionId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      ruleVersion: 'v1',
      quoteHash: 'a'.repeat(64),
      input: session.partialInput as any,
      eligibility: {} as any,
      pricing: {} as any,
      mandatoryDisclosure: 'disc',
      isBinding: false,
      status: 'active'
    };

    // User updates claimsCount5Years from 0 to 2
    FunnelStateMachine.updateInput(session, { claimsCount5Years: 2 });

    expect(session.correctionCount).toBe(1);
    expect(session.activeQuote).toBeUndefined();
    expect(session.historicalQuotes.length).toBe(1);
    expect(session.step).toBe('COLLECTING_PROPERTY');
  });
});
