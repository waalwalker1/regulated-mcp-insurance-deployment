import type { SessionStore } from "./store.interface.js";
import { InMemorySessionStore } from "./memory-store.js";
import { PostgresSessionStore } from "./postgres-store.js";
import { PostgresWaniwaniKvStore } from "./waniwani-postgres-kv-store.js";
import { MemoryKvStore } from "@waniwani/sdk/mcp";

export function createSessionStore(
  mode: string = process.env.PERSISTENCE_MODE || "memory",
): SessionStore {
  if (mode === "postgres") {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        '[PERSISTENCE_CONFIG_ERROR] PERSISTENCE_MODE is set to "postgres" but DATABASE_URL environment variable is missing.',
      );
    }
    return new PostgresSessionStore(connectionString);
  }
  return new InMemorySessionStore();
}

export function createWaniwaniFlowStore(
  mode: string = process.env.PERSISTENCE_MODE || "memory",
) {
  if (mode === "postgres") {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        '[PERSISTENCE_CONFIG_ERROR] PERSISTENCE_MODE is set to "postgres" but DATABASE_URL environment variable is missing.',
      );
    }
    return new PostgresWaniwaniKvStore(connectionString);
  }
  return new MemoryKvStore();
}
