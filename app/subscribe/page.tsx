import type { Metadata } from "next";
import { ArrowUpRightIcon } from "@/components/icons";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Container, Eyebrow, LogoBadge, OneTimePill } from "@/components/ui";
import { MEMBERSHIP_PRICE, membership } from "@/lib/content";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  MEMBERSHIP_FORM_EMBED_URL,
  MEMBERSHIP_FORM_URL,
  SITE_NAME,
} from "@/lib/site";

const title = `Be a member — ${SITE_NAME}`;
const description = `Register for IDLE Sets: a one-time ${MEMBERSHIP_PRICE} payment for 3,500+ Interior Design board exam reviewer sets.`;

// Setting openGraph/twitter here replaces the home page's, so the shared
// image from app/opengraph-image.tsx is listed again explicitly.
const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "IDLE Sets — Train for board-level thinking.",
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/subscribe" },
  openGraph: {
    type: "website",
    url: "/subscribe",
    siteName: SITE_NAME,
    title,
    description,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
};

export default function SubscribePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-t-[1.5px] border-line">
          <div
            aria-hidden="true"
            className="sheet fade-l absolute top-0 right-0 h-[640px] w-3/5"
          />
          <Container className="relative flex flex-col gap-12 pt-14 pb-24 lg:flex-row lg:items-start lg:gap-16 lg:pt-[72px]">
            <Intro />
            <FormCard />
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Intro() {
  return (
    <div className="flex min-w-0 flex-col gap-7 lg:w-[440px] lg:flex-none">
      <p className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.14em] text-rust">
        <span
          aria-hidden="true"
          className="size-[15px] flex-none rounded-full border-[1.5px] border-ink bg-orange"
        />
        Membership · LEID 2027
      </p>
      <h1 className="font-display text-[clamp(56px,7vw,96px)] leading-[0.92] uppercase">
        Be a <span className="text-flame">member</span>.
      </h1>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <strong className="font-display text-[56px] leading-none font-normal">
          {MEMBERSHIP_PRICE}
        </strong>
        <OneTimePill size="lg" />
      </div>
      <p className="text-[18px] leading-[1.55] text-pretty text-body">
        {membership.summary}
      </p>

      <div className="flex flex-col gap-5 border-t-[1.5px] border-line-strong pt-7">
        <Eyebrow>How to register</Eyebrow>
        <ol className="flex flex-col gap-5">
          {membership.steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex size-9 flex-none items-center justify-center rounded-full border-[1.5px] border-ink bg-orange font-display text-[18px] leading-none"
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-1 pt-1">
                <h2 className="text-[18px] leading-[1.25] font-extrabold">
                  {step.title}
                </h2>
                <p className="text-[15px] text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="border-t-[1.5px] border-line-strong pt-5 text-[15px] text-muted">
        {membership.note} Questions?{" "}
        <a
          href={INSTAGRAM_URL}
          className="font-semibold text-ink underline underline-offset-2 hover:text-rust"
        >
          Message us on Instagram at {INSTAGRAM_HANDLE}
        </a>
        .
      </p>
    </div>
  );
}

function FormCard() {
  return (
    <div className="relative min-w-0 flex-1">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl border-[1.5px] border-ink bg-orange [transform:rotate(1.5deg)_translate(8px,8px)] max-sm:hidden"
      />
      <div className="relative overflow-hidden rounded-3xl border-[1.5px] border-ink bg-paper shadow-[0_30px_60px_-30px_rgba(22,20,18,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-[1.5px] border-line-soft px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LogoBadge size="sm" />
            <span className="text-[13px] font-extrabold tracking-[0.08em]">
              MEMBERSHIP FORM
            </span>
          </div>
          <a
            href={MEMBERSHIP_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[14px] font-bold hover:text-rust"
          >
            Open in a new tab
            <ArrowUpRightIcon size={16} />
            <span className="sr-only">(opens Google Forms)</span>
          </a>
        </div>
        <p className="border-b-[1.5px] border-line-soft bg-sand px-5 py-3 text-[14px] leading-[1.45] text-body">
          The form asks you to sign in to Google. If it doesn&apos;t load
          below, or keeps asking you to sign in,{" "}
          <a
            href={MEMBERSHIP_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-ink underline underline-offset-2 hover:text-rust"
          >
            open it in a new tab
          </a>
          .
        </p>
        <div className="relative">
          <p
            aria-hidden="true"
            className="absolute inset-x-0 top-24 text-center text-[15px] font-semibold text-muted"
          >
            Loading the form…
          </p>
          <iframe
            src={MEMBERSHIP_FORM_EMBED_URL}
            title="IDLE Sets membership form (Google Forms)"
            className="relative block h-[min(1100px,calc(100svh-6rem))] min-h-[640px] w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
