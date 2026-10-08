import type { Metadata } from "next";
import Link from "next/link";
import { AlertIcon, ArrowUpRightIcon, ChevronRightIcon } from "@/components/icons";
import { MemberShell } from "@/components/members/MemberShell";
import { requireMember } from "@/lib/member-auth";
import { memberOverview, type SetStatus } from "@/lib/member-overview";
import { loadAllSets } from "@/lib/set-questions";

export const metadata: Metadata = { title: "Sets" };

export default async function SetsPage() {
  const member = await requireMember();
  const overview = await memberOverview(member.id);
  const hasForms = overview.sets.some((s) => s.mode === "form");

  // While you work on the site (npm run dev), show problems in the CSV files.
  const problems =
    process.env.NODE_ENV === "development"
      ? [...(await loadAllSets()).values()].filter((s) => s.problems.length > 0)
      : [];

  return (
    <MemberShell member={member} active="sets">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[40px] leading-none uppercase sm:text-[48px]">Your sets</h1>
        {hasForms && (
          <p className="text-[15px] text-muted">
            Sets marked <span className="font-bold text-ink">Google Form</span> open in a new tab.
          </p>
        )}
      </div>

      {problems.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-rust bg-paper p-4 text-[14px]">
          <p className="flex items-center gap-2 font-extrabold text-rust">
            <AlertIcon size={18} />
            Some questions were skipped (only you see this, on your computer)
          </p>
          {problems.map((set) => (
            <div key={set.slug}>
              <p className="font-bold">content/sets/{set.slug}.csv</p>
              <ul className="list-disc pl-5 text-body">
                {set.problems.slice(0, 10).map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
                {set.problems.length > 10 && <li>…and {set.problems.length - 10} more</li>}
              </ul>
            </div>
          ))}
        </div>
      )}

      {overview.subjects.map(({ subject, sets }) => (
        <section
          key={subject.id}
          id={subject.id}
          aria-labelledby={`${subject.id}-title`}
          className="flex scroll-mt-6 flex-col gap-2.5 pt-2"
        >
          <h2
            id={`${subject.id}-title`}
            className="text-[13px] font-extrabold tracking-[0.12em] text-rust uppercase"
          >
            {subject.title}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {sets.map((status) => (
              <li key={status.set.slug}>
                <SetRow status={status} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </MemberShell>
  );
}

function SetRow({ status }: { status: SetStatus }) {
  const { set, mode, open, best, questionCount } = status;
  const badge = set.number ? String(set.number).padStart(2, "0") : set.title[0];

  let meta: string;
  let end = <ChevronRightIcon size={20} className="flex-none" />;
  if (mode === "form") {
    meta = "Google Form";
    end = <ArrowUpRightIcon size={20} className="flex-none" />;
  } else if (mode === "soon") {
    meta = "Coming soon";
  } else if (open) {
    meta = `${open.answered} of ${open.total} answered${open.isRetake ? " · retake" : ""}`;
    end = (
      <span className="flex-none rounded-full border-[1.5px] border-ink bg-orange px-3 py-1 text-[12px] font-extrabold tracking-[0.06em] uppercase">
        Resume
      </span>
    );
  } else if (best) {
    meta = `${questions(questionCount)} · best ${best.correct}/${best.total}`;
  } else {
    meta = questions(questionCount);
  }

  const body = (
    <>
      <span
        aria-hidden="true"
        className={`flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-ink font-display text-[16px] ${
          best ? "bg-ink text-white" : "bg-paper"
        }`}
      >
        {badge}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] leading-snug font-bold">{set.title}</span>
        <span className="text-[12px] text-muted">{meta}</span>
      </span>
      {end}
    </>
  );

  const row =
    "flex min-h-[64px] items-center gap-3 rounded-2xl border-[1.5px] border-line-strong bg-paper px-3.5 py-2.5 hover:border-ink";

  if (mode === "form") {
    return (
      <a href={set.formUrl} target="_blank" rel="noopener noreferrer" className={row}>
        {body}
        <span className="sr-only">(Google Form, opens in a new tab)</span>
      </a>
    );
  }
  if (mode === "soon") {
    return <div className={`${row} opacity-60 hover:border-line-strong`}>{body}</div>;
  }
  return (
    <Link href={`/members/sets/${set.slug}`} prefetch={false} className={row}>
      {body}
    </Link>
  );
}

function questions(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}
