import { membershipPerks } from "@/lib/content";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { ChatIcon, CheckIcon } from "./icons";
import { Container, OneTimePill } from "./ui";

export function Join() {
  return (
    <section id="join" className="bg-orange text-ink">
      <Container className="flex flex-wrap items-center gap-x-16 gap-y-12 py-28">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-7">
          <h2 className="font-display text-[clamp(72px,10vw,156px)] leading-[0.88] uppercase">
            Be a
            <br />
            member
            <br />
            now.
          </h2>
          <p className="max-w-[28em] text-[20px] leading-normal font-medium">
            Pay once, then review with IDLE Sets all the way to board day.
          </p>
        </div>

        <div className="flex min-w-0 max-w-[520px] flex-[1_1_400px] flex-col gap-6 rounded-[28px] border-2 border-ink bg-paper p-10 shadow-[10px_10px_0_var(--color-ink)] max-sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[15px] font-extrabold uppercase tracking-[0.08em]">
              IDLE Sets membership
            </span>
            <OneTimePill size="sm" />
          </div>

          <div className="flex flex-col gap-2">
            <strong className="font-display text-[52px] leading-[0.95] font-normal uppercase">
              One payment.
              <br />
              Full access.
            </strong>
            <span className="text-[15px] text-muted">
              No monthly fees. Message us for the current rate.
            </span>
          </div>

          <ul className="flex flex-col gap-3.5 border-t-[1.5px] border-line-soft pt-[22px] text-[17px]">
            {membershipPerks.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <CheckIcon size={22} className="mt-px flex-none text-rust" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <a
            href={INSTAGRAM_URL}
            className="flex h-[60px] items-center justify-center gap-3 rounded-full bg-ink text-[18px] font-bold text-white hover:bg-coal"
          >
            <ChatIcon size={22} />
            Message us to join
          </a>
          <p className="-mt-2 text-center text-[14px] text-muted">
            Send us a DM on Instagram at {INSTAGRAM_HANDLE}. We&apos;ll reply
            with payment options and your access details.
          </p>
        </div>
      </Container>
    </section>
  );
}
