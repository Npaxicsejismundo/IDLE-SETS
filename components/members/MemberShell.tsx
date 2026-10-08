import Link from "next/link";
import type { ReactNode } from "react";
import { HomeIcon, LayersIcon, RepeatIcon, UserIcon } from "@/components/icons";
import { LogoBadge } from "@/components/ui";
import type { Member } from "@/lib/member-auth";
import { PREVIEW_MEMBER_ID } from "@/lib/preview";

export type MemberTab = "home" | "sets" | "review" | "profile";

const TABS: { key: MemberTab; href: string; label: string; icon: typeof HomeIcon }[] = [
  { key: "home", href: "/members", label: "Home", icon: HomeIcon },
  { key: "sets", href: "/members/sets", label: "Sets", icon: LayersIcon },
  { key: "review", href: "/members/review", label: "Review", icon: RepeatIcon },
  { key: "profile", href: "/members/profile", label: "Profile", icon: UserIcon },
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.slice(0, 2);
  return (letters ?? "").toUpperCase();
}

/** Page frame for the members area: top bar, content column and tab bar. */
export function MemberShell({
  member,
  active,
  children,
}: {
  member: Member;
  active: MemberTab;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-cream pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-16">
      {member.id === PREVIEW_MEMBER_ID && (
        <p className="bg-ink px-5 py-2 text-center text-[13px] font-semibold text-cream">
          Preview mode: only on your computer. Answers are kept until you restart{" "}
          <code className="font-bold text-orange">npm run dev</code>.
        </p>
      )}
      <header className="mx-auto flex max-w-[680px] items-center justify-between gap-4 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-2 md:pt-6">
        <Link href="/members" className="flex items-center gap-2.5" aria-label="IDLE Sets members home">
          <LogoBadge size="sm" />
          <span className="text-[13px] font-extrabold tracking-[0.1em]">IDLE SETS</span>
        </Link>
        <nav aria-label="Members" className="hidden items-center gap-1 md:flex">
          {TABS.slice(0, 3).map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={tab.key === active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-[14px] font-bold ${
                tab.key === active ? "bg-ink text-white hover:text-white" : "text-inactive hover:text-rust"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/members/profile"
          aria-label="Profile"
          aria-current={active === "profile" ? "page" : undefined}
          className="flex size-11 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-orange text-[14px] font-extrabold text-ink hover:bg-flame hover:text-ink"
        >
          {initials(member.fullName)}
        </Link>
      </header>

      <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-5 pt-3">{children}</main>

      <nav
        aria-label="Members"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-[1.5px] border-line-strong bg-paper px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
      >
        {TABS.map((tab) => {
          const current = tab.key === active;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] ${
                current ? "font-extrabold text-ink" : "font-semibold text-inactive"
              }`}
            >
              <Icon size={24} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Thin progress bar. value is 0–100. */
export function ProgressBar({
  value,
  label,
  tone = "ink",
  className = "h-2",
  trackClassName = "bg-track",
}: {
  value: number;
  label?: string;
  tone?: "ink" | "orange" | "flame";
  className?: string;
  trackClassName?: string;
}) {
  const fill = { ink: "bg-ink", orange: "bg-orange", flame: "bg-flame" }[tone];
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-valuenow={label ? Math.round(width) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-hidden={label ? undefined : true}
      className={`overflow-hidden rounded-full ${trackClassName} ${className}`}
    >
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${width}%` }} />
    </div>
  );
}
