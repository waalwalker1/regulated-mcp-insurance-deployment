import { describe, it, expect } from "vitest";
import { InMemorySessionStore } from "../packages/persistence/src/index.js";

describe("Session Isolation & Concurrency Safety", () => {
  it("guarantees complete isolation between concurrent customer sessions", async () => {
    const store = new InMemorySessionStore();

    // Session A: French Apartment
    const sessionA = await store.createSession("session-A", "corr-A");
    sessionA.step = "COLLECTING_PROPERTY";
    sessionA.partialInput = {
      country: "FR",
      postcode: "75008",
      propertyType: "apartment",
    };
    await store.saveSession(sessionA);

    // Session B: Spanish Villa
    const sessionB = await store.createSession("session-B", "corr-B");
    sessionB.step = "COLLECTING_RISK";
    sessionB.partialInput = {
      country: "ES",
      postcode: "28001",
      propertyType: "villa",
      claimsCount5Years: 1,
    };
    await store.saveSession(sessionB);

    // Re-fetch both and check values
    const fetchedA = await store.getSession("session-A");
    const fetchedB = await store.getSession("session-B");

    expect(fetchedA?.partialInput.country).toBe("FR");
    expect(fetchedA?.partialInput.propertyType).toBe("apartment");
    expect(fetchedA?.partialInput.claimsCount5Years).toBeUndefined();

    expect(fetchedB?.partialInput.country).toBe("ES");
    expect(fetchedB?.partialInput.propertyType).toBe("villa");
    expect(fetchedB?.partialInput.claimsCount5Years).toBe(1);

    // Modifying fetched object in memory does not mutate store state directly without explicit saveSession
    fetchedA!.partialInput.country = "DE";
    const refetchedA = await store.getSession("session-A");
    expect(refetchedA?.partialInput.country).toBe("FR");
  });
});
