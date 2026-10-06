import { method } from "@/lib/content";
import { CheckCircleIcon, XCircleIcon } from "./icons";
import { Container, Eyebrow } from "./ui";

export function Method() {
  return (
    <section id="method" className="bg-cream">
      <Container className="flex flex-col gap-14 py-28">
        <div className="flex flex-wrap items-end gap-x-16 gap-y-6">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
            <Eyebrow>The method</Eyebrow>
            <h2 className="font-display text-[clamp(44px,5.4vw,78px)] leading-[0.95] text-balance uppercase">
              How you study matters more than how long you study.
            </h2>
          </div>
          <p className="min-w-0 flex-[1_1_380px] text-[19px] leading-[1.55] text-pretty text-body">
            Board exams ask you to retain large volumes of information across
            many subjects, often tested in unpredictable ways. Passive studying
            may feel productive, but it doesn&apos;t prepare your brain for real
            exam conditions.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-6">
          <div className="flex flex-col gap-6 rounded-3xl border-[1.5px] border-line-strong bg-paper p-9">
            <div className="flex flex-col gap-2.5">
              <span className="self-start rounded-full border-[1.5px] border-line-strong px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
                What it feels like
              </span>
              <h3 className="font-display text-[40px] leading-none text-muted uppercase">
                Passive studying
              </h3>
            </div>
            <ul className="flex flex-col gap-4 text-[18px]">
              {method.passive.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <XCircleIcon className="flex-none text-stone" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-auto border-t-[1.5px] border-line-soft pt-5 text-[17px] font-bold text-muted">
              Feels productive. Fades under pressure.
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-3xl bg-ink p-9 text-cream">
            <div className="flex flex-col gap-2.5">
              <span className="self-start rounded-full bg-orange px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-ink">
                The IDLE way
              </span>
              <h3 className="font-display text-[40px] leading-none uppercase">
                Active recall
              </h3>
            </div>
            <ul className="flex flex-col gap-4 text-[18px]">
              {method.active.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <CheckCircleIcon className="flex-none text-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-auto border-t-[1.5px] border-coal pt-5 text-[17px] font-bold text-orange">
              Builds recall, accuracy, and readiness.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
