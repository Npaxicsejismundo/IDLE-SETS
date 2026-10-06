import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { ArrowUpRightIcon } from "./icons";
import { Container, LogoBadge } from "./ui";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream">
      <Container className="flex flex-col gap-14 pt-20 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="flex flex-wrap items-center gap-6">
            <LogoBadge size="lg" />
            <p className="max-w-[26em] text-[17px] leading-normal text-ash">
              IDLE Quiz Sets simulate board-level thinking to improve recall,
              accuracy, and readiness.
            </p>
          </div>
          <a
            href={INSTAGRAM_URL}
            className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-orange px-6 text-[16px] font-bold text-ink hover:bg-flame"
          >
            Follow {INSTAGRAM_HANDLE}
            <ArrowUpRightIcon size={18} />
          </a>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t-[1.5px] border-coal pt-7">
          <span className="font-display text-[32px] leading-none text-orange uppercase">
            Design today. Inspire tomorrow.
          </span>
          <span className="text-[14px] text-dim">
            © 2026 IDLE Sets · Focus. Trust. Create.
          </span>
        </div>
      </Container>
    </footer>
  );
}
