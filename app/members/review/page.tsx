import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ChevronRightIcon } from "@/components/icons";
import { MemberShell } from "@/components/members/MemberShell";
import { formatManila } from "@/lib/format";
import { requireMember } from "@/lib/member-auth";
import { memberOverview } from "@/lib/member-overview";
import { findSet, setLabel } from "@/lib/sets";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage() {
  const member = await requireMember();
  const overview = await memberOverview(member.id);
  // Only sets that are still answered in the site have a results page.
  const inSite = new Set(overview.sets.filter((s) => s.mode === "site").map((s) => s.set.slug));
  const finished = overview.attempts.filter((a) => a.finishedAt && inSite.has(a.slug));

  return (
    <MemberShell member={member} active="review">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[40px] leading-none uppercase sm:text-[48px]">Review</h1>
        <p className="text-[15px] text-muted">
          Every set you&apos;ve finished. Open one to see what you missed and retake it.
        </p>
      </div>

      {finished.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-[20px] border-[1.5px] border-dashed border-stone bg-paper p-5">
          <p className="text-[16px] font-semibold">
            Nothing to review yet. Finish a set and your results will show up here.
          </p>
          <Link
            href="/members/sets"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-bold text-white hover:bg-coal hover:text-white"
          >
            Go to your sets
            <ArrowRightIcon size={18} />
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {finished.map((a) => {
            const set = findSet(a.slug)!;
            const pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
            const missed = a.total - a.correct;
            return (
              <li key={a.id}>
                <Link
                  href={`/members/results/${a.id}`}
                  className="flex min-h-[68px] items-center gap-3 rounded-2xl border-[1.5px] border-line-strong bg-paper px-3.5 py-2.5 hover:border-ink"
                >
                  <span
                    className={`flex h-11 w-[58px] flex-none items-center justify-center rounded-full border-[1.5px] border-ink font-display text-[17px] ${
                      pct >= 75 ? "bg-orange" : "bg-paper"
                    }`}
                  >
                    {pct}%
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] leading-snug font-bold">{set.title}</span>
                    <span className="text-[12px] text-muted">
                      {setLabel(set)}
                      {a.isRetake ? " · retake" : ""} · {a.correct}/{a.total} ·{" "}
                      {missed === 0 ? "no misses" : `${missed} missed`} ·{" "}
                      {formatManila(a.finishedAt!, false)}
                    </span>
                  </span>
                  <ChevronRightIcon size={20} className="flex-none" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </MemberShell>
  );
}
