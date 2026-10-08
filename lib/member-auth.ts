import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { MAX_MEMBER_DEVICES } from "./content";
import { databaseUrl, query } from "./db";
import { PREVIEW_MEMBER, PREVIEW_MEMBER_ID, previewAllowed } from "./preview";

// Member sessions for /members. Signing in with email + access code stores a
// random token in a cookie; the database keeps only its hash. A session ends
// when the member signs out, after SESSION_DAYS, or when you change their
// status or code in /admin.

const COOKIE = "idle_member";
const COOKIE_PATH = "/members";
const SESSION_DAYS = 90;

export type Member = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  school: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function membersConfigured(): boolean {
  return Boolean(databaseUrl());
}

export async function startMemberSession(registrationId: string) {
  const token = randomBytes(32).toString("base64url");
  await query(
    `INSERT INTO member_sessions (token_hash, registration_id, expires_at)
     VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), registrationId, SESSION_DAYS],
  );
  // Keep the newest sessions only, and clear out expired ones.
  await query(
    `DELETE FROM member_sessions
     WHERE expires_at < now()
        OR (registration_id = $1 AND token_hash NOT IN (
              SELECT token_hash FROM member_sessions
              WHERE registration_id = $1
              ORDER BY last_seen_at DESC, created_at DESC
              LIMIT $2))`,
    [registrationId, MAX_MEMBER_DEVICES],
  );
  await query(`UPDATE registrations SET member_last_seen_at = now() WHERE id = $1`, [
    registrationId,
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Signs in as the sample member (only when running the site on your computer). */
export async function startPreviewSession() {
  if (!previewAllowed()) return;
  (await cookies()).set(COOKIE, PREVIEW_MEMBER_ID, {
    httpOnly: true,
    sameSite: "lax",
    path: COOKIE_PATH,
  });
}

export async function endMemberSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && token !== PREVIEW_MEMBER_ID && membersConfigured()) {
    await query(`DELETE FROM member_sessions WHERE token_hash = $1`, [hashToken(token)]);
  }
  jar.set(COOKIE, "", { path: COOKIE_PATH, maxAge: 0 });
}

/** The signed-in member, or null. Cached for the rest of the request. */
export const getMember = cache(async (): Promise<Member | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token === PREVIEW_MEMBER_ID && previewAllowed()) return PREVIEW_MEMBER;
  if (!membersConfigured()) return null;
  if (!token || token.length > 100) return null;
  const tokenHash = hashToken(token);
  const rows = await query<{
    id: string;
    email: string;
    full_name: string;
    school: string;
    stale: boolean;
  }>(
    `SELECT r.id::text AS id, r.email, r.full_name, r.school,
            s.last_seen_at < now() - interval '1 hour' AS stale
     FROM member_sessions s
     JOIN registrations r ON r.id = s.registration_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND r.status = 'granted'`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.stale) {
    await query(
      `WITH s AS (
         UPDATE member_sessions SET last_seen_at = now() WHERE token_hash = $1
         RETURNING registration_id)
       UPDATE registrations SET member_last_seen_at = now()
       WHERE id IN (SELECT registration_id FROM s)`,
      [tokenHash],
    );
  }
  const fullName = row.full_name.trim();
  return {
    id: row.id,
    email: row.email,
    fullName,
    firstName: fullName.split(/\s+/)[0] || fullName,
    school: row.school,
  };
});

/** The signed-in member; sends anyone else to the sign-in page. */
export async function requireMember(): Promise<Member> {
  const member = await getMember();
  if (!member) redirect("/members/login");
  return member;
}
