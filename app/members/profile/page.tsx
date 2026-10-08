import type { Metadata } from "next";
import { ArrowUpRightIcon } from "@/components/icons";
import { MemberShell, initials } from "@/components/members/MemberShell";
import { MAX_MEMBER_DEVICES } from "@/lib/content";
import { requireMember } from "@/lib/member-auth";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const member = await requireMember();
  return (
    <MemberShell member={member} active="profile">
      <h1 className="font-display text-[40px] leading-none uppercase sm:text-[48px]">Profile</h1>

      <section className="flex items-center gap-4 rounded-[20px] border-[1.5px] border-ink bg-paper p-5">
        <span
          aria-hidden="true"
          className="flex size-16 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-orange text-[22px] font-extrabold"
        >
          {initials(member.fullName)}
        </span>
        <div className="flex min-w-0 flex-col">
          <p className="text-[19px] font-extrabold break-words">{member.fullName}</p>
          <p className="text-[15px] break-all text-body">{member.email}</p>
          <p className="text-[14px] break-words text-muted">{member.school}</p>
        </div>
      </section>

      <section className="flex flex-col gap-1 text-[15px] leading-[1.55] text-body">
        <p>
          Your membership is personal. You can stay signed in on up to {MAX_MEMBER_DEVICES} devices;
          signing in on another one signs out the oldest.
        </p>
        <p>
          Lost your access code or need help?{" "}
          <a
            href={INSTAGRAM_URL}
            className="inline-flex items-center gap-1 font-semibold text-ink underline underline-offset-2 hover:text-rust"
          >
            Message us on Instagram at {INSTAGRAM_HANDLE}
            <ArrowUpRightIcon size={14} />
          </a>
        </p>
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ink bg-paper text-[16px] font-bold hover:bg-white sm:w-auto sm:px-8"
        >
          Sign out
        </button>
      </form>
    </MemberShell>
  );
}
