import "server-only";
import { dayStreak, listAttempts, type AttemptSummary } from "./progress";
import { loadAllSets, playable } from "./set-questions";
import { SETS, SUBJECTS, type SetInfo, type Subject } from "./sets";

// Everything the Home, Sets and Review pages show about a member's progress.

export type SetStatus = {
  set: SetInfo;
  /** "site": answered here. "form": opens the Google Form. "soon": neither yet. */
  mode: "site" | "form" | "soon";
  questionCount: number;
  /** Unfinished run, if any. */
  open?: AttemptSummary;
  /** Best finished full run. */
  best?: AttemptSummary;
  /** Every finished run (full or retake), newest first. */
  finished: AttemptSummary[];
  answered: number;
  correct: number;
};

export type SubjectStatus = {
  subject: Subject;
  sets: SetStatus[];
  answered: number;
  correct: number;
};

export type Overview = {
  sets: SetStatus[];
  subjects: SubjectStatus[];
  attempts: AttemptSummary[];
  /** Share of answers that were right, 0–100, or null before any answers. */
  accuracy: number | null;
  setsFinished: number;
  streak: number;
  /** The set to show in the big card on Home. */
  next?: { status: SetStatus; kind: "continue" | "start" | "retake" };
  /** How many sets are answered in the site (not Google Forms). */
  playableCount: number;
};

export function percent(correct: number, answered: number): number | null {
  return answered > 0 ? Math.round((correct / answered) * 100) : null;
}

export async function memberOverview(memberId: string): Promise<Overview> {
  const [loaded, attempts, streak] = await Promise.all([
    loadAllSets(),
    listAttempts(memberId),
    dayStreak(memberId),
  ]);

  const sets: SetStatus[] = SETS.map((set) => {
    const questions = loaded.get(set.slug);
    const mine = attempts.filter((a) => a.slug === set.slug);
    const finished = mine.filter((a) => a.finishedAt);
    const best = finished
      .filter((a) => !a.isRetake)
      .reduce<AttemptSummary | undefined>(
        (top, a) => (!top || a.correct / a.total > top.correct / top.total ? a : top),
        undefined,
      );
    return {
      set,
      mode: playable(questions) ? "site" : set.formUrl ? "form" : "soon",
      questionCount: questions?.questions.length ?? 0,
      open: mine.find((a) => !a.finishedAt),
      best,
      finished,
      answered: mine.reduce((n, a) => n + a.answered, 0),
      correct: mine.reduce((n, a) => n + a.correct, 0),
    };
  });

  const subjects: SubjectStatus[] = SUBJECTS.map((subject) => {
    const own = sets.filter((s) => s.set.subject === subject.id);
    return {
      subject,
      sets: own,
      answered: own.reduce((n, s) => n + s.answered, 0),
      correct: own.reduce((n, s) => n + s.correct, 0),
    };
  }).filter((s) => s.sets.length > 0);

  const answered = attempts.reduce((n, a) => n + a.answered, 0);
  const correct = attempts.reduce((n, a) => n + a.correct, 0);

  const playableSets = sets.filter((s) => s.mode === "site");
  const latestOpen = attempts.find(
    (a) => !a.finishedAt && playableSets.some((s) => s.set.slug === a.slug),
  );
  let next: Overview["next"];
  if (latestOpen) {
    next = { status: playableSets.find((s) => s.set.slug === latestOpen.slug)!, kind: "continue" };
  } else {
    const untouched = playableSets.find((s) => s.finished.length === 0);
    if (untouched) next = { status: untouched, kind: "start" };
    else if (playableSets.length) {
      // Everything's done: suggest the weakest set.
      const weakest = [...playableSets].sort(
        (a, b) => (percent(a.correct, a.answered) ?? 0) - (percent(b.correct, b.answered) ?? 0),
      )[0];
      next = { status: weakest, kind: "retake" };
    }
  }

  return {
    sets,
    subjects,
    attempts,
    accuracy: percent(correct, answered),
    setsFinished: sets.filter((s) => s.finished.some((a) => !a.isRetake)).length,
    streak,
    next,
    playableCount: playableSets.length,
  };
}
