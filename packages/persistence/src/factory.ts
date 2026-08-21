import type { SessionStore } from './store.interface.js';
import { InMemorySessionStore } from './memory-store.js';
import { PostgresSessionStore } from './postgres-store.js';

export function createSessionStore(mode: string = process.env.PERSISTENCE_MODE || 'memory'): SessionStore {
  if (mode === 'postgres') {
    return new PostgresSessionStore({
      connectionString: process.env.DATABASE_URL
    });
  }
  return new InMemorySessionStore();
}
