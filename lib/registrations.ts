import "server-only";
import { newAccessCode } from "./access-codes";
import { query } from "./db";

export const STATUSES = ["pending", "granted", "rejected"] as const;
export type RegistrationStatus = (typeof STATUSES)[number];

export function isStatus(value: unknown): value is RegistrationStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export type Registration = {
  id: string;
  createdAt: Date;
  email: string;
  fullName: string;
  school: string;
  proofUrl: string;
  proofPathname: string;
  proofContentType: string;
  proofSize: number;
  status: RegistrationStatus;
  statusChangedAt: Date | null;
  /** Made when access is granted; the member signs in with it. */
  accessCode: string | null;
  /** Last time the member used the members area. */
  lastSeenAt: Date | null;
};

type Row = {
  id: string;
  created_at: Date;
  email: string;
  full_name: string;
  school: string;
  proof_url: string;
  proof_pathname: string;
  proof_content_type: string;
  proof_size: number;
  status: RegistrationStatus;
  status_changed_at: Date | null;
  access_code: string | null;
  last_seen_at: Date | null;
};

const COLUMNS = `id::text AS id, created_at, email, full_name, school, proof_url,
  proof_pathname, proof_content_type, proof_size, status, status_changed_at, access_code,
  member_last_seen_at AS last_seen_at`;

function toRegistration(row: Row): Registration {
  return {
    id: row.id,
    createdAt: row.created_at,
    email: row.email,
    fullName: row.full_name,
    school: row.school,
    proofUrl: row.proof_url,
    proofPathname: row.proof_pathname,
    proofContentType: row.proof_content_type,
    proofSize: row.proof_size,
    status: row.status,
    statusChangedAt: row.status_changed_at,
    accessCode: row.access_code,
    lastSeenAt: row.last_seen_at,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "23505";
}

const ID_PATTERN = /^\d{1,18}$/;

export async function createRegistration(input: {
  email: string;
  fullName: string;
  school: string;
  proofUrl: string;
  proofPathname: string;
  proofContentType: string;
  proofSize: number;
  agreedNoRefund: boolean;
  agreedTerms: boolean;
}): Promise<Registration> {
  const rows = await query<Row>(
    `INSERT INTO registrations
       (email, full_name, school, proof_url, proof_pathname, proof_content_type,
        proof_size, agreed_no_refund, agreed_terms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${COLUMNS}`,
    [
      input.email,
      input.fullName,
      input.school,
      input.proofUrl,
      input.proofPathname,
      input.proofContentType,
      input.proofSize,
      input.agreedNoRefund,
      input.agreedTerms,
    ],
  );
  return toRegistration(rows[0]);
}

export const LIST_LIMIT = 500;

export async function listRegistrations(options: {
  status?: RegistrationStatus;
  search?: string;
  limit?: number;
}): Promise<Registration[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (options.status) {
    params.push(options.status);
    where.push(`status = $${params.length}`);
  }
  const search = options.search?.trim();
  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    const p = `$${params.length}`;
    where.push(`(email ILIKE ${p} OR full_name ILIKE ${p} OR school ILIKE ${p})`);
  }
  params.push(options.limit ?? LIST_LIMIT);
  const rows = await query<Row>(
    `SELECT ${COLUMNS} FROM registrations
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length}`,
    params,
  );
  return rows.map(toRegistration);
}

export async function countByStatus(): Promise<Record<RegistrationStatus | "all", number>> {
  const rows = await query<{ status: RegistrationStatus; count: string }>(
    `SELECT status, count(*)::text AS count FROM registrations GROUP BY status`,
  );
  const counts = { all: 0, pending: 0, granted: 0, rejected: 0 };
  for (const row of rows) {
    counts[row.status] = Number(row.count);
    counts.all += Number(row.count);
  }
  return counts;
}

export async function getRegistration(id: string): Promise<Registration | null> {
  if (!ID_PATTERN.test(id)) return null;
  const rows = await query<Row>(`SELECT ${COLUMNS} FROM registrations WHERE id = $1`, [id]);
  return rows[0] ? toRegistration(rows[0]) : null;
}

/** Runs an update that sets a new access code, retrying if the code is taken. */
async function withFreshCode(run: (code: string) => Promise<Row[]>): Promise<Row[]> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await run(newAccessCode());
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error("Couldn't make a unique access code.");
}

/**
 * Changes a registration's status. Granting access makes an access code if
 * the member doesn't have one yet. Any other status signs the member out of
 * the members area on every device.
 */
export async function setRegistrationStatus(
  id: string,
  status: RegistrationStatus,
): Promise<Registration | null> {
  if (!ID_PATTERN.test(id)) return null;
  let rows: Row[];
  if (status === "granted") {
    rows = await withFreshCode((code) =>
      query<Row>(
        `UPDATE registrations
         SET status = 'granted', status_changed_at = now(),
             access_code = COALESCE(access_code, $2)
         WHERE id = $1
         RETURNING ${COLUMNS}`,
        [id, code],
      ),
    );
  } else {
    rows = await query<Row>(
      `UPDATE registrations SET status = $2, status_changed_at = now()
       WHERE id = $1
       RETURNING ${COLUMNS}`,
      [id, status],
    );
    await query(`DELETE FROM member_sessions WHERE registration_id = $1`, [id]);
  }
  return rows[0] ? toRegistration(rows[0]) : null;
}

/**
 * Replaces a member's access code. The old code stops working and the member
 * is signed out everywhere (useful if a code was shared).
 */
export async function replaceAccessCode(id: string): Promise<Registration | null> {
  if (!ID_PATTERN.test(id)) return null;
  const rows = await withFreshCode((code) =>
    query<Row>(
      `UPDATE registrations SET access_code = $2
       WHERE id = $1 AND status = 'granted'
       RETURNING ${COLUMNS}`,
      [id, code],
    ),
  );
  await query(`DELETE FROM member_sessions WHERE registration_id = $1`, [id]);
  return rows[0] ? toRegistration(rows[0]) : null;
}

/** The granted registration with this email and access code, if any. */
export async function findMemberByCode(
  email: string,
  accessCode: string,
): Promise<Registration | null> {
  if (!email || !accessCode) return null;
  const rows = await query<Row>(
    `SELECT ${COLUMNS} FROM registrations
     WHERE lower(email) = lower($1) AND access_code = $2 AND status = 'granted'
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, accessCode],
  );
  return rows[0] ? toRegistration(rows[0]) : null;
}
