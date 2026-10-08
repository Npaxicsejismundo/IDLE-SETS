import "server-only";
import { formatAccessCode } from "./access-codes";
import { MAX_MEMBER_DEVICES, MEMBERSHIP_PRICE } from "./content";
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

/** Sign-in page link, with the member's email filled in. */
export function memberLoginUrl(email?: string): string {
  const url = new URL("/members/login", siteUrl());
  if (email) url.searchParams.set("email", email);
  return url.toString();
}

/**
 * Emails a member their access code. Sent when you grant access (or make a
 * new code) in /admin, only if EMAIL_FROM is set. Returns whether it was sent.
 */
export async function sendAccessEmail(
  registration: Registration,
  options: { newCode?: boolean } = {},
): Promise<boolean> {
  if (!registrantEmailEnabled() || !registration.accessCode) return false;
  const code = formatAccessCode(registration.accessCode);
  const loginUrl = memberLoginUrl(registration.email);
  const firstName = registration.fullName.trim().split(/\s+/)[0];
  const intro = options.newCode
    ? "Here's your new access code. Your old code no longer works."
    : `Your ${SITE_NAME} membership is active. You can now open every reviewer set.`;
  try {
    await send({
      from: process.env.EMAIL_FROM as string,
      to: [registration.email],
      replyTo: adminRecipients(),
      subject: options.newCode
        ? `Your new ${SITE_NAME} access code`
        : `You're in: your ${SITE_NAME} access code`,
      html: layout(`
<p style="margin:0 0 16px;font-size:22px;font-weight:800">${options.newCode ? "New access code" : `You're in, ${escapeHtml(firstName)}!`}</p>
<p style="margin:0 0 16px">${escapeHtml(intro)}</p>
<p style="margin:0 0 6px">Sign in with <b>${escapeHtml(registration.email)}</b> and this code:</p>
<p style="margin:0 0 20px;font-size:30px;font-weight:800;letter-spacing:0.12em;font-family:Menlo,Consolas,monospace">${escapeHtml(code)}</p>
<p style="margin:0 0 20px"><a href="${loginUrl}" style="display:inline-block;background:#161412;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Open your sets</a></p>
<p style="margin:0 0 16px;font-size:14px;color:#57524b">Your access is personal: please don't share your code. You can stay signed in on up to ${MAX_MEMBER_DEVICES} devices.</p>
<p style="margin:0;font-size:14px;color:#57524b">Questions? Message us on Instagram at <a href="${INSTAGRAM_URL}" style="color:#c24000">${INSTAGRAM_HANDLE}</a>.</p>`),
      text: `${options.newCode ? "New access code" : `You're in, ${firstName}!`}\n\n${intro}\n\nSign in with ${registration.email} and this code: ${code}\n\nOpen your sets: ${loginUrl}\n\nYour access is personal: please don't share your code. You can stay signed in on up to ${MAX_MEMBER_DEVICES} devices.\n\nQuestions? Message us on Instagram at ${INSTAGRAM_HANDLE}: ${INSTAGRAM_URL}`,
    });
    return true;
  } catch (error) {
    console.error("[email] access email failed:", error);
    return false;
  }
}
