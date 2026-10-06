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
| `app/page.tsx` | Page — stacks the sections in order |
| `app/layout.tsx` | Fonts, SEO / Open Graph metadata |
| `app/globals.css` | Brand colors, fonts and small custom utilities (`sheet`, `fade-l`, marquee) |
| `components/` | One file per section (`Hero`, `Results`, `Method`, `HowItWorks`, `Join`, `Moment`, `Faq`, …) |
| `lib/content.ts` | Editable copy: stats, topnotchers, steps, FAQs, quiz, marquee words |
| `lib/site.ts` | Site name, description, Instagram link, site URL |
| `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx` | Generated share image and favicons |
| `app/fonts/` | Self-hosted Anton, Archivo, Caveat (woff2) |
| `assets/` | TTF copies of Anton / Archivo Bold for the generated images |

### Common edits

- **Results / topnotchers / FAQ / steps** → `lib/content.ts`
- **Instagram handle or link** → `lib/site.ts`
- **Colors** → `@theme` block in `app/globals.css` (e.g. `--color-orange`)

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Framework is detected as Next.js; no settings needed.
3. Once you have a custom domain, add an environment variable `NEXT_PUBLIC_SITE_URL` (e.g. `https://idlesets.com`) so share links, `robots.txt` and `sitemap.xml` use it. Without it, the Vercel production domain is used.
