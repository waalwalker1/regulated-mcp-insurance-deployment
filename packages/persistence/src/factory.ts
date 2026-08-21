import type { SessionStore } from './store.interface.js';
import { InMemorySessionStore } from './memory-store.js';
import { PostgresSessionStore } from './postgres-store.js';

export function createSessionStore(mode: string = process.env.PERSISTENCE_MODE || 'memory'): SessionStore {
  if (mode === 'postgres') {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('[PERSISTENCE_CONFIG_ERROR] PERSISTENCE_MODE is set to "postgres" but DATABASE_URL environment variable is missing.');
    }
    return new PostgresSessionStore(connectionString);
  }
  return new InMemorySessionStore();
}
