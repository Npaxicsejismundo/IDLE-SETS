"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  finishSetAttempt,
  retakeSet,
  saveAnswer,
  saveFlag,
  startSetAttempt,
} from "@/app/members/actions";
import { AlertIcon, ArrowRightIcon, CloseIcon, FlagIcon, TimerIcon } from "@/components/icons";
import { formatDuration } from "@/lib/format";

export type PlayerQuestion = {
  key: string;
  number: number;
  text: string;
  choices: { id: string; text: string }[];
  answer: string;
  explanation: string;
};

type Saved = Record<
  string,
  { choice: string | null; correct: boolean | null; flagged: boolean; seconds: number }
>;

function spokenDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m} minute${m === 1 ? "" : "s"} ${s} second${s === 1 ? "" : "s"}`;
}

const MAX_MS_PER_QUESTION = 10 * 60 * 1000;

export function SetPlayer({
  slug,
  title,
  label,
  questions,
  attemptId: initialAttemptId,
  isRetake,
  saved,
}: {
  slug: string;
  title: string;
  label: string;
  questions: PlayerQuestion[];
  attemptId: string | null;
  isRetake: boolean;
  saved: Saved;
}) {
  const total = questions.length;
  const [picks, setPicks] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(saved)
        .filter(([, a]) => a.choice)
        .map(([key, a]) => [key, a.choice as string]),
    ),
  );
  const [flags, setFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(Object.entries(saved).map(([key, a]) => [key, a.flagged])),
  );
  const [index, setIndex] = useState(() => {
    const firstOpen = questions.findIndex((q) => !saved[q.key]?.choice);
    return firstOpen === -1 ? Math.max(0, total - 1) : firstOpen;
  });
  const [saveError, setSaveError] = useState(false);
  const [finishing, startFinishing] = useTransition();

  const question = questions[index];
  const picked = question ? picks[question.key] : undefined;
  const answeredCount = questions.filter((q) => picks[q.key]).length;
  const allAnswered = total > 0 && answeredCount === total;
  const flagCount = questions.filter((q) => flags[q.key]).length;

  // ── Saving ───────────────────────────────────────────────────────────────
  // Saves run one after another so the run is created once, before answers.
  const attemptRef = useRef(initialAttemptId);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const failed = useRef<(() => Promise<void>)[]>([]);

  const ensureAttempt = async (): Promise<string> => {
    if (attemptRef.current) return attemptRef.current;
    const started = await startSetAttempt(slug);
    if (!started) throw new Error("Couldn't start the set.");
    attemptRef.current = started.attemptId;
    return started.attemptId;
  };

  const enqueue = (job: () => Promise<void>) => {
    queue.current = queue.current.then(async () => {
      try {
        await job();
      } catch {
        failed.current.push(job);
        setSaveError(true);
      }
    });
  };

  const retrySaves = () => {
    const jobs = failed.current;
    failed.current = [];
    setSaveError(false);
    jobs.forEach(enqueue);
  };

  // ── Timer: counts time on the current question while the page is visible ──
  const [baseSeconds, setBaseSeconds] = useState(() =>
    Object.values(saved).reduce((n, a) => n + (a.seconds || 0), 0),
  );
  const [questionMs, setQuestionMs] = useState(0);
  const running = Boolean(question) && !picked;
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const onVisible = () => {
      last = Date.now();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        const step = Math.min(now - last, 5000);
        setQuestionMs((ms) => Math.min(MAX_MS_PER_QUESTION, ms + step));
      }
      last = now;
    }, 1000);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [running, index]);
  const elapsed = baseSeconds + Math.floor(questionMs / 1000);

  // ── Actions ──────────────────────────────────────────────────────────────
  const pick = (choiceId: string) => {
    if (!question || picks[question.key]) return;
    const key = question.key;
    const seconds = Math.round(questionMs / 1000);
    setBaseSeconds((b) => b + seconds);
    setQuestionMs(0);
    setPicks((prev) => ({ ...prev, [key]: choiceId }));
    enqueue(async () => {
      const attemptId = await ensureAttempt();
      const result = await saveAnswer({ slug, attemptId, key, choice: choiceId, seconds });
      if (!result.ok) throw new Error("Not saved");
    });
  };

  const toggleFlag = () => {
    if (!question) return;
    const key = question.key;
    const flagged = !flags[key];
    setFlags((prev) => ({ ...prev, [key]: flagged }));
    enqueue(async () => {
      const attemptId = await ensureAttempt();
      const result = await saveFlag({ attemptId, key, flagged });
      if (!result.ok) throw new Error("Not saved");
    });
  };

  const headingRef = useRef<HTMLParagraphElement>(null);
  const goTo = (next: number) => {
    setQuestionMs(0);
    setIndex(next);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  const next = () => {
    if (!picked) return;
    const after = questions.findIndex((q, i) => i > index && !picks[q.key]);
    const before = questions.findIndex((q) => !picks[q.key]);
    const target = after !== -1 ? after : before;
    if (target !== -1) goTo(target);
  };

  const finish = () => {
    startFinishing(async () => {
      await queue.current;
      if (failed.current.length > 0 || !attemptRef.current) {
        setSaveError(true);
        return;
      }
      await finishSetAttempt(attemptRef.current);
    });
  };

  // Keyboard: A–F (or 1–6) to answer, Enter for the next question.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !question || finishing) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const key = e.key.toLowerCase();
      const byNumber = /^[1-6]$/.test(key) ? question.choices[Number(key) - 1]?.id : undefined;
      const choice = question.choices.find((c) => c.id === key)?.id ?? byNumber;
      if (choice && !picked) {
        e.preventDefault();
        pick(choice);
      } else if (key === "enter" && picked && !target?.closest("button, a")) {
        e.preventDefault();
        if (allAnswered) finish();
        else next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Render ───────────────────────────────────────────────────────────────
  const header = (
    <div className="flex h-11 items-center justify-between gap-3">
      <Link
        href="/members"
        aria-label="Exit set (your progress is saved)"
        className="flex size-11 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-paper hover:bg-white"
      >
        <CloseIcon size={18} />
      </Link>
      <div className="flex min-w-0 flex-col items-center text-center leading-tight">
        <span className="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
          {label}
          {isRetake ? " · Retake" : ""}
        </span>
        <span className="line-clamp-2 text-[15px] font-extrabold">{title}</span>
      </div>
      <span
        role="timer"
        aria-label={`Time spent ${spokenDuration(elapsed)}`}
        className="flex h-9 flex-none items-center gap-1.5 rounded-full bg-ink px-3 text-[14px] font-bold text-white tabular-nums"
      >
        <TimerIcon size={16} />
        {formatDuration(elapsed)}
      </span>
    </div>
  );

  if (!question) {
    return (
      <div className="min-h-svh bg-cream">
        <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-5 pt-[max(16px,env(safe-area-inset-top))] md:pt-6">
          {header}
          <div className="flex flex-col gap-4 rounded-[20px] border-[1.5px] border-ink bg-paper p-5">
            <p className="text-[18px] font-bold">The questions in this run have changed since you started it.</p>
            <form action={retakeSet}>
              <input type="hidden" name="slug" value={slug} />
              <button
                type="submit"
                className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-full bg-ink text-[16px] font-bold text-white hover:bg-coal"
              >
                Start the set again
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const answerChoice = question.choices.find((c) => c.id === question.answer);
  const right = picked === question.answer;
  const flagged = Boolean(flags[question.key]);
  const progress = (answeredCount / total) * 100;

  return (
    <div className="min-h-svh bg-cream pb-[calc(96px+env(safe-area-inset-bottom))]">
      <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-5 pt-[max(16px,env(safe-area-inset-top))] md:pt-6">
        {header}

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] font-bold">
            <span>
              Question {index + 1} of {total}
            </span>
            <span className="text-muted">{flagCount} flagged</span>
          </div>
          <div
            role="progressbar"
            aria-label="Questions answered"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={total}
            className="h-2 overflow-hidden rounded-full bg-track"
          >
            <div className="h-full rounded-full bg-orange transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[20px] border-[1.5px] border-ink bg-paper p-5">
          <span className="font-display text-[18px] leading-none text-flame">Q{question.number}</span>
          <p
            ref={headingRef}
            tabIndex={-1}
            className="text-[20px] leading-[1.35] font-bold text-pretty outline-none"
          >
            {question.text}
          </p>
        </div>

        <div role="group" aria-label="Answer choices" className="flex flex-col gap-2">
          {question.choices.map((choice) => {
            const isAnswer = choice.id === question.answer;
            const isPicked = choice.id === picked;
            let tone = "border-line-strong bg-paper";
            let dot = "bg-paper text-ink";
            let tag = "";
            if (picked) {
              if (isAnswer) {
                tone = "border-ink bg-orange";
                dot = "bg-ink text-white";
                tag = isPicked ? "Correct" : "Answer";
              } else if (isPicked) {
                tone = "border-ink bg-sand";
                dot = "bg-ink text-white";
                tag = "Your pick";
              } else {
                tone = "border-line-strong bg-paper text-ink/70";
              }
            }
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => pick(choice.id)}
                aria-disabled={picked ? true : undefined}
                aria-pressed={isPicked}
                className={`flex min-h-[54px] w-full items-center gap-3 rounded-[28px] border-[1.5px] px-3.5 py-2 text-left text-[16px] font-semibold ${tone} ${
                  picked ? "cursor-default" : "cursor-pointer hover:border-ink"
                }`}
              >
                <span
                  className={`flex size-[30px] flex-none items-center justify-center rounded-full border-[1.5px] border-ink text-[13px] font-extrabold ${dot}`}
                >
                  {choice.id.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">{choice.text}</span>
                {tag && (
                  <span className="flex-none text-[11px] font-extrabold tracking-[0.08em] uppercase">
                    {tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          {!picked ? (
            <p className="px-1.5 py-1 text-[14px] text-muted">
              Answer from memory first. Your pick locks in, then you&apos;ll see why.
            </p>
          ) : (
            <div className="flex flex-col gap-1 rounded-2xl bg-ink px-4 py-3.5 text-cream">
              <strong className={`text-[15px] ${right ? "text-orange" : "text-cream"}`}>
                {right ? "Correct." : "Not quite."}
              </strong>
              <p className="text-[14px] leading-[1.45] whitespace-pre-line text-mist">
                {question.explanation ||
                  (right
                    ? "Nice recall."
                    : `The answer is ${question.answer.toUpperCase()}. ${answerChoice?.text ?? ""}`)}
              </p>
            </div>
          )}
        </div>

        {saveError && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-rust bg-paper px-4 py-3 text-[14px]"
          >
            <AlertIcon size={18} className="flex-none text-rust" />
            <span className="min-w-0 flex-1 font-semibold">
              Your last answer didn&apos;t save. Check your connection, then try again.
            </span>
            <button
              type="button"
              onClick={retrySaves}
              className="h-9 cursor-pointer rounded-full border-[1.5px] border-ink px-4 font-bold hover:bg-white"
            >
              Try again
            </button>
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-line-strong bg-cream">
        <div className="mx-auto flex max-w-[680px] gap-2.5 px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={toggleFlag}
            aria-pressed={flagged}
            className={`flex h-[52px] flex-none cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-ink px-[18px] text-[15px] font-bold ${
              flagged ? "bg-orange" : "bg-paper hover:bg-white"
            }`}
          >
            <FlagIcon size={18} />
            {flagged ? "Flagged" : "Flag"}
          </button>
          {allAnswered && picked ? (
            <button
              type="button"
              onClick={finish}
              disabled={finishing}
              className="flex h-[52px] flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-full border-[1.5px] border-ink bg-orange text-[16px] font-extrabold text-ink hover:bg-flame disabled:cursor-wait"
            >
              {finishing ? "Saving…" : "Finish and see results"}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              aria-disabled={!picked || undefined}
              className={`flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-full text-[16px] font-bold ${
                picked ? "cursor-pointer bg-ink text-white hover:bg-coal" : "cursor-not-allowed bg-line-strong text-muted"
              }`}
            >
              Next question
              <ArrowRightIcon size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
