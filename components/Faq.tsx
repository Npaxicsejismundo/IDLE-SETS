import { faqs } from "@/lib/content";
import { PlusIcon } from "./icons";
import { Container, Eyebrow } from "./ui";

export function Faq() {
  return (
    <section id="faq" className="border-t-[1.5px] border-line bg-paper">
      <Container className="flex flex-wrap gap-x-[72px] gap-y-10 py-28">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="font-display text-[clamp(44px,5vw,72px)] leading-[0.95] uppercase">
            Questions, answered.
          </h2>
        </div>

        <div className="flex min-w-0 flex-[2_1_560px] flex-col border-b-[1.5px] border-ink">
          {faqs.map((faq, i) => (
            <details
              key={faq.question}
              open={i === 0}
              className="group border-t-[1.5px] border-ink py-[22px]"
            >
              <summary className="flex items-center justify-between gap-4 text-[21px] font-bold">
                {faq.question}
                <PlusIcon className="flex-none transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="mt-3.5 max-w-[40em] text-[17px] text-body">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
