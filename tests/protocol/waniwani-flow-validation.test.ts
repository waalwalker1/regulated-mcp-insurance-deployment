import { describe, it, expect } from "vitest";
import { createFlowTestHarness, MemoryKvStore } from "@waniwani/sdk/mcp";
import { buildWaniwaniInsuranceFlow } from "../../apps/mcp-server/src/waniwani-flow.js";

describe("Waniwani Flow: Domain Postal Code Validation & User-Friendly Re-ask", () => {
  it('should reject invalid French postcode "ABCDE" and re-ask with user-friendly interrupt', async () => {
    const store = new MemoryKvStore() as any;
    const compiledFlow = buildWaniwaniInsuranceFlow(store);
    const harness = await createFlowTestHarness(compiledFlow, {
      stateStore: store,
    });

    await harness.start("Quote for France");
    const step2 = await harness.continueWith({
      country: "FR",
      postcode: "ABCDE", // Invalid French postcode format
      propertyType: "apartment",
      occupancyType: "owner_occupied",
    });

    // Flow must interrupt and re-ask for the postal code
    expect(step2.status).toBe("interrupt");
    if (step2.status === "interrupt") {
      expect(
        step2.field === "postcode" ||
          step2.questions?.some((q) => q.field === "postcode"),
      ).toBe(true);
      const questionText =
        step2.question ||
        step2.questions?.find((q) => q.field === "postcode")?.question;
      expect(questionText).toContain("does not match the postal format for FR");
    }
  });

  it('should reject invalid German postcode "1234" (4 digits instead of 5) and re-ask', async () => {
    const store = new MemoryKvStore() as any;
    const compiledFlow = buildWaniwaniInsuranceFlow(store);
    const harness = await createFlowTestHarness(compiledFlow, {
      stateStore: store,
    });

    await harness.start("Quote for Germany");
    const step2 = await harness.continueWith({
      country: "DE",
      postcode: "1234", // Invalid: German postcodes must have 5 digits
      propertyType: "detached_house",
      occupancyType: "owner_occupied",
    });

    expect(step2.status).toBe("interrupt");
    if (step2.status === "interrupt") {
      expect(
        step2.field === "postcode" ||
          step2.questions?.some((q) => q.field === "postcode"),
      ).toBe(true);
      const questionText =
        step2.question ||
        step2.questions?.find((q) => q.field === "postcode")?.question;
      expect(questionText).toContain("does not match the postal format for DE");
    }
  });

  it('should accept valid Portuguese postcode "1000-001" and advance to risk factors', async () => {
    const store = new MemoryKvStore() as any;
    const compiledFlow = buildWaniwaniInsuranceFlow(store);
    const harness = await createFlowTestHarness(compiledFlow, {
      stateStore: store,
    });

    await harness.start("Quote for Portugal");
    const step2 = await harness.continueWith({
      country: "PT",
      postcode: "1000-001",
      propertyType: "apartment",
      occupancyType: "tenant",
    });

    expect(step2.status).toBe("interrupt");
    if (step2.status === "interrupt") {
      // Must advance past property to risk factors
      expect(
        step2.field === "constructionYearBand" ||
          step2.questions?.some((q) => q.field === "constructionYearBand"),
      ).toBe(true);
    }
  });

  it('should accept valid Spanish postcode "28001" and advance', async () => {
    const store = new MemoryKvStore() as any;
    const compiledFlow = buildWaniwaniInsuranceFlow(store);
    const harness = await createFlowTestHarness(compiledFlow, {
      stateStore: store,
    });

    await harness.start("Quote for Spain");
    const step2 = await harness.continueWith({
      country: "ES",
      postcode: "28001",
      propertyType: "villa",
      occupancyType: "owner_occupied",
    });

    expect(step2.status).toBe("interrupt");
    if (step2.status === "interrupt") {
      expect(
        step2.field === "constructionYearBand" ||
          step2.questions?.some((q) => q.field === "constructionYearBand"),
      ).toBe(true);
    }
  });

  it('should accept valid Italian postcode "00118" and advance', async () => {
    const store = new MemoryKvStore() as any;
    const compiledFlow = buildWaniwaniInsuranceFlow(store);
    const harness = await createFlowTestHarness(compiledFlow, {
      stateStore: store,
    });

    await harness.start("Quote for Italy");
    const step2 = await harness.continueWith({
      country: "IT",
      postcode: "00118",
      propertyType: "apartment",
      occupancyType: "owner_occupied",
    });

    expect(step2.status).toBe("interrupt");
    if (step2.status === "interrupt") {
      expect(
        step2.field === "constructionYearBand" ||
          step2.questions?.some((q) => q.field === "constructionYearBand"),
      ).toBe(true);
    }
  });
});
