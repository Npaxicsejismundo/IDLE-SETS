import "server-only";
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
};

const COLUMNS = `id::text AS id, created_at, email, full_name, school, proof_url,
  proof_pathname, proof_content_type, proof_size, status, status_changed_at`;

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
  };
}

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
  if (!/^\d{1,18}$/.test(id)) return null;
  const rows = await query<Row>(`SELECT ${COLUMNS} FROM registrations WHERE id = $1`, [id]);
  return rows[0] ? toRegistration(rows[0]) : null;
}

export async function setRegistrationStatus(id: string, status: RegistrationStatus) {
  if (!/^\d{1,18}$/.test(id)) return;
  await query(
    `UPDATE registrations SET status = $2, status_changed_at = now() WHERE id = $1`,
    [id, status],
  );
}
