import type {
  QuoteInput,
  PricingBreakdown,
  EligibilityResult,
} from "@northstar/domain";
import { calculatePricing } from "./pricing.js";
import { evaluateEligibility } from "./eligibility.js";
import { getRuleSet } from "./registry.js";
import {
  defaultRulePolicyProvider,
  type RulePolicyProvider,
} from "./rule-policy.js";

export interface PricingPort {
  evaluate(input: QuoteInput): Promise<EligibilityResult>;
  calculate(input: QuoteInput): Promise<PricingBreakdown>;
}

/**
 * In-process pure deterministic adapter (zero external dependencies)
 */
export class LocalDeterministicPricingAdapter implements PricingPort {
  constructor(
    private readonly rulePolicy: RulePolicyProvider = defaultRulePolicyProvider,
  ) {}

  async evaluate(input: QuoteInput): Promise<EligibilityResult> {
    const version = this.rulePolicy.getActiveRuleVersion({
      country: input.country,
    });
    const ruleSet = getRuleSet(version);
    return evaluateEligibility(input, ruleSet);
  }

  async calculate(input: QuoteInput): Promise<PricingBreakdown> {
    const version = this.rulePolicy.getActiveRuleVersion({
      country: input.country,
    });
    const ruleSet = getRuleSet(version);
    return calculatePricing(input, ruleSet);
  }
}

/**
 * HTTP REST Pricing Service adapter for microservice topology
 */
export class HttpPricingServiceAdapter implements PricingPort {
  constructor(
    private readonly baseUrl: string = process.env.PRICING_SERVICE_URL ??
      "http://127.0.0.1:3001",
    private readonly timeoutMs: number = 3000,
  ) {}

  async evaluate(
    input: QuoteInput,
    correlationId?: string,
  ): Promise<EligibilityResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (correlationId) headers["x-correlation-id"] = correlationId;

      const res = await fetch(
        `${this.baseUrl}/internal/v1/eligibility/evaluate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ input }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Pricing microservice evaluation error (${res.status}): ${errorText}`,
        );
      }

      const data = (await res.json()) as { eligibility: EligibilityResult };
      return data.eligibility;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(
          `Pricing microservice evaluate request timed out after ${this.timeoutMs}ms`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async calculate(
    input: QuoteInput,
    correlationId?: string,
  ): Promise<PricingBreakdown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (correlationId) headers["x-correlation-id"] = correlationId;

      const res = await fetch(`${this.baseUrl}/internal/v1/pricing/calculate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Pricing microservice calculate error (${res.status}): ${errorText}`,
        );
      }

      const data = (await res.json()) as {
        pricing: PricingBreakdown;
        ruleVersion?: string;
      };
      return data.pricing;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(
          `Pricing microservice calculate request timed out after ${this.timeoutMs}ms`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createPricingAdapter(
  mode: string = process.env.PRICING_MODE || "local",
  baseUrl?: string,
): PricingPort {
  if (mode === "http") {
    return new HttpPricingServiceAdapter(baseUrl);
  }
  return new LocalDeterministicPricingAdapter();
}
