import "server-only";
import { MEMBERSHIP_PRICE } from "./content";
import type { Registration } from "./registrations";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SITE_NAME, siteUrl } from "./site";

// Emails go through Resend (https://resend.com). Settings, all optional:
//   RESEND_API_KEY  – turns email on
//   ADMIN_EMAIL     – who gets "new registration" emails (comma-separated)
//   EMAIL_FROM      – sender on your verified domain, e.g.
//                     "IDLE Sets <registrations@idlesets.com>". Needed to email
//                     registrants; without it only the admin email is sent,
//                     from Resend's test sender.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TEST_SENDER = `${SITE_NAME} <onboarding@resend.dev>`;

function adminRecipients(): string[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Whether the registrant will get a confirmation email. */
export function registrantEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function send(message: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string[];
}) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo?.length ? { reply_to: message.replyTo } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f3f0ea;padding:24px 12px;font-family:Helvetica,Arial,sans-serif;color:#161412">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdfa;border:1.5px solid #161412;border-radius:20px">
<tr><td style="padding:28px 28px 8px;font-weight:800;letter-spacing:0.1em;font-size:13px">IDLE SETS</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.55">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

function formatManila(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function sendRegistrationEmails(registration: Registration) {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email] RESEND_API_KEY not set; skipping registration emails.");
    return;
  }
  const admins = adminRecipients();
  const from = process.env.EMAIL_FROM || TEST_SENDER;
  const adminUrl = new URL("/admin", siteUrl()).toString();
  const name = escapeHtml(registration.fullName);
  const email = escapeHtml(registration.email);
  const school = escapeHtml(registration.school);
  const when = formatManila(registration.createdAt);

  const jobs: Promise<void>[] = [];

  if (admins.length) {
    jobs.push(
      send({
        from,
        to: admins,
        replyTo: [registration.email],
        subject: `New registration: ${registration.fullName}`,
        html: layout(`
<p style="margin:0 0 16px;font-size:22px;font-weight:800">New registration</p>
<p style="margin:0 0 4px"><b>Name:</b> ${name}</p>
<p style="margin:0 0 4px"><b>Email:</b> ${email}</p>
<p style="margin:0 0 4px"><b>School:</b> ${school}</p>
<p style="margin:0 0 20px"><b>Submitted:</b> ${when}</p>
<p style="margin:0"><a href="${adminUrl}" style="display:inline-block;background:#161412;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Review payment proof</a></p>`),
        text: `New registration\n\nName: ${registration.fullName}\nEmail: ${registration.email}\nSchool: ${registration.school}\nSubmitted: ${when}\n\nReview the payment proof: ${adminUrl}`,
      }),
    );
  } else {
    console.info("[email] ADMIN_EMAIL not set; skipping the admin notification.");
  }

  if (registrantEmailEnabled()) {
    const firstName = escapeHtml(registration.fullName.split(" ")[0]);
    jobs.push(
      send({
        from,
        to: [registration.email],
        replyTo: admins,
        subject: `We got your ${SITE_NAME} registration`,
        html: layout(`
<p style="margin:0 0 16px;font-size:22px;font-weight:800">Thanks, ${firstName}!</p>
<p style="margin:0 0 16px">We received your ${SITE_NAME} membership registration and your proof of payment for ${MEMBERSHIP_PRICE}.</p>
<p style="margin:0 0 16px">We'll check your payment and give <b>${email}</b> access to the reviewer sets once your registration is processed.</p>
<p style="margin:0">Questions? Message us on Instagram at <a href="${INSTAGRAM_URL}" style="color:#c24000">${INSTAGRAM_HANDLE}</a>.</p>`),
        text: `Thanks, ${registration.fullName.split(" ")[0]}!\n\nWe received your ${SITE_NAME} membership registration and your proof of payment for ${MEMBERSHIP_PRICE}.\n\nWe'll check your payment and give ${registration.email} access to the reviewer sets once your registration is processed.\n\nQuestions? Message us on Instagram at ${INSTAGRAM_HANDLE}: ${INSTAGRAM_URL}`,
      }),
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") console.error("[email] send failed:", result.reason);
  }
}
