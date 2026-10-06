import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResultRow } from "pg";

// Postgres connection. On Vercel, connecting a Neon database to the project
// sets DATABASE_URL (or POSTGRES_URL) automatically.

const globalForDb = globalThis as unknown as {
  idlePool?: Pool;
  idleSchemaReady?: Promise<void>;
};

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

function pool(): Pool {
  if (!globalForDb.idlePool) {
    const connectionString = databaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. See README → Registration setup.");
    }
    const p = new Pool({ connectionString, max: 5, idleTimeoutMillis: 5000 });
    attachDatabasePool(p);
    globalForDb.idlePool = p;
  }
  return globalForDb.idlePool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS registrations (
  id                 BIGSERIAL PRIMARY KEY,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  email              TEXT NOT NULL,
  full_name          TEXT NOT NULL,
  school             TEXT NOT NULL,
  proof_url          TEXT NOT NULL,
  proof_pathname     TEXT NOT NULL,
  proof_content_type TEXT NOT NULL,
  proof_size         INTEGER NOT NULL,
  agreed_no_refund   BOOLEAN NOT NULL,
  agreed_terms       BOOLEAN NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'granted', 'rejected')),
  status_changed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS registrations_status_idx ON registrations (status);
`;

/** Creates the table the first time the app talks to a new database. */
function ensureSchema(): Promise<void> {
  if (!globalForDb.idleSchemaReady) {
    globalForDb.idleSchemaReady = pool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((error) => {
        globalForDb.idleSchemaReady = undefined; // retry on the next request
        throw error;
      });
  }
  return globalForDb.idleSchemaReady;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  const result = await pool().query<T>(text, params);
  return result.rows;
}
