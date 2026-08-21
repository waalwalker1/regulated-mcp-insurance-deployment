import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildPricingServer } from "../apps/pricing-service/src/server.js";
import type { FastifyInstance } from "fastify";

describe("Pricing Microservice REST API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const serverObj = buildPricingServer();
    app = serverObj.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns healthy status", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("healthy");
  });

  it("GET /ready returns uptime and active rule version", async () => {
    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ready).toBe(true);
    expect(body.activeRuleVersion).toBe("northstar-home-eu-v1");
  });

  it("POST /api/v1/quote/evaluate checks eligibility", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/quote/evaluate",
      payload: {
        country: "FR",
        postcode: "75008",
        propertyType: "apartment",
        occupancyType: "owner_occupied",
        constructionYearBand: "2000_2015",
        floorAreaBand: "50_100_sqm",
        isPrimaryResidence: true,
        claimsCount5Years: 0,
        coverageTier: "comfort",
        deductible: 300,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.isEligible).toBe(true);
    expect(body.status).toBe("eligible");
  });

  it("POST /api/v1/quote/calculate rejects request without consent", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/quote/calculate",
      payload: {
        input: {
          country: "FR",
          postcode: "75008",
          propertyType: "apartment",
          occupancyType: "owner_occupied",
          constructionYearBand: "2000_2015",
          floorAreaBand: "50_100_sqm",
          isPrimaryResidence: true,
          claimsCount5Years: 0,
        },
        consent: {
          hasConsentedToDataProcessing: false,
        },
      },
    });

    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error).toBe("CONSENT_REQUIRED");
  });

  it("POST /api/v1/quote/calculate produces deterministic quote with consent", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/quote/calculate",
      payload: {
        input: {
          country: "FR",
          postcode: "75008",
          propertyType: "apartment",
          occupancyType: "owner_occupied",
          constructionYearBand: "2000_2015",
          floorAreaBand: "50_100_sqm",
          isPrimaryResidence: true,
          claimsCount5Years: 0,
          coverageTier: "comfort",
          deductible: 300,
        },
        consent: {
          hasConsentedToDataProcessing: true,
          consentVersion: "consent_v1_2026",
          consentTimestamp: new Date().toISOString(),
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const quote = res.json();
    expect(quote.status).toBe("active");
    expect(quote.pricing.totalAnnualPremium).toBe(161.66);
    expect(quote.quoteHash).toBeDefined();
  });
});
