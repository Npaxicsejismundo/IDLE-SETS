import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronDownIcon, CloseIcon, RepeatIcon } from "@/components/icons";
import { retakeMissed } from "@/app/members/actions";
import { formatDuration } from "@/lib/format";
import { requireMember } from "@/lib/member-auth";
import { getAttempt } from "@/lib/progress";
import { loadSet, type Question } from "@/lib/set-questions";
import { findSet, setLabel } from "@/lib/sets";

export const metadata: Metadata = { title: "Results" };

type Row = {
  question: Question;
  choice: string | null;
  correct: boolean;
  flagged: boolean;
  seconds: number;
};

export default async function ResultsPage(props: PageProps<"/members/results/[id]">) {
  const member = await requireMember();
  const { id } = await props.params;
  const attempt = await getAttempt(member.id, id);
  if (!attempt) notFound();
  if (!attempt.finishedAt) redirect(`/members/sets/${attempt.slug}?attempt=${attempt.id}`);
  const set = findSet(attempt.slug);
  const loaded = await loadSet(attempt.slug);
  if (!set || !loaded) notFound();

  const byKey = new Map(loaded.questions.map((q) => [q.key, q]));
  const rows: Row[] = attempt.questionKeys.flatMap((key) => {
    const question = byKey.get(key);
    if (!question) return [];
    const saved = attempt.answers[key];
    return [
      {
        question,
        choice: saved?.choice ?? null,
        correct: saved?.correct === true,
        flagged: saved?.flagged ?? false,
        seconds: saved?.seconds ?? 0,
      },
    ];
  });

  const total = rows.length;
  const correct = rows.filter((r) => r.correct).length;
  const missed = rows.filter((r) => !r.correct);
  const flaggedRight = rows.filter((r) => r.flagged && r.correct);
  const flagged = rows.filter((r) => r.flagged).length;
  const seconds = rows.reduce((n, r) => n + r.seconds, 0);
  const answered = rows.filter((r) => r.choice).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="min-h-svh bg-cream pb-[calc(140px+env(safe-area-inset-bottom))]">
      <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-5 pt-[max(16px,env(safe-area-inset-top))] md:pt-6">
        <div className="flex h-11 items-center justify-between gap-3">
          <Link
            href="/members"
            aria-label="Close results"
            className="flex size-11 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-paper hover:bg-white"
          >
            <CloseIcon size={18} />
          </Link>
          <div className="flex min-w-0 flex-col items-center text-center leading-tight">
            <span className="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
              {setLabel(set)}
              {attempt.isRetake ? " · Retake" : ""}
            </span>
            <span className="line-clamp-2 text-[15px] font-extrabold">{set.title}</span>
          </div>
          <span aria-hidden="true" className="w-11 flex-none" />
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-extrabold tracking-[0.14em] text-rust uppercase">
              {attempt.isRetake ? "Retake complete" : "Set complete"}
            </span>
            <h1 className="flex items-baseline gap-1 font-display leading-none font-normal">
              <span className="text-[84px]">{correct}</span>
              <span className="text-[36px] text-muted">/{total}</span>
              <span className="sr-only"> correct</span>
            </h1>
          </div>
          <div className="mb-2.5 flex flex-col items-end rounded-2xl border-[1.5px] border-ink bg-orange px-3.5 py-2.5 leading-[1.1]">
            <strong className="font-display text-[28px] font-normal">{accuracy}%</strong>
            <span className="text-[11px] font-extrabold tracking-[0.06em] uppercase">Recall accuracy</span>
          </div>
        </div>

        <section
          aria-labelledby="sheet-title"
          className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-ink bg-paper px-[18px] pt-4 pb-[18px]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="sheet-title" className="text-[13px] font-extrabold tracking-[0.08em] uppercase">
              Your answer sheet
            </h2>
            <div aria-hidden="true" className="flex items-center gap-3 text-[12px] font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full border-[1.5px] border-ink bg-orange" />
                Correct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full border-[1.5px] border-ink" />
                Missed
              </span>
            </div>
          </div>
          <div
            role="img"
            aria-label={`${correct} correct and ${total - correct} missed out of ${total} questions`}
            className="grid grid-cols-[repeat(10,24px)] justify-between gap-x-2 gap-y-[7px]"
          >
            {rows.map((r) => (
              <span
                key={r.question.key}
                className={`flex size-6 items-center justify-center rounded-full border-[1.5px] border-ink text-[8px] font-extrabold ${
                  r.correct ? "bg-orange" : "bg-paper"
                }`}
              >
                {r.correct ? "" : r.question.number}
              </span>
            ))}
          </div>
        </section>

        <section aria-label="Set stats" className="grid grid-cols-3 border-y-[1.5px] border-line-strong">
          <Stat value={formatDuration(seconds)} label="Total time" />
          <Stat
            value={answered ? `${Math.round(seconds / answered)}s` : "—"}
            label="Per question"
            divided
          />
          <Stat value={String(flagged)} label="Flagged" divided />
        </section>

        {missed.length > 0 ? (
          <QuestionList title="Review what you missed" rows={missed} />
        ) : (
          <p className="rounded-2xl border-[1.5px] border-ink bg-paper px-4 py-3.5 text-[15px] font-semibold">
            Perfect run. Every answer came from memory.
          </p>
        )}
        {flaggedRight.length > 0 && <QuestionList title="Flagged, but right" rows={flaggedRight} />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-cream">
        <div className="mx-auto flex max-w-[680px] flex-col gap-1 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <form action={retakeMissed}>
            <input type="hidden" name="attemptId" value={attempt.id} />
            <button
              type="submit"
              className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-ink text-[16px] font-bold text-white hover:bg-coal"
            >
              <RepeatIcon size={18} />
              {missed.length > 0
                ? `Retake the ${missed.length === 1 ? "1 question" : `${missed.length}`} you missed`
                : "Retake the whole set"}
            </button>
          </form>
          <Link href="/members" className="flex h-11 items-center justify-center text-[15px] font-bold">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, divided = false }: { value: string; label: string; divided?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 py-2.5 ${divided ? "border-l-[1.5px] border-line-strong pl-3.5" : ""}`}>
      <strong className="text-[18px] font-extrabold tabular-nums">{value}</strong>
      <span className="text-[12px] text-muted">{label}</span>
    </div>
  );
}

function QuestionList({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-extrabold">{title}</h2>
        <span className="text-[13px] font-bold text-rust">{rows.length}</span>
      </div>
      <ul className="flex flex-col">
        {rows.map((r) => {
          const answer = r.question.choices.find((c) => c.id === r.question.answer);
          const yours = r.question.choices.find((c) => c.id === r.choice);
          return (
            <li key={r.question.key} className="border-b-[1.5px] border-track">
              <details className="group">
                <summary className="flex min-h-[54px] items-center gap-3 py-2 hover:text-rust">
                  <span className="w-10 flex-none font-display text-[18px] text-flame">
                    Q{r.question.number}
                  </span>
                  <span className="line-clamp-2 min-w-0 flex-1 text-[15px] font-semibold group-open:line-clamp-none">
                    {r.question.text}
                  </span>
                  <ChevronDownIcon size={18} className="flex-none transition-transform group-open:rotate-180" />
                </summary>
                <div className="mb-3 ml-[52px] flex flex-col gap-2 text-[14px] leading-[1.45]">
                  {!r.correct && (
                    <p>
                      <span className="font-bold">Your answer: </span>
                      {yours ? `${yours.id.toUpperCase()}. ${yours.text}` : "Not answered"}
                    </p>
                  )}
                  <p>
                    <span className="font-bold">Answer: </span>
                    {answer ? `${answer.id.toUpperCase()}. ${answer.text}` : ""}
                  </p>
                  {r.question.explanation && (
                    <p className="whitespace-pre-line text-muted">{r.question.explanation}</p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
