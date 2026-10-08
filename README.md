# IDLE Sets — Website

Landing page, membership registration and the members area for IDLE Sets, the Interior Design board
exam (LEID) reviewer.
Built with Next.js (App Router), TypeScript and Tailwind CSS v4.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The landing page works right away. The registration form and `/admin`
need the settings in [Registration setup](#registration-setup); put them in a `.env.local` file
(see `.env.example`).

Other scripts: `npm run build` (production build), `npm start` (serve the build), `npm run lint`.

## Where things live

| Path | What |
| --- | --- |
| `app/page.tsx` | Landing page — stacks the sections in order |
| `app/subscribe/` | Membership page (`/subscribe`) and the server code that saves a registration |
| `components/RegistrationForm.tsx` | The registration form (details, payment QR, proof upload, terms) |
| `app/admin/` | Password-protected `/admin` page: registrations, proofs, status, access codes, CSV export |
| `app/members/` | Members area (`/members`): sign in, Home, Sets, Review, Profile, answering a set, results |
| `components/members/` | Members area frame (`MemberShell`) and the set player (`SetPlayer`) |
| `lib/sets.ts` | The list of sets: titles, subjects, order, numbers and Google Form links |
| `content/sets/` | Questions for sets answered inside the site, one CSV per set (see its README) |
| `lib/member-auth.ts`, `lib/access-codes.ts` | Member sign-in (email + access code) and sessions |
| `lib/progress.ts`, `lib/member-overview.ts` | Saved answers, results, streaks and accuracy |
| `app/api/proof-upload/route.ts` | Lets the browser upload the proof of payment straight to Vercel Blob |
| `lib/registrations.ts`, `lib/db.ts` | Database access (the `registrations` table is created automatically) |
| `lib/email.ts` | Emails sent through Resend |
| `lib/admin-auth.ts` | Admin login (one shared password) |
| `lib/registration-rules.ts` | Form validation used by both the browser and the server |
| `app/layout.tsx` | Fonts, SEO / Open Graph metadata |
| `app/globals.css` | Brand colors, fonts and small custom utilities (`sheet`, `fade-l`, marquee) |
| `components/` | One file per section (`Hero`, `Results`, `Method`, `HowItWorks`, `Join`, `Moment`, `Faq`, …) |
| `lib/content.ts` | Editable copy: price, stats, topnotchers, steps, FAQs, quiz, `/subscribe` text, membership terms |
| `lib/site.ts` | Site name, description, Instagram link, site URL |
| `public/idle-sets-payment-qr.png` | The InstaPay payment QR shown in the form |
| `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx` | Generated share image and favicons |
| `app/fonts/` | Self-hosted Anton, Archivo, Caveat (woff2); `*-latin-ext` files cover extra characters such as ₱ |
| `assets/` | TTF copies of Anton / Archivo Bold for the generated images |

### Common edits

- **Price (₱500)** → `MEMBERSHIP_PRICE` in `lib/content.ts`
- **Payment QR** → replace `public/idle-sets-payment-qr.png` (if the new image has a different size, update `qrWidth` / `qrHeight` in `payment` in `lib/content.ts`)
- **Membership terms / no-refund policy** → `membershipTerms` and `noRefundPolicy` in `lib/content.ts`
- **Results / topnotchers / FAQ / steps** → `lib/content.ts`
- **Instagram handle or link** → `lib/site.ts`
- **Sets, their order or Google Form links** → `lib/sets.ts`
- **Let members answer a set inside the site** → add `content/sets/<set>.csv` (see `content/sets/README.md`)
- **How many devices a member can stay signed in on (3)** → `MAX_MEMBER_DEVICES` in `lib/content.ts`
- **Colors** → `@theme` block in `app/globals.css` (e.g. `--color-orange`)

## Registration setup

People register on `/subscribe`: they enter their email, full name and school, pay ₱500 with the
InstaPay QR, upload their proof of payment, and agree to the terms. Each registration is saved in a
Postgres database, the proof is stored **privately** in Vercel Blob, and you review everything at
`/admin`.

Do this once in your Vercel project, then redeploy.

1. **Proof uploads (Vercel Blob).** Project → **Storage** → **Create Storage** → **Blob** →
   **Continue** → set access to **Private** → create it and connect it to this project (tick
   Development too if you'll test on your computer). This adds `BLOB_READ_WRITE_TOKEN` and
   `BLOB_STORE_ID`. The store must be **Private**: proofs show bank details.
2. **Database (Neon Postgres).** Project → **Storage** → **Create Storage** → **Neon** → create
   and connect it to this project. This adds `DATABASE_URL`. The `registrations` table is created
   automatically the first time the site uses it.
3. **Admin password.** Project → **Settings** → **Environment Variables** → add `ADMIN_PASSWORD`
   with a long password. Anyone with it can see registrations, so share it only with the people
   who process them. Changing it logs everyone out.
4. **Emails (Resend, free plan).** Sign up at [resend.com](https://resend.com), create an API key,
   and add these environment variables:
   - `RESEND_API_KEY` — the API key.
   - `ADMIN_EMAIL` — where "new registration" alerts go (separate several with commas).
   - `EMAIL_FROM` — for example `IDLE Sets <registrations@yourdomain.com>`. This needs a domain you
     own, verified in Resend (**Domains** → **Add domain**, then add the DNS records it shows).
     Registrants only get a confirmation email once this is set.

   Until a domain is verified, leave `EMAIL_FROM` empty: alerts are then sent from Resend's test
   address, which can only deliver to the email you signed up to Resend with, so use that as
   `ADMIN_EMAIL`. Without `RESEND_API_KEY`, no emails are sent and registrations still save.
5. **Redeploy** (Deployments → ⋯ → **Redeploy**) so the new variables take effect.

To run the form on your computer, pull the same settings with `npx vercel link` and then
`npx vercel env pull .env.local`, or copy `.env.example` to `.env.local` and fill it in.

### Processing registrations

Go to `/admin` and log in with `ADMIN_PASSWORD`.

- Each registration shows the proof of payment; click it to open it full size.
- **Grant access** makes the member a personal access code (like `K7M3-Q9TX`) and shows it on
  their card. If `EMAIL_FROM` is set, the code is emailed to them automatically. If not, use
  **Copy message** (sign-in link + code, ready to paste into an Instagram DM) or **Copy code**.
- **New code** replaces a member's code (say, if they shared it): the old code stops working and
  they're signed out everywhere. **Move back to pending** or **Reject** also signs them out.
- Each granted card shows when the member last opened the sets.
- Use the tabs and search to find people, and **Download CSV** for a spreadsheet (opens in Excel
  or Google Sheets).
- Registrants get the success screen and, if `EMAIL_FROM` is set, a confirmation email. You get an
  alert email for each new registration.

The upload step is open to anyone filling in the form (that's how registration works), so it only
accepts images (JPG, PNG, WebP, HEIC) and PDFs up to 10 MB, and the form has a hidden field that
filters out simple spam bots.

## Members area

Members go to `/members` (or **Log in** in the site header), sign in with the email they registered
with and their access code, and land on their Home: what to continue, their accuracy, finished sets
and day streak, and every set grouped by subject.

- **Sets with a Google Form** open the form in a new tab, exactly like the old Linktree. That's
  every set until you add questions.
- **Sets answered inside the site**: add the set's questions as `content/sets/<set>.csv` (a
  spreadsheet saved as CSV; `content/sets/README.md` has the format and file names). The set then
  opens in the site instead: one question at a time, the pick locks in and shows the answer and
  explanation, progress saves after every answer (members can leave and resume), and the results
  page shows the score, an answer sheet, time, flagged questions, everything missed, and a
  one-tap retake of the missed questions.
- `content/sets/example.csv` shows up as **Example set** only when you run the site on your
  computer (`npm run dev`), so you can try the in-site version. It never appears on the live site.
- **Just want to look around?** Run `npm run dev`, open http://localhost:3000/members/login and
  click **Preview the members area**. It signs you in as a sample member with no registration or
  database. Answers are kept in memory until you restart the dev server. The button and preview
  mode don't exist on the live site.

Sign-in uses the same database as registrations; the tables it needs are created automatically.
A member stays signed in for 90 days on up to 3 devices; signing in on a 4th signs out the oldest.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Framework is detected as Next.js; no settings needed.
3. Follow [Registration setup](#registration-setup) for the form and `/admin`.
4. Once you have a custom domain, add an environment variable `NEXT_PUBLIC_SITE_URL` (e.g. `https://idlesets.com`) so share links, emails, `robots.txt` and `sitemap.xml` use it. Without it, the Vercel production domain is used.
