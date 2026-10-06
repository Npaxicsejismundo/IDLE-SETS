import { affirmations } from "@/lib/content";
import { CheckIcon } from "./icons";
import { Container, Eyebrow } from "./ui";

export function Moment() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div
        aria-hidden="true"
        className="sheet absolute inset-0 opacity-80"
      />
      <Container className="relative flex flex-wrap items-center gap-x-[72px] gap-y-14 py-28">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <Eyebrow>To all Interior Design exam takers</Eyebrow>
          <h2 className="font-display text-[clamp(56px,7.2vw,108px)] leading-[0.92] uppercase">
            This is <span className="text-flame">your</span> moment.
          </h2>
          <p className="max-w-[32em] text-[19px] leading-[1.6] text-pretty text-body">
            All the late nights, the sketches, the revisions, the doubts, and
            the comebacks — they led you here. Trust your process. Stay calm.
            Think clearly. Design with confidence.
          </p>
          <div className="flex -rotate-2 flex-col gap-0.5 self-start">
            <span className="font-hand text-[34px] leading-[1.1] font-semibold text-ink">
              You&apos;ve got the vision now — show the world.
            </span>
            <svg
              aria-hidden="true"
              width="260"
              height="14"
              viewBox="0 0 260 14"
              className="max-w-full self-end text-flame"
            >
              <path
                d="M2 9 C 60 2, 120 13, 180 6 S 240 4, 258 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_340px] justify-center">
          <div className="relative w-full max-w-[380px] rotate-2 rounded-md border-[1.5px] border-line-strong bg-paper px-9 pt-11 pb-9 shadow-[0_24px_40px_-24px_rgba(22,20,18,0.4)]">
            <span
              aria-hidden="true"
              className="absolute -top-3.5 left-1/2 -ml-[60px] h-7 w-[120px] -rotate-3 bg-orange/55"
            />
            <ul className="flex flex-col gap-[18px] text-[18px] font-extrabold tracking-[0.04em] uppercase">
              {affirmations.map((line) => (
                <li key={line} className="flex items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className="flex size-7 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-orange text-ink"
                  >
                    <CheckIcon size={16} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-7 border-t-[1.5px] border-dashed border-line-strong pt-5 text-[16px] font-extrabold tracking-[0.04em] text-rust uppercase">
              You are going to make us proud.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
