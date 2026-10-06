# IDLE Sets — Website

Landing page for IDLE Sets, the Interior Design board exam (LEID) reviewer.
Built with Next.js (App Router), TypeScript and Tailwind CSS v4.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other scripts: `npm run build` (production build), `npm start` (serve the build), `npm run lint`.

## Where things live

| Path | What |
| --- | --- |
| `app/page.tsx` | Landing page — stacks the sections in order |
| `app/subscribe/page.tsx` | Membership page (`/subscribe`) with the embedded Google Form |
| `app/layout.tsx` | Fonts, SEO / Open Graph metadata |
| `app/globals.css` | Brand colors, fonts and small custom utilities (`sheet`, `fade-l`, marquee) |
| `components/` | One file per section (`Hero`, `Results`, `Method`, `HowItWorks`, `Join`, `Moment`, `Faq`, …) |
| `lib/content.ts` | Editable copy: price, stats, topnotchers, steps, FAQs, quiz, marquee words, `/subscribe` text |
| `lib/site.ts` | Site name, description, Instagram link, membership form link, site URL |
| `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx` | Generated share image and favicons |
| `app/fonts/` | Self-hosted Anton, Archivo, Caveat (woff2); `*-latin-ext` files cover extra characters such as ₱ |
| `assets/` | TTF copies of Anton / Archivo Bold for the generated images |

### Common edits

- **Price (₱500)** → `MEMBERSHIP_PRICE` in `lib/content.ts`
- **Results / topnotchers / FAQ / steps** → `lib/content.ts`
- **Google Form link** → `MEMBERSHIP_FORM_URL` in `lib/site.ts` (use the `/viewform` link, not `/edit`)
- **Instagram handle or link** → `lib/site.ts`
- **Colors** → `@theme` block in `app/globals.css` (e.g. `--color-orange`)

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Framework is detected as Next.js; no settings needed.
3. Once you have a custom domain, add an environment variable `NEXT_PUBLIC_SITE_URL` (e.g. `https://idlesets.com`) so share links, `robots.txt` and `sitemap.xml` use it. Without it, the Vercel production domain is used.
