import "server-only";
import type { AnswerRecord, Attempt, AttemptSummary } from "./progress";

// Preview of the members area for running the site on your computer
// (npm run dev): the sign-in page shows a "Preview" button that signs you in
// as a sample member, with no registration or database needed. Progress is
// kept in memory and disappears when the dev server restarts. None of this
// works on the live site.

export const PREVIEW_MEMBER_ID = "preview";

export function previewAllowed(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isPreviewMember(memberId: string): boolean {
  return memberId === PREVIEW_MEMBER_ID && previewAllowed();
}

export const PREVIEW_MEMBER = {
  id: PREVIEW_MEMBER_ID,
  email: "preview@idlesets.local",
  fullName: "Preview Member",
  firstName: "Preview",
  school: "Preview mode (only on your computer)",
};

type StoredAttempt = Omit<Attempt, "answers"> & {
  updatedAt: Date;
  answers: Record<string, AnswerRecord & { answeredAt: Date | null }>;
};

const store = globalThis as unknown as {
  idlePreview?: { nextId: number; attempts: StoredAttempt[] };
};

function db() {
  store.idlePreview ??= { nextId: 1, attempts: [] };
  return store.idlePreview;
}

function toAttempt(a: StoredAttempt): Attempt {
  return {
    id: a.id,
    slug: a.slug,
    questionKeys: a.questionKeys,
    isRetake: a.isRetake,
    startedAt: a.startedAt,
    finishedAt: a.finishedAt,
    answers: Object.fromEntries(
      Object.entries(a.answers).map(([key, { choice, correct, flagged, seconds }]) => [
        key,
        { choice, correct, flagged, seconds },
      ]),
    ),
  };
}

function find(attemptId: string) {
  return db().attempts.find((a) => a.id === attemptId);
}

function openAttemptHas(attemptId: string, key: string) {
  const a = find(attemptId);
  return a && !a.finishedAt && a.questionKeys.includes(key) ? a : undefined;
}

export const previewProgress = {
  getAttempt(attemptId: string): Attempt | null {
    const a = find(attemptId);
    return a ? toAttempt(a) : null;
  },

  getOpenAttempt(slug: string): Attempt | null {
    const a = [...db().attempts]
      .filter((x) => x.slug === slug && !x.finishedAt)
      .sort((x, y) => y.updatedAt.getTime() - x.updatedAt.getTime())[0];
    return a ? toAttempt(a) : null;
  },

  createAttempt(slug: string, questionKeys: string[], isRetake: boolean): string {
    const id = String(db().nextId++);
    const now = new Date();
    db().attempts.push({
      id,
      slug,
      questionKeys,
      isRetake,
      startedAt: now,
      updatedAt: now,
      finishedAt: null,
      answers: {},
    });
    return id;
  },

  recordAnswer(attemptId: string, key: string, choice: string, correct: boolean, seconds: number) {
    const a = openAttemptHas(attemptId, key);
    if (!a) return false;
    const prev = a.answers[key];
    if (!prev?.choice) {
      a.answers[key] = {
        choice,
        correct,
        flagged: prev?.flagged ?? false,
        seconds,
        answeredAt: new Date(),
      };
    }
    a.updatedAt = new Date();
    return true;
  },

  recordFlag(attemptId: string, key: string, flagged: boolean) {
    const a = openAttemptHas(attemptId, key);
    if (!a) return false;
    const prev = a.answers[key];
    a.answers[key] = prev
      ? { ...prev, flagged }
      : { choice: null, correct: null, flagged, seconds: 0, answeredAt: null };
    return true;
  },

  finishAttempt(attemptId: string) {
    const a = find(attemptId);
    if (!a) return false;
    a.finishedAt ??= new Date();
    a.updatedAt = new Date();
    return true;
  },

  listAttempts(): AttemptSummary[] {
    return [...db().attempts]
      .sort((x, y) => y.updatedAt.getTime() - x.updatedAt.getTime())
      .map((a) => {
        const answers = Object.values(a.answers);
        return {
          id: a.id,
          slug: a.slug,
          total: a.questionKeys.length,
          isRetake: a.isRetake,
          startedAt: a.startedAt,
          updatedAt: a.updatedAt,
          finishedAt: a.finishedAt,
          answered: answers.filter((x) => x.choice).length,
          correct: answers.filter((x) => x.correct).length,
          flagged: answers.filter((x) => x.flagged).length,
          seconds: answers.reduce((n, x) => n + x.seconds, 0),
        };
      });
  },

  /** Answering today counts as a 1-day streak (no history to look back on). */
  dayStreak(): number {
    const today = new Date().toDateString();
    return db().attempts.some((a) =>
      Object.values(a.answers).some((x) => x.answeredAt?.toDateString() === today),
    )
      ? 1
      : 0;
  },
};
