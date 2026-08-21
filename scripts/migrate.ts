import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/northstar_insurance';
  console.log(`[DB Migrate] Connecting to database: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    const migrationPath = join(__dirname, '../packages/persistence/src/migrations/001_initial_schema.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    console.log('[DB Migrate] Executing migration: 001_initial_schema.sql...');
    await client.query(sql);
    console.log('[DB Migrate] Schema migration successfully applied.');
  } catch (err: any) {
    console.error(`[DB Migrate Error] Migration failed: ${err.message}`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
