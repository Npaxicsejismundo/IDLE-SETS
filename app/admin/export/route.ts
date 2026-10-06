import { isAdmin } from "@/lib/admin-auth";
import { isStatus, listRegistrations } from "@/lib/registrations";
import { siteUrl } from "@/lib/site";

// CSV of registrations for a signed-in admin (opens in Excel or Google Sheets).

const STATUS_LABEL = { pending: "Pending", granted: "Access granted", rejected: "Rejected" };

function cell(value: string): string {
  // Stop spreadsheet apps from treating user input as a formula.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function manila(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Not signed in.", { status: 401 });

  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  const rows = await listRegistrations({
    status: isStatus(status) ? status : undefined,
    search: params.get("q")?.slice(0, 100) ?? undefined,
    limit: 100_000,
  });

  const base = siteUrl();
  const lines = [
    ["Submitted (Manila)", "Full name", "Email", "School", "Status", "Proof of payment"].map(cell).join(","),
    ...rows.map((r) =>
      [
        manila(r.createdAt),
        r.fullName,
        r.email,
        r.school,
        STATUS_LABEL[r.status],
        new URL(`/admin/proofs/${r.id}`, base).toString(),
      ]
        .map(cell)
        .join(","),
    ),
  ];

  const today = manila(new Date()).slice(0, 10);
  // BOM so Excel reads the file as UTF-8 (names with ñ, etc.).
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="idle-sets-registrations-${today}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
