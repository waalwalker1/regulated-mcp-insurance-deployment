import type {
  QuoteInput,
  PartialQuoteInput,
  EligibilityResult,
  PricingBreakdown,
  IndicativeQuote,
  ConsentDeclaration
} from './schemas.js';

export type FunnelStep =
  | 'INIT'
  | 'COLLECTING_PROPERTY'
  | 'COLLECTING_RISK'
  | 'EVALUATING_ELIGIBILITY'
  | 'COLLECTING_COVERAGE'
  | 'AWAITING_CONFIRMATION'
  | 'AWAITING_CONSENT'
  | 'READY_TO_QUOTE'
  | 'QUOTED'
  | 'REFERRED'
  | 'COMPLETED';

export interface FunnelSession {
  sessionId: string;
  correlationId: string;
  step: FunnelStep;
  partialInput: PartialQuoteInput;
  validatedInput?: QuoteInput;
  eligibilityResult?: EligibilityResult;
  activeQuote?: IndicativeQuote;
  historicalQuotes: IndicativeQuote[];
  consentDeclaration?: ConsentDeclaration;
  parametersConfirmedAt?: string;
  consentGrantedAt?: string;
  lastIdempotencyKey?: string;
  lastQuoteFingerprint?: string;
  correctionCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export type AuditEventType =
  | 'session.started'
  | 'field.received'
  | 'eligibility.evaluated'
  | 'parameters.confirmed'
  | 'consent.granted'
  | 'quote.calculated'
  | 'quote.adjusted'
  | 'quote.presented'
  | 'field.corrected'
  | 'request.replayed'
  | 'session.completed'
  | 'session.anonymized'
  | 'security.tampering_blocked'
  | 'system.error';

export type AuditActor = 'user' | 'assistant' | 'server' | 'admin-demo';

export interface AuditEvent {
  eventId: string;
  sessionId: string;
  correlationId: string;
  timestamp: string;
  eventType: AuditEventType;
  actor: AuditActor;
  ruleVersion?: string;
  metadata?: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
}

export interface AuditVerificationResult {
  isValid: boolean;
  eventCount: number;
  genesisHash: string;
  latestHash?: string;
  brokenIndex?: number;
  reason?: string;
}
