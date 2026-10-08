import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";
import { LogoBadge } from "@/components/ui";
import { getMember, membersConfigured } from "@/lib/member-auth";
import { previewAllowed } from "@/lib/preview";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { previewSignIn } from "../actions";
import { MemberLoginForm } from "./MemberLoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function MemberLoginPage(props: PageProps<"/members/login">) {
  if (await getMember()) redirect("/members");
  const searchParams = await props.searchParams;
  const email = typeof searchParams.email === "string" ? searchParams.email.slice(0, 254) : "";

  return (
    <div className="relative min-h-svh overflow-hidden bg-cream">
      <div aria-hidden="true" className="sheet fade-l absolute top-0 right-0 h-[520px] w-3/5" />
      <div className="relative mx-auto flex max-w-[460px] flex-col gap-7 px-5 pt-[max(20px,env(safe-area-inset-top))] pb-16">
        <Link href="/" className="flex items-center gap-2.5 self-start" aria-label="IDLE Sets home">
          <LogoBadge size="md" />
          <span className="text-[14px] font-extrabold tracking-[0.1em]">IDLE SETS</span>
        </Link>

        <div className="flex flex-col gap-3 pt-4">
          <p className="flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em] text-rust uppercase">
            <span aria-hidden="true" className="size-[15px] flex-none rounded-full border-[1.5px] border-ink bg-orange" />
            Members
          </p>
          <h1 className="font-display text-[clamp(52px,14vw,72px)] leading-[0.92] uppercase">
            Open your <span className="text-flame">sets</span>.
          </h1>
          <p className="text-[16px] leading-[1.55] text-body">
            Sign in with the email you registered with and the access code we sent you.
          </p>
        </div>

        <div className="rounded-3xl border-[1.5px] border-ink bg-paper p-6 shadow-[0_30px_60px_-30px_rgba(22,20,18,0.45)]">
          {membersConfigured() ? (
            <MemberLoginForm defaultEmail={email} />
          ) : (
            <p className="text-[16px] leading-[1.6] text-body">
              Member sign-in isn&apos;t set up yet: the site needs its database (
              <code className="font-bold">DATABASE_URL</code>). See the README.
            </p>
          )}
        </div>

        {previewAllowed() && (
          <form
            action={previewSignIn}
            className="flex flex-col gap-3 rounded-3xl border-[1.5px] border-dashed border-ink bg-orange/15 p-5"
          >
            <p className="text-[15px] leading-[1.5] text-body">
              <b className="text-ink">Only on your computer:</b> look around the members area as a
              sample member. No registration or database needed. Your answers are kept only until
              you restart <code className="font-bold">npm run dev</code>.
            </p>
            <button
              type="submit"
              className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-orange text-[16px] font-extrabold hover:bg-flame"
            >
              Preview the members area
              <ArrowRightIcon size={18} />
            </button>
          </form>
        )}

        <div className="flex flex-col gap-3 text-[15px] text-muted">
          <p>
            No code yet? Codes are sent once your registration is processed.{" "}
            <a href={INSTAGRAM_URL} className="font-semibold text-ink underline underline-offset-2 hover:text-rust">
              Message us at {INSTAGRAM_HANDLE}
            </a>{" "}
            if it&apos;s taking a while.
          </p>
          <Link href="/subscribe" className="inline-flex items-center gap-2 self-start font-bold text-ink hover:text-rust">
            Not a member yet? Be a member
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
