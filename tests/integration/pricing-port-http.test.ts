import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildPricingServer } from "../../apps/pricing-service/src/server.js";
import {
  LocalDeterministicPricingAdapter,
  HttpPricingServiceAdapter,
  type PricingPort,
} from "../../packages/rules/src/pricing-port.js";
import type { QuoteInput } from "@northstar/domain";

describe("Integration: PricingPort Local vs HTTP Microservice Parity", () => {
  let serverInstance: ReturnType<typeof buildPricingServer>;
  let port: number;
  let localAdapter: PricingPort;
  let httpAdapter: PricingPort;

  beforeAll(async () => {
    serverInstance = buildPricingServer();
    // Listen on random available port
    const address = await serverInstance.app.listen({
      port: 0,
      host: "127.0.0.1",
    });
    const match = address.match(/:(\d+)$/);
    port = match ? Number(match[1]) : 3001;

    localAdapter = new LocalDeterministicPricingAdapter();
    httpAdapter = new HttpPricingServiceAdapter(
      `http://127.0.0.1:${port}`,
      3000,
    );
  });

  afterAll(async () => {
    await serverInstance.app.close();
  });

  const testCases: Array<{
    name: string;
    input: QuoteInput;
    expectEligible: boolean;
  }> = [
    {
      name: "France Apartment Standard",
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
      expectEligible: true,
    },
    {
      name: "Spain Detached House",
      input: {
        country: "ES",
        postcode: "28001",
        propertyType: "detached_house",
        occupancyType: "owner_occupied",
        constructionYearBand: "1970_1999",
        floorAreaBand: "151_250_sqm",
        isPrimaryResidence: true,
        claimsCount5Years: 0,
        coverageTier: "premium",
        deductible: 500,
      },
      expectEligible: true,
    },
    {
      name: "Portugal Tenant Apartment Essential",
      input: {
        country: "PT",
        postcode: "1000-001",
        propertyType: "apartment",
        occupancyType: "tenant",
        constructionYearBand: "post_2015",
        floorAreaBand: "under_50_sqm",
        isPrimaryResidence: true,
        claimsCount5Years: 0,
        coverageTier: "essential",
        deductible: 150,
      },
      expectEligible: true,
    },
    {
      name: "Germany Landlord Terraced House",
      input: {
        country: "DE",
        postcode: "10115",
        propertyType: "terraced_house",
        occupancyType: "landlord",
        constructionYearBand: "2000_2015",
        floorAreaBand: "101_150_sqm",
        isPrimaryResidence: false,
        claimsCount5Years: 0,
        coverageTier: "premium",
        deductible: 1000,
      },
      expectEligible: true,
    },
    {
      name: "Italy Villa Standard Risk",
      input: {
        country: "IT",
        postcode: "00118",
        propertyType: "villa",
        occupancyType: "owner_occupied",
        constructionYearBand: "1970_1999",
        floorAreaBand: "151_250_sqm",
        isPrimaryResidence: true,
        claimsCount5Years: 0,
        coverageTier: "comfort",
        deductible: 500,
      },
      expectEligible: true,
    },
    {
      name: "Excessive Claims Underwriting Referral",
      input: {
        country: "FR",
        postcode: "75008",
        propertyType: "detached_house",
        occupancyType: "owner_occupied",
        constructionYearBand: "pre_1970",
        floorAreaBand: "over_250_sqm",
        isPrimaryResidence: true,
        claimsCount5Years: 4, // Exceeds threshold -> referral
        coverageTier: "comfort",
        deductible: 300,
      },
      expectEligible: false,
    },
  ];

  for (const tc of testCases) {
    it(`should demonstrate 100% pricing and eligibility parity for: ${tc.name}`, async () => {
      const localElig = await localAdapter.evaluate(tc.input);
      const httpElig = await httpAdapter.evaluate(tc.input);

      expect(httpElig.isEligible).toBe(localElig.isEligible);
      expect(httpElig.status).toBe(localElig.status);
      expect(httpElig.ruleVersion).toBe(localElig.ruleVersion);
      expect(httpElig.reasonCodes).toEqual(localElig.reasonCodes);

      if (tc.expectEligible) {
        const localPricing = await localAdapter.calculate(tc.input);
        const httpPricing = await httpAdapter.calculate(tc.input);

        expect(httpPricing.totalAnnualPremium).toBe(
          localPricing.totalAnnualPremium,
        );
        expect(httpPricing.totalMonthlyPremium).toBe(
          localPricing.totalMonthlyPremium,
        );
        expect(httpPricing.netAnnualPremium).toBe(
          localPricing.netAnnualPremium,
        );
        expect(httpPricing.fictionalTaxAmount).toBe(
          localPricing.fictionalTaxAmount,
        );
        expect(httpPricing.deductibleDiscount).toBe(
          localPricing.deductibleDiscount,
        );
      }
    });
  }

  it("should cleanly handle timeout on unresponsive endpoint", async () => {
    // Adapter with 10ms timeout pointing to a blackholed or delayed port
    const shortTimeoutAdapter = new HttpPricingServiceAdapter(
      "http://10.255.255.1",
      50,
    );
    await expect(
      shortTimeoutAdapter.evaluate(testCases[0].input),
    ).rejects.toThrow();
  });
});
