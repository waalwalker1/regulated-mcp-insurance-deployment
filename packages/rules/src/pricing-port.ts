import type { QuoteInput, PricingBreakdown, EligibilityResult } from '@northstar/domain';
import { calculatePricing } from './pricing.js';
import { evaluateEligibility } from './eligibility.js';
import { getRuleSet } from './registry.js';
import { defaultRulePolicyProvider, type RulePolicyProvider } from './rule-policy.js';

export interface PricingPort {
  calculate(input: QuoteInput, ruleVersion?: string): Promise<PricingBreakdown>;
  evaluate(input: QuoteInput, ruleVersion?: string): Promise<EligibilityResult>;
}

/**
 * In-process pure deterministic adapter (zero external dependencies)
 */
export class LocalDeterministicPricingAdapter implements PricingPort {
  constructor(private readonly rulePolicy: RulePolicyProvider = defaultRulePolicyProvider) {}

  async calculate(input: QuoteInput, ruleVersion?: string): Promise<PricingBreakdown> {
    const version = ruleVersion ?? this.rulePolicy.getActiveRuleVersion({ country: input.country });
    const ruleSet = getRuleSet(version);
    return calculatePricing(input, ruleSet);
  }

  async evaluate(input: QuoteInput, ruleVersion?: string): Promise<EligibilityResult> {
    const version = ruleVersion ?? this.rulePolicy.getActiveRuleVersion({ country: input.country });
    const ruleSet = getRuleSet(version);
    return evaluateEligibility(input, ruleSet);
  }
}

/**
 * HTTP REST Pricing Service adapter for microservice topology
 */
export class HttpPricingServiceAdapter implements PricingPort {
  constructor(
    private readonly baseUrl: string = process.env.PRICING_SERVICE_URL ?? 'http://127.0.0.1:3001',
    private readonly timeoutMs: number = 3000
  ) {}

  async calculate(input: QuoteInput, ruleVersion?: string): Promise<PricingBreakdown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/quote/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, ruleVersion }),
        signal: controller.signal
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Pricing service error (${res.status}): ${errorText}`);
      }
      const data = await res.json() as { pricing: PricingBreakdown };
      return data.pricing;
    } finally {
      clearTimeout(timer);
    }
  }

  async evaluate(input: QuoteInput, ruleVersion?: string): Promise<EligibilityResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/quote/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, ruleVersion }),
        signal: controller.signal
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Pricing service evaluation error (${res.status}): ${errorText}`);
      }
      const data = await res.json() as { eligibility: EligibilityResult };
      return data.eligibility;
    } finally {
      clearTimeout(timer);
    }
  }
}
