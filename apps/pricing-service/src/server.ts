import Fastify, { type FastifyInstance } from 'fastify';
import { QuoteInputSchema, ConsentDeclarationSchema } from '@northstar/domain';
import {
  evaluateEligibility,
  calculatePricing,
  computeCanonicalQuoteFingerprint,
  getRuleSet,
  defaultRulePolicyProvider
} from '@northstar/rules';
import { randomUUID } from 'node:crypto';

export interface MetricsState {
  totalEvaluations: number;
  totalCalculations: number;
  totalRejections: number;
  startTime: number;
}

export function buildPricingServer(): { app: FastifyInstance; metrics: MetricsState } {
  const app = Fastify({
    logger: false
  });

  const metrics: MetricsState = {
    totalEvaluations: 0,
    totalCalculations: 0,
    totalRejections: 0,
    startTime: Date.now()
  };

  // Health and Readiness
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async () => {
    return {
      ready: true,
      uptimeSeconds: Math.floor((Date.now() - metrics.startTime) / 1000),
      activeRuleVersion: defaultRulePolicyProvider.getActiveRuleVersion()
    };
  });

  app.get('/metrics', async () => {
    return {
      totalEvaluations: metrics.totalEvaluations,
      totalCalculations: metrics.totalCalculations,
      totalRejections: metrics.totalRejections,
      uptimeSeconds: Math.floor((Date.now() - metrics.startTime) / 1000)
    };
  });

  // Evaluate Eligibility (Server-Owned Rule Version)
  app.post('/api/v1/quote/evaluate', async (request, reply) => {
    metrics.totalEvaluations++;
    const parseResult = QuoteInputSchema.safeParse(request.body);

    if (!parseResult.success) {
      metrics.totalRejections++;
      return reply.status(400).send({
        error: 'INVALID_INPUT',
        details: parseResult.error.flatten()
      });
    }

    const ruleVersion = defaultRulePolicyProvider.getActiveRuleVersion({ country: parseResult.data.country });
    const ruleSet = getRuleSet(ruleVersion);
    const eligibility = evaluateEligibility(parseResult.data, ruleSet);

    return reply.status(200).send(eligibility);
  });

  // Calculate Deterministic Quote (Consent Required)
  app.post('/api/v1/quote/calculate', async (request, reply) => {
    metrics.totalCalculations++;
    const body = request.body as {
      sessionId?: string;
      input: unknown;
      consent?: unknown;
    };

    const inputParse = QuoteInputSchema.safeParse(body?.input);
    if (!inputParse.success) {
      metrics.totalRejections++;
      return reply.status(400).send({
        error: 'INVALID_INPUT',
        details: inputParse.error.flatten()
      });
    }

    const consentParse = ConsentDeclarationSchema.safeParse(body?.consent);
    if (!consentParse.success) {
      metrics.totalRejections++;
      return reply.status(403).send({
        error: 'CONSENT_REQUIRED',
        message: 'Explicit data processing consent must be confirmed before quote generation.',
        details: consentParse.error.flatten()
      });
    }

    const ruleVersion = defaultRulePolicyProvider.getActiveRuleVersion({ country: inputParse.data.country });
    const ruleSet = getRuleSet(ruleVersion);
    const eligibility = evaluateEligibility(inputParse.data, ruleSet);

    if (!eligibility.isEligible) {
      metrics.totalRejections++;
      return reply.status(422).send({
        error: 'INELIGIBLE_RISK',
        eligibility
      });
    }

    const pricing = calculatePricing(inputParse.data, ruleSet);
    const quoteHash = computeCanonicalQuoteFingerprint({
      ruleVersion: ruleSet.version,
      input: inputParse.data,
      pricing,
      eligibility
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const quote = {
      quoteId: randomUUID(),
      sessionId: body.sessionId || randomUUID(),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ruleVersion: ruleSet.version,
      quoteHash,
      input: inputParse.data,
      eligibility,
      pricing,
      mandatoryDisclosure: ruleSet.mandatoryDisclosure,
      isBinding: false,
      status: 'active'
    };

    return reply.status(200).send(quote);
  });

  return { app, metrics };
}
