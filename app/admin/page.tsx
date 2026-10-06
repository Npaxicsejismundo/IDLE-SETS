import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { CheckIcon, CloseIcon, FileIcon } from "@/components/icons";
import { LogoBadge } from "@/components/ui";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { databaseUrl } from "@/lib/db";
import {
  LIST_LIMIT,
  countByStatus,
  isStatus,
  listRegistrations,
  type Registration,
  type RegistrationStatus,
} from "@/lib/registrations";
import { logout, updateStatus } from "./actions";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Registrations — IDLE Sets admin",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Pending",
  granted: "Access granted",
  rejected: "Rejected",
};

const PREVIEWABLE = ["image/jpeg", "image/png", "image/webp"];

function formatManila(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminPage(props: PageProps<"/admin">) {
  await connection(); // always render per request, never at build time
  const signedIn = await isAdmin();
  return (
    <div className="min-h-svh bg-cream">
      <header className="border-b-[1.5px] border-line bg-paper">
        <div className="mx-auto flex max-w-[1344px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <LogoBadge size="md" />
            <div className="flex flex-col">
              <span className="text-[14px] font-extrabold tracking-[0.1em]">IDLE SETS</span>
              <span className="text-[13px] text-muted">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[14px] font-bold hover:text-rust">
              View site
            </Link>
            {signedIn && (
              <form action={logout}>
                <button
                  type="submit"
                  className="h-10 cursor-pointer rounded-full border-[1.5px] border-ink px-4 text-[14px] font-bold hover:bg-white"
                >
                  Log out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1344px] px-5 py-10 sm:px-8">
        {!adminConfigured() ? (
          <Notice title="Admin isn't set up yet">
            Add an <code className="font-bold">ADMIN_PASSWORD</code> environment variable in
            Vercel (Project → Settings → Environment Variables), then redeploy. See the README.
          </Notice>
        ) : !signedIn ? (
          <div className="mx-auto mt-6 flex max-w-[420px] flex-col gap-6 rounded-3xl border-[1.5px] border-ink bg-paper p-8">
            <h1 className="font-display text-[44px] leading-none uppercase">Admin log in</h1>
            <LoginForm />
          </div>
        ) : !databaseUrl() ? (
          <Notice title="The database isn't connected yet">
            In Vercel, open your project → Storage, create a Neon (Postgres) database and connect
            it to this project. It adds <code className="font-bold">DATABASE_URL</code>
            automatically. Then redeploy. See the README.
          </Notice>
        ) : (
          <Dashboard searchParams={await props.searchParams} />
        )}
      </main>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[640px] rounded-3xl border-[1.5px] border-ink bg-paper p-8">
      <h1 className="mb-3 text-[24px] font-extrabold">{title}</h1>
      <p className="text-[16px] leading-[1.6] text-body">{children}</p>
    </div>
  );
}

async function Dashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "";
  const status = isStatus(statusParam) ? statusParam : undefined;
  const search = typeof searchParams.q === "string" ? searchParams.q.slice(0, 100) : "";

  const [counts, rows] = await Promise.all([
    countByStatus(),
    listRegistrations({ status, search }),
  ]);

  const tabs: { key: RegistrationStatus | ""; label: string; count: number }[] = [
    { key: "", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "granted", label: "Access granted", count: counts.granted },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  const hrefFor = (key: string, q = search) => {
    const params = new URLSearchParams();
    if (key) params.set("status", key);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };
  const exportParams = new URLSearchParams();
  if (status) exportParams.set("status", status);
  if (search) exportParams.set("q", search);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[clamp(44px,5vw,64px)] leading-none uppercase">
          Registrations
        </h1>
        <a
          href={`/admin/export${exportParams.size ? `?${exportParams}` : ""}`}
          className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-[15px] font-bold text-white hover:bg-coal"
        >
          Download CSV
        </a>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = (status ?? "") === tab.key;
            return (
              <Link
                key={tab.label}
                href={hrefFor(tab.key)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] px-4 text-[14px] font-bold ${
                  active ? "border-ink bg-ink text-white hover:text-white" : "border-line-strong bg-paper hover:border-ink"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] ${active ? "bg-orange text-ink" : "bg-sand"}`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>
        <form action="/admin" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="admin-search" className="sr-only">
            Search name, email or school
          </label>
          <input
            id="admin-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Search name, email or school"
            className="h-10 w-full rounded-full border-[1.5px] border-line-strong bg-white px-4 text-[14px] outline-none focus-visible:border-ink lg:w-72"
          />
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-full border-[1.5px] border-ink px-4 text-[14px] font-bold hover:bg-white"
          >
            Search
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-3xl border-[1.5px] border-dashed border-stone bg-paper px-6 py-12 text-center text-[16px] text-muted">
          {search
            ? `No registrations match “${search}”.`
            : status
              ? `No ${STATUS_LABEL[status].toLowerCase()} registrations.`
              : "No registrations yet. They'll show up here as soon as someone submits the form."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <RegistrationRow key={row.id} row={row} />
          ))}
        </ul>
      )}
      {rows.length >= LIST_LIMIT && (
        <p className="text-[14px] text-muted">
          Showing the latest {LIST_LIMIT}. Use search or Download CSV to see everything.
        </p>
      )}
    </div>
  );
}

function RegistrationRow({ row }: { row: Registration }) {
  const proofHref = `/admin/proofs/${row.id}`;
  const previewable = PREVIEWABLE.includes(row.proofContentType);
  const statusClass =
    row.status === "granted"
      ? "bg-ink text-white"
      : row.status === "rejected"
        ? "bg-sand text-muted line-through decoration-1"
        : "bg-orange text-ink";

  return (
    <li className="grid grid-cols-[72px_1fr] items-start gap-x-4 gap-y-3 rounded-3xl border-[1.5px] border-line-strong bg-paper p-4 sm:p-5 lg:grid-cols-[88px_minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-center">
      <a
        href={proofHref}
        target="_blank"
        rel="noopener"
        className="row-span-2 block overflow-hidden rounded-xl border-[1.5px] border-line-strong bg-white hover:border-ink lg:row-span-1"
        title="Open proof of payment"
      >
        {previewable ? (
          // Served through the auth-checked proof route, so next/image can't fetch it.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proofHref}
            alt={`Proof of payment from ${row.fullName}`}
            loading="lazy"
            className="aspect-square w-full object-cover object-top"
          />
        ) : (
          <span className="flex aspect-square w-full flex-col items-center justify-center gap-1 text-[12px] font-bold text-muted">
            <FileIcon size={24} />
            {row.proofContentType === "application/pdf" ? "PDF" : "File"}
          </span>
        )}
        <span className="sr-only">Open proof of payment (new tab)</span>
      </a>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[17px] font-extrabold break-words">{row.fullName}</p>
        <a href={`mailto:${row.email}`} className="text-[15px] break-all text-body underline-offset-2 hover:underline">
          {row.email}
        </a>
        <p className="text-[14px] text-muted break-words">{row.school}</p>
      </div>

      <div className="col-start-2 flex flex-col gap-1 lg:col-start-auto">
        <span className={`self-start rounded-full px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.08em] ${statusClass}`}>
          {STATUS_LABEL[row.status]}
        </span>
        <p className="text-[13px] text-muted">Submitted {formatManila(row.createdAt)}</p>
      </div>

      <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-1 lg:justify-end">
        {row.status === "pending" ? (
          <>
            <StatusButton id={row.id} status="granted" primary>
              <CheckIcon size={18} />
              Grant access
            </StatusButton>
            <StatusButton id={row.id} status="rejected">
              <CloseIcon size={18} />
              Reject
            </StatusButton>
          </>
        ) : (
          <StatusButton id={row.id} status="pending">
            Move back to pending
          </StatusButton>
        )}
      </div>
    </li>
  );
}

function StatusButton({
  id,
  status,
  primary = false,
  children,
}: {
  id: string;
  status: RegistrationStatus;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <form action={updateStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[14px] font-bold ${
          primary ? "border-ink bg-ink text-white hover:bg-coal" : "border-ink bg-paper hover:bg-white"
        }`}
      >
        {children}
      </button>
    </form>
  );
}
