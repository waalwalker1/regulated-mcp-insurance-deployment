import type {
  QuoteInput,
  PartialQuoteInput,
  ConsentDeclaration,
  EligibilityResult,
  PricingBreakdown,
  GeneratedQuote
} from './schemas.js';

export type FunnelStep =
  | 'INIT'
  | 'COLLECTING_PROPERTY'
  | 'COLLECTING_RISK'
  | 'EVALUATING_ELIGIBILITY'
  | 'COLLECTING_COVERAGE'
  | 'AWAITING_CONFIRMATION'
  | 'AWAITING_CONSENT'
  | 'QUOTED'
  | 'REFERRED'
  | 'COMPLETED';

export interface FunnelSession {
  sessionId: string;
  step: FunnelStep;
  partialInput: PartialQuoteInput;
  validatedInput?: QuoteInput;
  eligibilityResult?: EligibilityResult;
  consentDeclaration?: ConsentDeclaration;
  activeQuote?: GeneratedQuote;
  historicalQuotes: GeneratedQuote[];
  correctionCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  correlationId: string;
}

export type AuditActor = 'user' | 'assistant' | 'server' | 'system' | 'admin-demo';

export type AuditEventType =
  | 'session.started'
  | 'field.received'
  | 'field.rejected'
  | 'field.corrected'
  | 'eligibility.evaluated'
  | 'confirmation.requested'
  | 'confirmation.granted'
  | 'consent.requested'
  | 'consent.granted'
  | 'quote.calculated'
  | 'quote.presented'
  | 'quote.adjusted'
  | 'quote.referred'
  | 'session.completed'
  | 'session.expired'
  | 'security.tampering_blocked';

export interface AuditEvent {
  eventId: string;
  sessionId: string;
  correlationId: string;
  timestamp: string;
  eventType: AuditEventType;
  actor: AuditActor;
  ruleVersion?: string;
  metadata: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
}
