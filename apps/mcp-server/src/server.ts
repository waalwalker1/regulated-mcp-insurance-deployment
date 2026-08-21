import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import Fastify from 'fastify';
import { FunnelEngine } from './funnel-engine.js';
import { buildWaniwaniInsuranceFlow } from './waniwani-flow.js';
import {
  SupportedCountrySchema,
  PropertyTypeSchema,
  OccupancyTypeSchema,
  ConstructionYearBandSchema,
  FloorAreaBandSchema,
  CoverageTierSchema,
  DeductibleOptionSchema,
  CorrectionInputSchema
} from '@northstar/domain';

export function createNorthstarMcpServer(engine: FunnelEngine = new FunnelEngine()) {
  const waniwaniFlow = buildWaniwaniInsuranceFlow();

  const server = new Server(
    {
      name: 'northstar-insurance-mcp',
      version: '0.2.0'
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
        // Primary Waniwani Compiled Flow Tool
        {
          name: waniwaniFlow.name,
          description: waniwaniFlow.config.description,
          inputSchema: {
            type: 'object',
            properties: {
              country: { type: 'string', enum: ['FR', 'ES', 'PT', 'DE', 'IT'], description: 'European country code' },
              postcode: { type: 'string', description: 'Postal code' },
              propertyType: { type: 'string', enum: ['apartment', 'detached_house', 'semi_detached', 'terraced_house', 'villa'] },
              occupancyType: { type: 'string', enum: ['owner_occupied', 'tenant', 'landlord'] },
              constructionYearBand: { type: 'string', enum: ['pre_1970', '1970_1999', '2000_2015', 'post_2015'] },
              floorAreaBand: { type: 'string', enum: ['under_50_sqm', '50_100_sqm', '101_150_sqm', '151_250_sqm', 'over_250_sqm'] },
              claimsCount5Years: { type: 'integer', minimum: 0, maximum: 10 },
              isPrimaryResidence: { type: 'boolean' },
              coverageTier: { type: 'string', enum: ['essential', 'comfort', 'premium'] },
              deductible: { type: 'integer', enum: [150, 300, 500, 1000] },
              parametersConfirmed: { type: 'boolean' },
              hasConsented: { type: 'boolean' },
              contactEmail: { type: 'string' }
            }
          }
        },
        // Modular Operational & Admin Tools
        {
          name: 'start_quote_session',
          description: '[Operational Tool] Initialize a new Northstar Home Insurance quote funnel session.',
          inputSchema: {
            type: 'object',
            properties: {
              correlationId: { type: 'string', description: 'Optional correlation ID' }
            }
          }
        },
        {
          name: 'submit_property_basics',
          description: '[Operational Tool] Submit basic property location and structural category.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              country: { type: 'string', enum: ['FR', 'ES', 'PT', 'DE', 'IT'] },
              postcode: { type: 'string' },
              propertyType: { type: 'string', enum: ['apartment', 'detached_house', 'semi_detached', 'terraced_house', 'villa'] },
              occupancyType: { type: 'string', enum: ['owner_occupied', 'tenant', 'landlord'] }
            },
            required: ['sessionId', 'country', 'postcode', 'propertyType', 'occupancyType']
          }
        },
        {
          name: 'submit_risk_factors',
          description: '[Operational Tool] Submit structural age, area, and claims loss history.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              constructionYearBand: { type: 'string', enum: ['pre_1970', '1970_1999', '2000_2015', 'post_2015'] },
              floorAreaBand: { type: 'string', enum: ['under_50_sqm', '50_100_sqm', '101_150_sqm', '151_250_sqm', 'over_250_sqm'] },
              isPrimaryResidence: { type: 'boolean' },
              claimsCount5Years: { type: 'integer', minimum: 0, maximum: 10 }
            },
            required: ['sessionId', 'constructionYearBand', 'floorAreaBand', 'isPrimaryResidence', 'claimsCount5Years']
          }
        },
        {
          name: 'evaluate_eligibility',
          description: '[Operational Tool] Trigger server-side deterministic eligibility evaluation.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'select_coverage',
          description: '[Operational Tool] Select desired coverage tier and deductible.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              coverageTier: { type: 'string', enum: ['essential', 'comfort', 'premium'] },
              deductible: { type: 'integer', enum: [150, 300, 500, 1000] },
              contactEmail: { type: 'string' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'confirm_quote_parameters',
          description: '[Operational Tool] Confirm entered quote parameters before consent.',
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
          description: '[Operational Tool] Submit explicit mandatory data processing consent.',
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
          description: '[Operational Tool] Calculate official deterministic quote (Consent required, server-owned rule version).',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              idempotencyKey: { type: 'string' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'adjust_quote',
          description: '[Operational Tool] Adjust coverage tier or deductible on active quote.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              coverageTier: { type: 'string', enum: ['essential', 'comfort', 'premium'] },
              deductible: { type: 'integer', enum: [150, 300, 500, 1000] },
              idempotencyKey: { type: 'string' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'correct_field',
          description: '[Operational Tool] Strictly correct declared parameters and recalculate state.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              country: { type: 'string', enum: ['FR', 'ES', 'PT', 'DE', 'IT'] },
              postcode: { type: 'string' },
              propertyType: { type: 'string', enum: ['apartment', 'detached_house', 'semi_detached', 'terraced_house', 'villa'] },
              occupancyType: { type: 'string', enum: ['owner_occupied', 'tenant', 'landlord'] },
              constructionYearBand: { type: 'string', enum: ['pre_1970', '1970_1999', '2000_2015', 'post_2015'] },
              floorAreaBand: { type: 'string', enum: ['under_50_sqm', '50_100_sqm', '101_150_sqm', '151_250_sqm', 'over_250_sqm'] },
              claimsCount5Years: { type: 'integer' }
            },
            required: ['sessionId']
          }
        },
        {
          name: 'get_quote_status',
          description: '[Operational Tool] Retrieve current session status and active quote.',
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
          description: '[Operational Tool] Export verifiable audit trail with SHA-256 chain verification.',
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

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === waniwaniFlow.name) {
        return await waniwaniFlow.handler(args as Record<string, unknown>, extra);
      }

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
          const session = await engine.evaluateEligibility((args as any).sessionId);
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
          const quote = await engine.calculateQuote((args as any).sessionId, {
            idempotencyKey: (args as any)?.idempotencyKey
          });
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
            deductible: (args as any)?.deductible ? DeductibleOptionSchema.parse((args as any).deductible) : undefined,
            idempotencyKey: (args as any)?.idempotencyKey
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
          const validatedDelta = CorrectionInputSchema.parse(delta);
          const session = await engine.correctField((args as any).sessionId, validatedDelta);
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

/**
 * Start HTTP MCP Server if MCP_TRANSPORT=http
 */
export async function startHttpMcpServer(port: number = Number(process.env.MCP_PORT ?? 3000)) {
  const app = Fastify({ logger: false });
  const engine = new FunnelEngine();
  const server = createNorthstarMcpServer(engine);

  app.get('/health', async () => ({ status: 'healthy', transport: 'http', uptime: process.uptime() }));
  app.get('/ready', async () => ({ status: 'ready', server: 'northstar-insurance-mcp', version: '0.2.0' }));

  app.post('/mcp', async (req, reply) => {
    const body = req.body as any;
    if (body?.method === 'tools/list') {
      const listHandler = (server as any)._requestHandlers?.get('tools/list');
      const res = await listHandler(body, {});
      return reply.send(res);
    }
    if (body?.method === 'tools/call') {
      const callHandler = (server as any)._requestHandlers?.get('tools/call');
      const res = await callHandler(body, {});
      return reply.send(res);
    }
    return reply.status(400).send({ error: 'Unsupported MCP method over HTTP bridge' });
  });

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`[Northstar MCP Server] Listening over HTTP on port ${port}`);
  return app;
}
