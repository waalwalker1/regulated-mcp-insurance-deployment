import { describe, it, expect } from "vitest";
import { InMemorySessionStore } from "../packages/persistence/src/index.js";

describe("Persistence & Session Lifecycle", () => {
  it("creates, saves, retrieves, and deletes sessions with correct TTL", async () => {
    const store = new InMemorySessionStore();
    const session = await store.createSession("sess-1", "corr-1", 3600);

    expect(session.sessionId).toBe("sess-1");
    expect(session.step).toBe("INIT");

    session.step = "COLLECTING_PROPERTY";
    session.partialInput.country = "FR";
    await store.saveSession(session);

    const retrieved = await store.getSession("sess-1");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.step).toBe("COLLECTING_PROPERTY");
    expect(retrieved?.partialInput.country).toBe("FR");

    const deleted = await store.deleteSession("sess-1");
    expect(deleted).toBe(true);

    const afterDelete = await store.getSession("sess-1");
    expect(afterDelete).toBeNull();
  });

  it("cleans expired sessions correctly", async () => {
    const store = new InMemorySessionStore();
    // Create an immediately expired session with ttl = -1
    await store.createSession("sess-expired", "corr-2", -10);
    await store.createSession("sess-active", "corr-3", 3600);

    const cleaned = await store.cleanExpiredSessions();
    expect(cleaned).toBe(1);

    expect(await store.getSession("sess-expired")).toBeNull();
    expect(await store.getSession("sess-active")).not.toBeNull();
  });
});
