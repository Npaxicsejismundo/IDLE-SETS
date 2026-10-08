import "server-only";
import { query } from "./db";
import { isPreviewMember, previewProgress } from "./preview";

// Saved progress for sets answered inside the site.

export type AnswerRecord = {
  choice: string | null;
  correct: boolean | null;
  flagged: boolean;
  seconds: number;
};

export type Attempt = {
  id: string;
  slug: string;
  questionKeys: string[];
  isRetake: boolean;
  startedAt: Date;
  finishedAt: Date | null;
  answers: Record<string, AnswerRecord>;
};

export type AttemptSummary = {
  id: string;
  slug: string;
  total: number;
  isRetake: boolean;
  startedAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
  answered: number;
  correct: number;
  flagged: number;
  seconds: number;
};

/** Longest time counted for one question, so a tab left open doesn't skew totals. */
export const MAX_SECONDS_PER_QUESTION = 10 * 60;

const ID_PATTERN = /^\d{1,18}$/;

type AttemptRow = {
  id: string;
  set_slug: string;
  question_keys: string[];
  is_retake: boolean;
  started_at: Date;
  finished_at: Date | null;
};

async function withAnswers(row: AttemptRow): Promise<Attempt> {
  const answers = await query<{
    question_key: string;
    choice: string | null;
    correct: boolean | null;
    flagged: boolean;
    seconds: number;
  }>(
    `SELECT question_key, choice, correct, flagged, seconds
     FROM attempt_answers WHERE attempt_id = $1`,
    [row.id],
  );
  return {
    id: row.id,
    slug: row.set_slug,
    questionKeys: row.question_keys,
    isRetake: row.is_retake,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    answers: Object.fromEntries(
      answers.map((a) => [
        a.question_key,
        { choice: a.choice, correct: a.correct, flagged: a.flagged, seconds: a.seconds },
      ]),
    ),
  };
}

const ATTEMPT_COLUMNS = `id::text AS id, set_slug, question_keys, is_retake, started_at, finished_at`;

/** One of the member's attempts, with its answers. */
export async function getAttempt(memberId: string, attemptId: string): Promise<Attempt | null> {
  if (isPreviewMember(memberId)) return previewProgress.getAttempt(attemptId);
  if (!ID_PATTERN.test(attemptId)) return null;
  const rows = await query<AttemptRow>(
    `SELECT ${ATTEMPT_COLUMNS} FROM set_attempts WHERE id = $1 AND registration_id = $2`,
    [attemptId, memberId],
  );
  return rows[0] ? withAnswers(rows[0]) : null;
}

/** The member's most recent unfinished attempt at a set, if any. */
export async function getOpenAttempt(memberId: string, slug: string): Promise<Attempt | null> {
  if (isPreviewMember(memberId)) return previewProgress.getOpenAttempt(slug);
  const rows = await query<AttemptRow>(
    `SELECT ${ATTEMPT_COLUMNS} FROM set_attempts
     WHERE registration_id = $1 AND set_slug = $2 AND finished_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 1`,
    [memberId, slug],
  );
  return rows[0] ? withAnswers(rows[0]) : null;
}

export async function createAttempt(
  memberId: string,
  slug: string,
  questionKeys: string[],
  isRetake: boolean,
): Promise<string> {
  if (isPreviewMember(memberId)) return previewProgress.createAttempt(slug, questionKeys, isRetake);
  const rows = await query<{ id: string }>(
    `INSERT INTO set_attempts (registration_id, set_slug, question_keys, is_retake)
     VALUES ($1, $2, $3, $4)
     RETURNING id::text AS id`,
    [memberId, slug, questionKeys, isRetake],
  );
  return rows[0].id;
}

/** Checks the attempt is the member's, still open, and includes the question. */
async function openAttemptHas(memberId: string, attemptId: string, key: string) {
  if (!ID_PATTERN.test(attemptId)) return false;
  const rows = await query<{ ok: boolean }>(
    `SELECT true AS ok FROM set_attempts
     WHERE id = $1 AND registration_id = $2 AND finished_at IS NULL
       AND $3 = ANY (question_keys)`,
    [attemptId, memberId, key],
  );
  return rows.length > 0;
}

/** Saves an answer. The first answer to a question is final. */
export async function recordAnswer(input: {
  memberId: string;
  attemptId: string;
  key: string;
  choice: string;
  correct: boolean;
  seconds: number;
}): Promise<boolean> {
  const seconds = Math.max(0, Math.min(MAX_SECONDS_PER_QUESTION, Math.round(input.seconds)));
  if (isPreviewMember(input.memberId)) {
    return previewProgress.recordAnswer(input.attemptId, input.key, input.choice, input.correct, seconds);
  }
  if (!(await openAttemptHas(input.memberId, input.attemptId, input.key))) return false;
  await query(
    `INSERT INTO attempt_answers (attempt_id, question_key, choice, correct, seconds, answered_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (attempt_id, question_key) DO UPDATE SET
       choice = COALESCE(attempt_answers.choice, EXCLUDED.choice),
       correct = COALESCE(attempt_answers.correct, EXCLUDED.correct),
       answered_at = COALESCE(attempt_answers.answered_at, EXCLUDED.answered_at),
       seconds = CASE WHEN attempt_answers.choice IS NULL
                      THEN EXCLUDED.seconds ELSE attempt_answers.seconds END`,
    [input.attemptId, input.key, input.choice, input.correct, seconds],
  );
  await query(`UPDATE set_attempts SET updated_at = now() WHERE id = $1`, [input.attemptId]);
  return true;
}

export async function recordFlag(input: {
  memberId: string;
  attemptId: string;
  key: string;
  flagged: boolean;
}): Promise<boolean> {
  if (isPreviewMember(input.memberId)) {
    return previewProgress.recordFlag(input.attemptId, input.key, input.flagged);
  }
  if (!(await openAttemptHas(input.memberId, input.attemptId, input.key))) return false;
  await query(
    `INSERT INTO attempt_answers (attempt_id, question_key, flagged)
     VALUES ($1, $2, $3)
     ON CONFLICT (attempt_id, question_key) DO UPDATE SET flagged = EXCLUDED.flagged`,
    [input.attemptId, input.key, input.flagged],
  );
  return true;
}

export async function finishAttempt(memberId: string, attemptId: string): Promise<boolean> {
  if (isPreviewMember(memberId)) return previewProgress.finishAttempt(attemptId);
  if (!ID_PATTERN.test(attemptId)) return false;
  const rows = await query<{ id: string }>(
    `UPDATE set_attempts SET finished_at = COALESCE(finished_at, now()), updated_at = now()
     WHERE id = $1 AND registration_id = $2
     RETURNING id::text AS id`,
    [attemptId, memberId],
  );
  return rows.length > 0;
}

/** All of a member's attempts with their totals, newest activity first. */
export async function listAttempts(memberId: string): Promise<AttemptSummary[]> {
  if (isPreviewMember(memberId)) return previewProgress.listAttempts();
  const rows = await query<{
    id: string;
    set_slug: string;
    total: number;
    is_retake: boolean;
    started_at: Date;
    updated_at: Date;
    finished_at: Date | null;
    answered: string;
    correct: string;
    flagged: string;
    seconds: string;
  }>(
    `SELECT a.id::text AS id, a.set_slug, cardinality(a.question_keys) AS total, a.is_retake,
            a.started_at, a.updated_at, a.finished_at,
            count(x.choice) AS answered,
            count(*) FILTER (WHERE x.correct) AS correct,
            count(*) FILTER (WHERE x.flagged) AS flagged,
            coalesce(sum(x.seconds), 0) AS seconds
     FROM set_attempts a
     LEFT JOIN attempt_answers x ON x.attempt_id = a.id
     WHERE a.registration_id = $1
     GROUP BY a.id
     ORDER BY a.updated_at DESC`,
    [memberId],
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.set_slug,
    total: Number(r.total),
    isRetake: r.is_retake,
    startedAt: r.started_at,
    updatedAt: r.updated_at,
    finishedAt: r.finished_at,
    answered: Number(r.answered),
    correct: Number(r.correct),
    flagged: Number(r.flagged),
    seconds: Number(r.seconds),
  }));
}

/** Days in a row (Manila time) with at least one answer, ending today or yesterday. */
export async function dayStreak(memberId: string): Promise<number> {
  if (isPreviewMember(memberId)) return previewProgress.dayStreak();
  const rows = await query<{ day: string; today: string }>(
    `SELECT DISTINCT to_char(x.answered_at AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS day,
            to_char(now() AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') AS today
     FROM attempt_answers x
     JOIN set_attempts a ON a.id = x.attempt_id
     WHERE a.registration_id = $1 AND x.answered_at > now() - interval '400 days'
     ORDER BY day DESC`,
    [memberId],
  );
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => r.day));
  const cursor = new Date(`${rows[0].today}T00:00:00Z`);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (!days.has(iso(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(iso(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
