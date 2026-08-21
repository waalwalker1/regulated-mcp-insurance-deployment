import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Fastify from "fastify";
import { FunnelEngine } from "./funnel-engine.js";
import { buildWaniwaniInsuranceFlow } from "./waniwani-flow.js";
import { createWaniwaniFlowStore } from "@northstar/persistence";
import {
  SupportedCountrySchema,
  PropertyTypeSchema,
  OccupancyTypeSchema,
  ConstructionYearBandSchema,
  FloorAreaBandSchema,
  CoverageTierSchema,
  DeductibleOptionSchema,
  CorrectionInputSchema,
} from "@northstar/domain";

export function createNorthstarMcpServer(
  engine: FunnelEngine = new FunnelEngine(),
  flowStore = createWaniwaniFlowStore(),
) {
  const waniwaniFlow = buildWaniwaniInsuranceFlow(
    flowStore,
    engine.pricingPort,
  );

  const server = new Server(
    {
      name: "northstar-insurance-mcp",
      version: "0.2.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register tools list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // 1. Flagship Compiled Waniwani MCP Tool
        {
          name: waniwaniFlow.name,
          description:
            waniwaniFlow.config.description ||
            "European Home Insurance Quotation Funnel",
          inputSchema: {
            type: "object",
            properties: {
              input: {
                type: "string",
                description: "User utterance or conversational prompt",
              },
              token: {
                type: "string",
                description:
                  "Resumption token for continuing an interrupted funnel flow",
              },
              response: {
                type: "object",
                description: "User answers to interrupted input parameters",
              },
            },
          },
        },
        // 2. Operational Tool: Start Quote Session
        {
          name: "start_quote_session",
          description:
            "Initialize a new stateful home insurance quotation session with unique correlation ID",
          inputSchema: {
            type: "object",
            properties: {
              correlationId: {
                type: "string",
                description:
                  "Optional client-provided correlation ID for end-to-end tracing",
              },
            },
          },
        },
        // 3. Operational Tool: Submit Property Basics
        {
          name: "submit_property_basics",
          description:
            "Submit and validate property location and structural category",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              country: { type: "string", enum: ["FR", "ES", "PT", "DE", "IT"] },
              postcode: { type: "string", description: "National postal code" },
              propertyType: {
                type: "string",
                enum: [
                  "apartment",
                  "detached_house",
                  "semi_detached",
                  "terraced_house",
                  "villa",
                ],
              },
              occupancyType: {
                type: "string",
                enum: ["owner_occupied", "tenant", "landlord"],
              },
            },
            required: [
              "sessionId",
              "country",
              "postcode",
              "propertyType",
              "occupancyType",
            ],
          },
        },
        // 4. Operational Tool: Submit Risk Factors
        {
          name: "submit_risk_factors",
          description:
            "Submit property construction age, living area, and 5-year claims loss history",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              constructionYearBand: {
                type: "string",
                enum: ["pre_1970", "1970_1999", "2000_2015", "post_2015"],
              },
              floorAreaBand: {
                type: "string",
                enum: [
                  "under_50_sqm",
                  "50_100_sqm",
                  "101_150_sqm",
                  "151_250_sqm",
                  "over_250_sqm",
                ],
              },
              isPrimaryResidence: { type: "boolean" },
              claimsCount5Years: { type: "number", minimum: 0, maximum: 10 },
            },
            required: [
              "sessionId",
              "constructionYearBand",
              "floorAreaBand",
              "isPrimaryResidence",
              "claimsCount5Years",
            ],
          },
        },
        // 5. Operational Tool: Evaluate Eligibility
        {
          name: "evaluate_eligibility",
          description:
            "Execute deterministic underwriting rules against submitted risk factors",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
            },
            required: ["sessionId"],
          },
        },
        // 6. Operational Tool: Select Coverage
        {
          name: "select_coverage",
          description:
            "Select coverage tier (essential/comfort/premium) and deductible amount in EUR",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              coverageTier: {
                type: "string",
                enum: ["essential", "comfort", "premium"],
              },
              deductible: { type: "number", enum: [150, 300, 500, 1000] },
              contactEmail: { type: "string", format: "email" },
            },
            required: ["sessionId"],
          },
        },
        // 7. Operational Tool: Confirm Parameters
        {
          name: "confirm_parameters",
          description:
            "Customer explicit confirmation of declared summary parameters prior to consent gating",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              confirmed: { type: "boolean" },
            },
            required: ["sessionId", "confirmed"],
          },
        },
        // 8. Operational Tool: Submit Consent
        {
          name: "submit_consent",
          description:
            "Record explicit GDPR Article 6/7 data processing consent",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              consentVersion: { type: "string", default: "consent_v1_2026" },
            },
            required: ["sessionId"],
          },
        },
        // 9. Operational Tool: Calculate Quote
        {
          name: "calculate_quote",
          description:
            "Deterministically calculate and issue an indicative, non-binding home insurance quotation",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              idempotencyKey: {
                type: "string",
                description:
                  "Client idempotency token to prevent duplicate calculation charges",
              },
            },
            required: ["sessionId"],
          },
        },
        // 10. Operational Tool: Adjust Quote
        {
          name: "adjust_quote",
          description:
            "Dynamically recalculate pricing for an active quotation by updating deductible or coverage tier",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              coverageTier: {
                type: "string",
                enum: ["essential", "comfort", "premium"],
              },
              deductible: { type: "number", enum: [150, 300, 500, 1000] },
              idempotencyKey: { type: "string" },
            },
            required: ["sessionId"],
          },
        },
        // 11. Operational Tool: Correct Field
        {
          name: "correct_field",
          description:
            "Correct previously submitted property or risk parameters with automated downstream invalidation",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              delta: {
                type: "object",
                properties: {
                  country: {
                    type: "string",
                    enum: ["FR", "ES", "PT", "DE", "IT"],
                  },
                  postcode: { type: "string" },
                  propertyType: {
                    type: "string",
                    enum: [
                      "apartment",
                      "detached_house",
                      "semi_detached",
                      "terraced_house",
                      "villa",
                    ],
                  },
                  occupancyType: {
                    type: "string",
                    enum: ["owner_occupied", "tenant", "landlord"],
                  },
                  constructionYearBand: {
                    type: "string",
                    enum: ["pre_1970", "1970_1999", "2000_2015", "post_2015"],
                  },
                  floorAreaBand: {
                    type: "string",
                    enum: [
                      "under_50_sqm",
                      "50_100_sqm",
                      "101_150_sqm",
                      "151_250_sqm",
                      "over_250_sqm",
                    ],
                  },
                  claimsCount5Years: {
                    type: "number",
                    minimum: 0,
                    maximum: 10,
                  },
                  isPrimaryResidence: { type: "boolean" },
                },
              },
            },
            required: ["sessionId", "delta"],
          },
        },
        // 12. Operational Tool: Get Session State
        {
          name: "get_session_state",
          description:
            "Retrieve current funnel session state, active quote, and invalidation counters",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
            },
            required: ["sessionId"],
          },
        },
        // 13. Operational Tool: Export Audit Trail
        {
          name: "export_audit_trail",
          description:
            "Retrieve immutable, SHA-256 chained audit event log and verify cryptographic integrity",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
            },
            required: ["sessionId"],
          },
        },
      ],
    };
  });

  // Tool Invocation Handler
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;

    try {
      // 1. Delegate to Compiled Waniwani Flow Handler if tool name matches
      if (name === waniwaniFlow.name || name === "get_home_insurance_quote") {
        const sessionId = (args as any)?.sessionId || (args as any)?.token;
        const flowArgs = {
          action: (args as any)?.action || (sessionId ? "continue" : "start"),
          sessionId,
          stateUpdates:
            (args as any)?.stateUpdates || (args as any)?.response || {},
          ...(args || {}),
        };
        const flowResult = await (waniwaniFlow.handler as any)(flowArgs, extra);
        return flowResult;
      }

      // 2. Delegate to Operational Engine Tools
      switch (name) {
        case "start_quote_session": {
          const session = await engine.startSession(
            args?.correlationId as string,
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    correlationId: session.correlationId,
                    step: session.step,
                    message:
                      "Session created. Proceed to submit property basics.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "submit_property_basics": {
          const country = SupportedCountrySchema.parse(args?.country);
          const propertyType = PropertyTypeSchema.parse(args?.propertyType);
          const occupancyType = OccupancyTypeSchema.parse(args?.occupancyType);

          const session = await engine.submitPropertyBasics(
            args?.sessionId as string,
            {
              country,
              postcode: String(args?.postcode),
              propertyType,
              occupancyType,
            },
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    step: session.step,
                    message:
                      "Property details recorded. Proceed to submit risk factors.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "submit_risk_factors": {
          const constructionYearBand = ConstructionYearBandSchema.parse(
            args?.constructionYearBand,
          );
          const floorAreaBand = FloorAreaBandSchema.parse(args?.floorAreaBand);

          const session = await engine.submitRiskFactors(
            args?.sessionId as string,
            {
              constructionYearBand,
              floorAreaBand,
              isPrimaryResidence: Boolean(args?.isPrimaryResidence),
              claimsCount5Years: Number(args?.claimsCount5Years),
            },
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    step: session.step,
                    message:
                      "Risk factors recorded. Proceed to evaluate eligibility.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "evaluate_eligibility": {
          const session = await engine.evaluateEligibility(
            args?.sessionId as string,
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    step: session.step,
                    eligibility: session.eligibilityResult,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "select_coverage": {
          const coverageTier = args?.coverageTier
            ? CoverageTierSchema.parse(args.coverageTier)
            : undefined;
          const deductible = args?.deductible
            ? DeductibleOptionSchema.parse(args.deductible)
            : undefined;

          const session = await engine.selectCoverage(
            args?.sessionId as string,
            {
              coverageTier,
              deductible,
              contactEmail: args?.contactEmail as string,
            },
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    step: session.step,
                    message:
                      "Coverage selected. Please confirm parameters and consent before calculating quote.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "confirm_parameters":
        case "confirm_quote_parameters": {
          const session = await engine.confirmParameters(
            args?.sessionId as string,
            Boolean(args?.confirmed),
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    step: session.step,
                    parametersConfirmedAt: session.parametersConfirmedAt,
                    message:
                      "Declared parameters confirmed. Proceed to grant consent.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "submit_consent": {
          const session = await engine.submitConsent(
            args?.sessionId as string,
            (args?.consentVersion as string) || "consent_v1_2026",
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    step: session.step,
                    consentGrantedAt: session.consentGrantedAt,
                    message:
                      "Data processing consent recorded. Ready for deterministic quote calculation.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "calculate_quote": {
          const quote = await engine.calculateQuote(args?.sessionId as string, {
            idempotencyKey: args?.idempotencyKey as string,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "QUOTE_ISSUED",
                    quote,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "adjust_quote": {
          const coverageTier = args?.coverageTier
            ? CoverageTierSchema.parse(args.coverageTier)
            : undefined;
          const deductible = args?.deductible
            ? DeductibleOptionSchema.parse(args.deductible)
            : undefined;

          const quote = await engine.adjustQuote(args?.sessionId as string, {
            coverageTier,
            deductible,
            idempotencyKey: args?.idempotencyKey as string,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    adjustedQuote: quote,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "correct_field": {
          const delta = CorrectionInputSchema.parse(args?.delta);
          const session = await engine.correctField(
            args?.sessionId as string,
            delta,
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "SUCCESS",
                    sessionId: session.sessionId,
                    step: session.step,
                    correctionCount: session.correctionCount,
                    message:
                      "Field corrected. Downstream dependencies invalidated.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "get_session_state": {
          const session = await engine.getSession(args?.sessionId as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(session, null, 2),
              },
            ],
          };
        }

        case "export_audit_trail": {
          const audit = await engine.exportAuditTrail(
            args?.sessionId as string,
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(audit, null, 2),
              },
            ],
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
            type: "text",
            text: JSON.stringify(
              {
                error: error.name || "Error",
                code: error.code || "UNKNOWN_ERROR",
                message: error.message,
                details: error.details,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  });

  return server;
}

/**
 * Start HTTP MCP Server if MCP_TRANSPORT=http using official StreamableHTTPServerTransport
 */
export async function startHttpMcpServer(
  port: number = Number(process.env.MCP_PORT ?? 3000),
) {
  const app = Fastify({ logger: false });
  const engine = new FunnelEngine();
  const server = createNorthstarMcpServer(engine);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  await server.connect(transport);

  app.get("/health", async () => ({
    status: "healthy",
    transport: "http",
    uptime: process.uptime(),
  }));
  app.get("/ready", async () => ({
    status: "ready",
    server: "northstar-insurance-mcp",
    version: "0.2.0",
  }));

  app.all("/mcp", async (req, reply) => {
    reply.hijack();
    await transport.handleRequest(req.raw, reply.raw, req.body);
  });

  const host = process.env.MCP_HOST || "127.0.0.1";
  await app.listen({ port, host });
  console.log(
    `[Northstar MCP Server] Listening over official Streamable HTTP transport on port ${port}`,
  );
  return { app, server, transport };
}
