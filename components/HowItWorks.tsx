import { steps } from "@/lib/content";
import { Container, Eyebrow } from "./ui";

export function HowItWorks() {
  return (
    <section id="how" className="border-y-[1.5px] border-line bg-paper">
      <Container className="flex flex-col gap-14 py-28">
        <div className="flex max-w-[820px] flex-col gap-5">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-display text-[clamp(44px,5.4vw,78px)] leading-[0.95] text-balance uppercase">
            Four steps. Then do it again.
          </h2>
        </div>

        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5">
          {steps.map((step, i) => (
            <li
              key={step.number}
              className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-paper p-7"
            >
              <div aria-hidden="true" className="flex gap-2">
                {steps.map((_, dot) => (
                  <span
                    key={dot}
                    className={`size-[22px] rounded-full border-[1.5px] border-ink ${
                      dot === i ? "bg-orange" : ""
                    }`}
                  />
                ))}
              </div>
              <span className="font-display text-[56px] leading-none text-flame">
                {step.number}
              </span>
              <h3 className="text-[22px] leading-[1.2] font-extrabold">
                {step.title}
              </h3>
              <p className="text-[16px] text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
