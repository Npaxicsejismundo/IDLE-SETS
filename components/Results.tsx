import { results } from "@/lib/content";
import { Container, Eyebrow } from "./ui";

export function Results() {
  return (
    <section id="results" className="bg-ink text-cream">
      <Container className="flex flex-col gap-14 py-28">
        <div className="flex max-w-[920px] flex-col gap-5">
          <Eyebrow className="text-orange">LEID 2026 · Official results</Eyebrow>
          <h2 className="font-display text-[clamp(46px,6vw,88px)] leading-[0.95] text-balance uppercase">
            One exam. Countless hours.{" "}
            <span className="text-orange">Incredible results.</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-stretch gap-8">
          <div className="flex min-w-0 flex-[1_1_523px] flex-col gap-[1.5px] self-start overflow-hidden rounded-3xl border-[1.5px] border-coal bg-coal">
            <div className="flex flex-none flex-col gap-2.5 bg-ink px-8 py-7">
              <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-ash">
                Overall passing rate
              </span>
              <strong className="font-display text-[clamp(72px,8vw,116px)] leading-[0.9] font-normal text-orange">
                {results.passingRate}
              </strong>
            </div>
            <div className="flex flex-wrap gap-[1.5px]">
              {results.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-[1_1_216px] flex-col gap-2 bg-ink px-7 pt-7 pb-[30px]"
                >
                  <strong className="font-display text-[60px] leading-none font-normal">
                    {stat.value}
                  </strong>
                  <span className="text-[16px] leading-[1.35] text-ash">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-3xl bg-orange p-9 text-ink">
            <h3 className="font-display text-[40px] leading-none uppercase">
              Our LEID 2026 topnotchers
            </h3>
            <ol className="flex flex-col">
              {results.topnotchers.map((t, i) => (
                <li
                  key={t.name}
                  className={`grid grid-cols-[92px_1fr] items-baseline gap-4 border-t-[1.5px] border-ink/30 py-[13px] ${
                    i === results.topnotchers.length - 1
                      ? "border-b-[1.5px]"
                      : ""
                  }`}
                >
                  <span className="font-display text-[28px] leading-none">
                    {t.rank}
                  </span>
                  <span className="text-[19px] font-semibold">{t.name}</span>
                </li>
              ))}
            </ol>
            <p className="text-[16px] font-medium">
              You proved that consistency, discipline, and hard work always pay
              off. We are so proud of you!
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
