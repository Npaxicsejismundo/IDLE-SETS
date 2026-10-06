import { heroStats } from "@/lib/content";
import { ArrowRightIcon } from "./icons";
import { QuizCard } from "./QuizCard";
import { Container, OneTimePill } from "./ui";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-t-[1.5px] border-line"
    >
      <div
        aria-hidden="true"
        className="sheet fade-l absolute inset-y-0 right-0 w-3/5"
      />
      <Container className="relative flex flex-wrap items-center gap-16 pt-[72px] pb-24">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-7">
          <p className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.14em] text-rust">
            <span
              aria-hidden="true"
              className="size-[15px] flex-none rounded-full border-[1.5px] border-ink bg-orange"
            />
            Interior Design board exam reviewer · LEID 2027
          </p>
          <h1 className="font-display text-[clamp(60px,8.4vw,128px)] leading-[0.92] tracking-[-0.005em] text-balance uppercase">
            Train for <span className="text-flame">board-level</span> thinking.
          </h1>
          <p className="max-w-[34em] text-[20px] leading-normal text-pretty text-body">
            Structured reviewer sets for the Licensure Examination for Interior
            Designers — tests and questionnaires built to sharpen your recall,
            accuracy, and readiness before board day.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
            <a
              href="#join"
              className="inline-flex h-[58px] items-center gap-3 rounded-full bg-ink px-[30px] text-[17px] font-bold text-white hover:bg-coal"
            >
              Be a member now
              <ArrowRightIcon size={20} />
            </a>
            <OneTimePill size="lg" />
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-4 border-t-[1.5px] border-line-strong pt-6">
            {heroStats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <strong className="font-display text-[40px] leading-[1.05] font-normal">
                  {stat.value}
                </strong>
                <span className="text-[15px] text-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_400px] justify-center">
          <QuizCard />
        </div>
      </Container>
    </section>
  );
}
