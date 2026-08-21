import { z } from 'zod';
import { createFlow, START, END, MemoryKvStore } from '@waniwani/sdk/mcp';
import {
  evaluateEligibility,
  calculatePricing,
  computeCanonicalQuoteFingerprint,
  getRuleSet,
  defaultRulePolicyProvider
} from '@northstar/rules';
import { sanitizeTextInput } from '@northstar/security';
import { globalAuditStore } from '@northstar/audit';
import { randomUUID } from 'node:crypto';

export const InsuranceFlowStateSchema = {
  country: z.enum(['FR', 'ES', 'PT', 'DE', 'IT']).describe('European country code (FR, ES, PT, DE, IT)'),
  postcode: z.string().describe('Postal code (e.g. 75008 for FR, 28001 for ES)'),
  propertyType: z.enum(['apartment', 'detached_house', 'semi_detached', 'terraced_house', 'villa']).describe('Property category'),
  occupancyType: z.enum(['owner_occupied', 'tenant', 'landlord']).describe('Occupancy nature'),
  constructionYearBand: z.enum(['pre_1970', '1970_1999', '2000_2015', 'post_2015']).describe('Era of construction'),
  floorAreaBand: z.enum(['under_50_sqm', '50_100_sqm', '101_150_sqm', '151_250_sqm', 'over_250_sqm']).describe('Living floor area band'),
  claimsCount5Years: z.number().int().min(0).max(10).describe('Past 5-year claims count'),
  isPrimaryResidence: z.boolean().describe('Whether this property is the primary residence'),
  coverageTier: z.enum(['essential', 'comfort', 'premium']).describe('Chosen coverage tier'),
  deductible: z.union([z.literal(150), z.literal(300), z.literal(500), z.literal(1000)]).describe('Deductible in EUR'),
  contactEmail: z.string().optional().describe('Optional contact email'),
  parametersConfirmed: z.boolean().describe('Explicit customer confirmation of declared details'),
  hasConsented: z.boolean().describe('Explicit GDPR data processing consent'),
  quoteId: z.string().optional().describe('Issued quote UUID'),
  totalAnnualPremium: z.number().optional().describe('Calculated total annual premium in EUR'),
  totalMonthlyPremium: z.number().optional().describe('Calculated monthly installment in EUR'),
  quoteFingerprint: z.string().optional().describe('SHA-256 fingerprint of the quote'),
  eligibilityStatus: z.string().optional().describe('Underwriting eligibility outcome'),
  referralReason: z.string().optional().describe('Explanation if referred to underwriting')
};

export function buildWaniwaniInsuranceFlow(store: any = new MemoryKvStore() as any) {
  const flow = createFlow({
    id: 'get_home_insurance_quote',
    title: 'European Home Insurance Quotation Funnel',
    description: 'Conversational quote funnel for European residential property insurance. Server deterministically validates addressing, evaluates underwriting eligibility, enforces GDPR consent gating, calculates actuarial premiums, and logs immutable audit trails.',
    state: InsuranceFlowStateSchema
  })
    // 1. Collect Property Location & Type
    .addNode({
      id: 'collect_property',
      label: 'Collect Property Details',
      run: (ctx) => {
        const missing: Record<string, { question: string; suggestions?: string[] }> = {};
        if (!ctx.state.country) missing.country = { question: 'Which European country is the property located in?', suggestions: ['FR', 'ES', 'PT', 'DE', 'IT'] };
        if (!ctx.state.postcode) missing.postcode = { question: 'What is the postal code of the property?' };
        if (!ctx.state.propertyType) missing.propertyType = { question: 'What type of property is this?', suggestions: ['apartment', 'detached_house', 'semi_detached', 'terraced_house', 'villa'] };
        if (!ctx.state.occupancyType) missing.occupancyType = { question: 'What is the occupancy status?', suggestions: ['owner_occupied', 'tenant', 'landlord'] };

        if (Object.keys(missing).length > 0) {
          return ctx.interrupt(missing as any, { context: 'Ask the user for the missing property location and structural category.' });
        }

        // Sanitize postcode input
        if (ctx.state.postcode) {
          const sanitization = sanitizeTextInput(ctx.state.postcode);
          if (!sanitization.isSafe) {
            return ctx.interrupt({
              postcode: { question: 'The postal code entered contained invalid characters. Please provide a valid postal code:' }
            });
          }
        }

        return {};
      }
    })

    // 2. Collect Risk Factors
    .addNode({
      id: 'collect_risk',
      label: 'Collect Risk Factors',
      run: (ctx) => {
        const missing: Record<string, { question: string; suggestions?: string[] }> = {};
        if (!ctx.state.constructionYearBand) missing.constructionYearBand = { question: 'When was the property constructed?', suggestions: ['pre_1970', '1970_1999', '2000_2015', 'post_2015'] };
        if (!ctx.state.floorAreaBand) missing.floorAreaBand = { question: 'What is the approximate living floor area?', suggestions: ['under_50_sqm', '50_100_sqm', '101_150_sqm', '151_250_sqm', 'over_250_sqm'] };
        if (ctx.state.isPrimaryResidence === undefined) missing.isPrimaryResidence = { question: 'Is this property your primary residence?', suggestions: ['true', 'false'] };
        if (ctx.state.claimsCount5Years === undefined) missing.claimsCount5Years = { question: 'How many property insurance claims have occurred in the past 5 years?', suggestions: ['0', '1', '2', '3+'] };

        if (Object.keys(missing).length > 0) {
          return ctx.interrupt(missing as any, { context: 'Collect structural age, area, and claims loss history.' });
        }
        return {};
      }
    })

    // 3. Evaluate Underwriting Eligibility (Branching node)
    .addNode({
      id: 'evaluate_eligibility',
      label: 'Evaluate Underwriting Eligibility',
      run: (ctx) => {
        const activeRuleVersion = defaultRulePolicyProvider.getActiveRuleVersion({ country: ctx.state.country });
        const ruleSet = getRuleSet(activeRuleVersion);

        const input = {
          country: ctx.state.country!,
          postcode: ctx.state.postcode!,
          propertyType: ctx.state.propertyType!,
          occupancyType: ctx.state.occupancyType!,
          constructionYearBand: ctx.state.constructionYearBand!,
          floorAreaBand: ctx.state.floorAreaBand!,
          isPrimaryResidence: Boolean(ctx.state.isPrimaryResidence),
          claimsCount5Years: Number(ctx.state.claimsCount5Years ?? 0),
          coverageTier: (ctx.state.coverageTier ?? 'comfort') as any,
          deductible: (ctx.state.deductible ?? 300) as any
        };

        const result = evaluateEligibility(input, ruleSet);
        if (!result.isEligible) {
          return {
            eligibilityStatus: result.status,
            referralReason: result.explanation
          };
        }
        return {
          eligibilityStatus: 'eligible'
        };
      }
    })

    // 4. Select Coverage & Deductible
    .addNode({
      id: 'select_coverage',
      label: 'Select Coverage Package',
      run: (ctx) => {
        const missing: Record<string, { question: string; suggestions?: string[] }> = {};
        if (!ctx.state.coverageTier) missing.coverageTier = { question: 'Select your preferred coverage tier:', suggestions: ['essential', 'comfort', 'premium'] };
        if (!ctx.state.deductible) missing.deductible = { question: 'Choose your desired out-of-pocket deductible in EUR:', suggestions: ['150', '300', '500', '1000'] };

        if (Object.keys(missing).length > 0) {
          return ctx.interrupt(missing as any, { context: 'Select coverage tier and deductible.' });
        }
        return {};
      }
    })

    // 5. Customer Confirmation Step
    .addNode({
      id: 'confirm_parameters',
      label: 'Confirm Declared Parameters',
      run: (ctx) => {
        if (!ctx.state.parametersConfirmed) {
          return ctx.interrupt({
            parametersConfirmed: {
              question: `Please confirm your quote summary:\n- Country: ${ctx.state.country} (${ctx.state.postcode})\n- Type: ${ctx.state.propertyType} (${ctx.state.occupancyType})\n- Built: ${ctx.state.constructionYearBand}, Size: ${ctx.state.floorAreaBand}\n- Claims: ${ctx.state.claimsCount5Years}\n- Tier: ${ctx.state.coverageTier} with €${ctx.state.deductible} deductible.\n\nDo you confirm these details are accurate?`,
              suggestions: ['true']
            }
          }, { context: 'Customer must confirm summary details before consent request.' });
        }
        return {};
      }
    })

    // 6. Mandatory Consent Gate
    .addNode({
      id: 'request_consent',
      label: 'Request GDPR Processing Consent',
      run: (ctx) => {
        if (!ctx.state.hasConsented) {
          return ctx.interrupt({
            hasConsented: {
              question: 'To generate your personalized indicative quote, we require your consent to process declared property details in accordance with our Privacy Policy (consent_v1_2026). Do you consent?',
              suggestions: ['true']
            }
          }, { context: 'Explicit consent is mandatory before calculating the quote.' });
        }
        return {};
      }
    })

    // 7. Calculate Deterministic Quote (Server-Owned Pricing)
    .addNode({
      id: 'calculate_quote',
      label: 'Calculate Deterministic Quote',
      run: async (ctx) => {
        const activeRuleVersion = defaultRulePolicyProvider.getActiveRuleVersion({ country: ctx.state.country });
        const ruleSet = getRuleSet(activeRuleVersion);

        const input = {
          country: ctx.state.country!,
          postcode: ctx.state.postcode!,
          propertyType: ctx.state.propertyType!,
          occupancyType: ctx.state.occupancyType!,
          constructionYearBand: ctx.state.constructionYearBand!,
          floorAreaBand: ctx.state.floorAreaBand!,
          isPrimaryResidence: Boolean(ctx.state.isPrimaryResidence),
          claimsCount5Years: Number(ctx.state.claimsCount5Years ?? 0),
          coverageTier: ctx.state.coverageTier!,
          deductible: ctx.state.deductible!
        };

        const eligibility = evaluateEligibility(input, ruleSet);
        const pricing = calculatePricing(input, ruleSet);
        const quoteHash = computeCanonicalQuoteFingerprint({
          ruleVersion: ruleSet.version,
          input,
          pricing,
          eligibility
        });

        const quoteId = randomUUID();
        const sessionId = (ctx.meta?.sessionId as string) || randomUUID();

        await globalAuditStore.recordEvent({
          sessionId,
          correlationId: (ctx.meta?.correlationId as string) || randomUUID(),
          eventType: 'quote.calculated',
          actor: 'server',
          ruleVersion: ruleSet.version,
          metadata: {
            quoteId,
            quoteHash,
            totalAnnualPremium: pricing.totalAnnualPremium
          }
        });

        return {
          quoteId,
          totalAnnualPremium: pricing.totalAnnualPremium,
          totalMonthlyPremium: pricing.totalMonthlyPremium,
          quoteFingerprint: quoteHash
        };
      }
    })

    // 8. Terminal Referral Node
    .addNode({
      id: 'referral_end',
      label: 'Underwriting Referral Notice',
      run: (ctx) => {
        return {
          referralReason: ctx.state.referralReason || 'Risk parameters exceed automated quoting limits and require manual underwriting review.'
        };
      }
    })

    // Edges & Flow Graph Topology
    .addEdge(START, 'collect_property')
    .addEdge('collect_property', 'collect_risk')
    .addEdge('collect_risk', 'evaluate_eligibility')
    .addConditionalEdge(
      'evaluate_eligibility',
      ['referral_end', 'select_coverage'],
      (state) => (state.eligibilityStatus === 'referral_required' || state.eligibilityStatus === 'declined' ? 'referral_end' : 'select_coverage')
    )
    .addEdge('select_coverage', 'confirm_parameters')
    .addEdge('confirm_parameters', 'request_consent')
    .addEdge('request_consent', 'calculate_quote')
    .addEdge('calculate_quote', END)
    .addEdge('referral_end', END);

  return flow.compile({ store: store || (new MemoryKvStore() as any) });
}
