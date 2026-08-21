import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { FunnelEngine } from './funnel-engine.js';
import {
  SupportedCountrySchema,
  PropertyTypeSchema,
  OccupancyTypeSchema,
  ConstructionYearBandSchema,
  FloorAreaBandSchema,
  CoverageTierSchema,
  DeductibleOptionSchema
} from '@northstar/domain';

export function createNorthstarMcpServer(engine: FunnelEngine = new FunnelEngine()) {
  const server = new Server(
    {
      name: 'northstar-insurance-mcp',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'start_quote_session',
          description: 'Initialize a new Northstar Home Insurance quote funnel session.',
          inputSchema: {
            type: 'object',
            properties: {
              correlationId: {
                type: 'string',
                description: 'Optional external correlation ID for enterprise tracing'
              }
            }
          }
        },
        {
          name: 'submit_property_basics',
          description: 'Submit basic property location and structural category.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string', description: 'Active session ID' },
              country: {
                type: 'string',
                enum: ['FR', 'ES', 'PT', 'DE', 'IT'],
                description: 'Country code'
              },
              postcode: { type: 'string', description: 'Postal code' },
              propertyType: {
                type: 'string',
                enum: ['apartment', 'detached_house', 'semi_detached', 'terraced_house', 'villa'],
                description: 'Property type'
              },
              occupancyType: {
                type: 'string',
                enum: ['owner_occupied', 'tenant', 'landlord'],
                description: 'Occupancy type'
              }
            },
            required: ['sessionId', 'country', 'postcode', 'propertyType', 'occupancyType']
          }
        },
        {
          name: 'submit_risk_factors',
          description: 'Submit structural age, area, and claims loss history.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              constructionYearBand: {
                type: 'string',
                enum: ['pre_1970', '1970_1999', '2000_2015', 'post_2015']
              },
              floorAreaBand: {
                type: 'string',
                enum: ['under_50_sqm', '50_100_sqm', '101_150_sqm', '151_250_sqm', 'over_250_sqm']
              },
              isPrimaryResidence: { type: 'boolean' },
              claimsCount5Years: { type: 'integer', minimum: 0, maximum: 10 }
            },
            required: ['sessionId', 'constructionYearBand', 'floorAreaBand', 'isPrimaryResidence', 'claimsCount5Years']
          }
        },
        {
          name: 'evaluate_eligibility',
          description: 'Trigger server-side deterministic eligibility evaluation.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              ruleVersion: { type: 'string', description: 'Optional rule version' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'select_coverage',
          description: 'Select desired coverage tier, deductible, and optional contact email.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              coverageTier: { type: 'string', enum: ['essential', 'comfort', 'premium'] },
              deductible: { type: 'integer', enum: [150, 300, 500, 1000] },
              contactEmail: { type: 'string', description: 'Optional email for quote delivery' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'confirm_quote_parameters',
          description: 'Confirm that all entered quote details are accurate before consent.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              confirmed: { type: 'boolean' }
            },
            required: ['sessionId', 'confirmed']
          }
        },
        {
          name: 'submit_consent',
          description: 'Submit explicit mandatory data processing consent for quote calculation.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              consentVersion: { type: 'string', default: 'consent_v1_2026' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'calculate_quote',
          description: 'Calculate official deterministic indicative quote (Consent required).',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              ruleVersion: { type: 'string' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'adjust_quote',
          description: 'Adjust coverage tier or deductible on an already active quote.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              coverageTier: { type: 'string', enum: ['essential', 'comfort', 'premium'] },
              deductible: { type: 'integer', enum: [150, 300, 500, 1000] }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'correct_field',
          description: 'Correct an previously declared parameter and recalculate funnel state.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              country: { type: 'string', enum: ['FR', 'ES', 'PT', 'DE', 'IT'] },
              postcode: { type: 'string' },
              propertyType: { type: 'string' },
              claimsCount5Years: { type: 'integer' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'get_quote_status',
          description: 'Retrieve current session status and active quote details.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'export_audit_trail',
          description: 'Export verifiable audit trail with cryptographic hash verification.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' }
            },
            required: ['sessionId']
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'start_quote_session': {
          const session = await engine.startSession((args as any)?.correlationId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'SESSION_STARTED',
                  sessionId: session.sessionId,
                  currentStep: session.step,
                  message: 'Please provide property location (country, postcode) and occupancy details.'
                }, null, 2)
              }
            ]
          };
        }

        case 'submit_property_basics': {
          const parsed = {
            country: SupportedCountrySchema.parse((args as any)?.country),
            postcode: String((args as any)?.postcode),
            propertyType: PropertyTypeSchema.parse((args as any)?.propertyType),
            occupancyType: OccupancyTypeSchema.parse((args as any)?.occupancyType)
          };
          const session = await engine.submitPropertyBasics((args as any).sessionId, parsed);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'PROPERTY_RECORDED',
                  currentStep: session.step,
                  partialInput: session.partialInput,
                  message: 'Please provide structural risk details (construction period, floor area, claims history).'
                }, null, 2)
              }
            ]
          };
        }

        case 'submit_risk_factors': {
          const parsed = {
            constructionYearBand: ConstructionYearBandSchema.parse((args as any)?.constructionYearBand),
            floorAreaBand: FloorAreaBandSchema.parse((args as any)?.floorAreaBand),
            isPrimaryResidence: Boolean((args as any)?.isPrimaryResidence),
            claimsCount5Years: Number((args as any)?.claimsCount5Years)
          };
          const session = await engine.submitRiskFactors((args as any).sessionId, parsed);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'RISK_FACTORS_RECORDED',
                  currentStep: session.step,
                  partialInput: session.partialInput,
                  message: 'Risk factors recorded. Ready for eligibility evaluation.'
                }, null, 2)
              }
            ]
          };
        }

        case 'evaluate_eligibility': {
          const session = await engine.evaluateEligibility((args as any).sessionId, (args as any)?.ruleVersion);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'ELIGIBILITY_EVALUATED',
                  currentStep: session.step,
                  eligibility: session.eligibilityResult
                }, null, 2)
              }
            ]
          };
        }

        case 'select_coverage': {
          const session = await engine.selectCoverage((args as any).sessionId, {
            coverageTier: (args as any)?.coverageTier ? CoverageTierSchema.parse((args as any).coverageTier) : undefined,
            deductible: (args as any)?.deductible ? DeductibleOptionSchema.parse((args as any).deductible) : undefined,
            contactEmail: (args as any)?.contactEmail
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'COVERAGE_SELECTED',
                  currentStep: session.step,
                  partialInput: session.partialInput,
                  message: 'Please confirm that all summary parameters are correct.'
                }, null, 2)
              }
            ]
          };
        }

        case 'confirm_quote_parameters': {
          const session = await engine.confirmParameters((args as any).sessionId, Boolean((args as any).confirmed));
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: session.step === 'AWAITING_CONSENT' ? 'PARAMETERS_CONFIRMED' : 'REVISION_REQUESTED',
                  currentStep: session.step,
                  message: session.step === 'AWAITING_CONSENT'
                    ? 'Parameters confirmed. User consent is required before quote calculation.'
                    : 'Please correct any invalid fields.'
                }, null, 2)
              }
            ]
          };
        }

        case 'submit_consent': {
          const session = await engine.submitConsent((args as any).sessionId, (args as any)?.consentVersion);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'CONSENT_GRANTED',
                  consentDeclaration: session.consentDeclaration,
                  message: 'Consent recorded. Ready for quote calculation.'
                }, null, 2)
              }
            ]
          };
        }

        case 'calculate_quote': {
          const quote = await engine.calculateQuote((args as any).sessionId, (args as any)?.ruleVersion);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'QUOTE_ISSUED',
                  quote
                }, null, 2)
              }
            ]
          };
        }

        case 'adjust_quote': {
          const adjusted = await engine.adjustQuote((args as any).sessionId, {
            coverageTier: (args as any)?.coverageTier ? CoverageTierSchema.parse((args as any).coverageTier) : undefined,
            deductible: (args as any)?.deductible ? DeductibleOptionSchema.parse((args as any).deductible) : undefined
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'QUOTE_ADJUSTED',
                  quote: adjusted
                }, null, 2)
              }
            ]
          };
        }

        case 'correct_field': {
          const delta = { ...args };
          delete (delta as any).sessionId;
          const session = await engine.correctField((args as any).sessionId, delta);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'FIELD_CORRECTED',
                  currentStep: session.step,
                  partialInput: session.partialInput,
                  correctionCount: session.correctionCount
                }, null, 2)
              }
            ]
          };
        }

        case 'get_quote_status': {
          const session = await engine.getSession((args as any).sessionId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  session
                }, null, 2)
              }
            ]
          };
        }

        case 'export_audit_trail': {
          const audit = await engine.exportAuditTrail((args as any).sessionId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(audit, null, 2)
              }
            ]
          };
        }

        default:
          throw new Error(`Unknown MCP Tool: '${name}'`);
      }
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error.name || 'Error',
              code: error.code || 'UNKNOWN_ERROR',
              message: error.message,
              details: error.details
            }, null, 2)
          }
        ]
      };
    }
  });

  return server;
}
