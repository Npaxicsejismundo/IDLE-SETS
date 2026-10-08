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

-- Members area. A member signs in with their email and the access code made
-- when you grant access in /admin.
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS member_last_seen_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS registrations_access_code_idx
  ON registrations (access_code) WHERE access_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS registrations_email_lower_idx ON registrations (lower(email));

CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash      TEXT PRIMARY KEY,
  registration_id BIGINT NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS member_sessions_registration_idx
  ON member_sessions (registration_id, last_seen_at DESC);

-- One run through a set (or through the questions missed last time).
-- question_keys lists the questions in this attempt, in order.
CREATE TABLE IF NOT EXISTS set_attempts (
  id              BIGSERIAL PRIMARY KEY,
  registration_id BIGINT NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  set_slug        TEXT NOT NULL,
  question_keys   TEXT[] NOT NULL,
  is_retake       BOOLEAN NOT NULL DEFAULT false,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS set_attempts_member_idx
  ON set_attempts (registration_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id   BIGINT NOT NULL REFERENCES set_attempts (id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  choice       TEXT,
  correct      BOOLEAN,
  flagged      BOOLEAN NOT NULL DEFAULT false,
  seconds      INTEGER NOT NULL DEFAULT 0,
  answered_at  TIMESTAMPTZ,
  PRIMARY KEY (attempt_id, question_key)
);
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
