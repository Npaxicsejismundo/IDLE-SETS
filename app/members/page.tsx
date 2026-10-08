import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { MemberShell, ProgressBar } from "@/components/members/MemberShell";
import { requireMember } from "@/lib/member-auth";
import { memberOverview, percent, type Overview } from "@/lib/member-overview";
import { setLabel } from "@/lib/sets";

export const metadata: Metadata = { title: "Home" };

/** Below this accuracy a subject is marked "needs work". */
const NEEDS_WORK_BELOW = 65;

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
}

export default async function MembersHome() {
  const member = await requireMember();
  const overview = await memberOverview(member.id);
  const returning = overview.attempts.length > 0;

  return (
    <MemberShell member={member} active="home">
      <div className="flex flex-col gap-1">
        <p className="text-[15px] text-muted">{greeting()}</p>
        <h1 className="font-display text-[40px] leading-none uppercase sm:text-[48px]">
          {returning ? "Keep going" : "Welcome"}, {member.firstName}.
        </h1>
      </div>

      <NextCard overview={overview} />

      <section aria-label="Your progress" className="grid grid-cols-3 gap-2.5">
        <Stat value={overview.accuracy === null ? "—" : `${overview.accuracy}%`} label="Recall accuracy" />
        <Stat value={String(overview.setsFinished)} label="Sets finished" />
        <Stat value={String(overview.streak)} label="Day streak" />
      </section>

      <section aria-labelledby="by-subject" className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <h2 id="by-subject" className="text-[17px] font-extrabold">
            Sets by subject
          </h2>
          <Link href="/members/sets" className="text-[13px] font-bold text-rust hover:text-flame">
            See all
          </Link>
        </div>
        <ul className="flex flex-col">
          {overview.subjects.map(({ subject, sets, answered, correct }) => {
            const accuracy = percent(correct, answered);
            const weak = accuracy !== null && accuracy < NEEDS_WORK_BELOW;
            const meta = [
              `${sets.length} ${sets.length === 1 ? "set" : "sets"}`,
              accuracy !== null ? `${accuracy}% accuracy` : null,
              weak ? "needs work" : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={subject.id} className="border-b-[1.5px] border-track">
                <Link
                  href={`/members/sets#${subject.id}`}
                  className="flex min-h-[60px] items-center gap-3 py-1.5"
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-ink font-display text-[17px] ${
                      weak ? "bg-orange" : "bg-paper"
                    }`}
                  >
                    {subject.short[0]}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] font-bold">{subject.short}</span>
                    <span className="text-[12px] text-muted">{meta}</span>
                  </span>
                  <ProgressBar
                    value={accuracy ?? 0}
                    tone={weak ? "flame" : "ink"}
                    className="h-1.5 w-16 flex-none"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </MemberShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border-[1.5px] border-line-strong bg-paper px-3.5 py-3">
      <strong className="font-display text-[28px] leading-[1.1] font-normal">{value}</strong>
      <span className="text-[12px] leading-tight font-semibold text-muted">{label}</span>
    </div>
  );
}

function NextCard({ overview }: { overview: Overview }) {
  const next = overview.next;
  const card =
    "flex flex-col gap-3.5 rounded-[22px] border-[1.5px] border-ink bg-orange p-5";
  const pill =
    "rounded-full bg-ink px-2.5 py-[5px] text-[11px] font-extrabold tracking-[0.1em] text-white uppercase";
  const button =
    "flex h-[50px] items-center justify-center gap-2.5 rounded-full bg-ink text-[16px] font-bold text-white hover:bg-coal hover:text-white";

  if (!next) {
    const formSets = overview.sets.filter((s) => s.mode === "form").length;
    return (
      <section aria-label="Your sets" className={card}>
        <div className="flex items-center justify-between">
          <span className={pill}>Your sets</span>
          <span className="text-[13px] font-bold">{overview.subjects.length} subjects</span>
        </div>
        <h2 className="font-display text-[34px] leading-none uppercase">
          {formSets} sets ready
        </h2>
        <p className="text-[15px] leading-snug font-semibold">
          Pick a subject and answer from memory. Every set opens in a new tab.
        </p>
        <Link href="/members/sets" className={button}>
          Browse sets
          <ArrowRightIcon size={18} />
        </Link>
      </section>
    );
  }

  const { status, kind } = next;
  const open = status.open;
  const progress = open ? Math.round((open.answered / open.total) * 100) : 0;
  const pillText = { continue: "Continue", start: "Up next", retake: "Go again" }[kind];
  const buttonText = { continue: "Resume set", start: "Start set", retake: "Retake set" }[kind];
  const accuracy = percent(status.correct, status.answered);

  return (
    <section aria-label={kind === "continue" ? "Continue where you left off" : "Your next set"} className={card}>
      <div className="flex items-center justify-between gap-3">
        <span className={pill}>{pillText}</span>
        <span className="text-[13px] font-bold">{setLabel(status.set)}</span>
      </div>
      <h2 className="font-display text-[34px] leading-none text-balance uppercase">
        {status.set.title}
      </h2>
      {open ? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] font-bold">
            <span>
              {open.answered} of {open.total} answered
            </span>
            <span>{progress}%</span>
          </div>
          <ProgressBar
            value={progress}
            label="Set progress"
            trackClassName="bg-ink/20"
          />
        </div>
      ) : (
        <p className="text-[14px] font-bold">
          {status.questionCount} {status.questionCount === 1 ? "question" : "questions"}
          {kind === "retake" && accuracy !== null
            ? ` · ${accuracy}% accuracy${overview.playableCount > 1 ? ", your lowest" : ""}`
            : ""}
        </p>
      )}
      <Link href={`/members/sets/${status.set.slug}`} className={button}>
        {buttonText}
        <ArrowRightIcon size={18} />
      </Link>
    </section>
  );
}
