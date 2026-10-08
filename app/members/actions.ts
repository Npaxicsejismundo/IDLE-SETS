"use server";

import { redirect } from "next/navigation";
import { normalizeAccessCode } from "@/lib/access-codes";
import {
  endMemberSession,
  getMember,
  membersConfigured,
  requireMember,
  startMemberSession,
  startPreviewSession,
} from "@/lib/member-auth";
import {
  createAttempt,
  finishAttempt,
  getAttempt,
  getOpenAttempt,
  recordAnswer,
  recordFlag,
} from "@/lib/progress";
import { findMemberByCode } from "@/lib/registrations";
import { loadSet, playable } from "@/lib/set-questions";
import { findSet } from "@/lib/sets";

// ── Sign in / out ──────────────────────────────────────────────────────────

export type SignInState = { error?: string; email?: string; code?: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().slice(0, 254);
  const typed = String(formData.get("code") ?? "").trim().slice(0, 40);
  const code = normalizeAccessCode(typed);
  if (!email || !code) {
    return { email, code: typed, error: "Enter the email you registered with and your access code." };
  }
  if (!membersConfigured()) {
    return { email, code: typed, error: "Member sign-in isn't available right now. Please try again later." };
  }
  let registrationId: string;
  try {
    const registration = await findMemberByCode(email, code);
    if (!registration) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // slow down guessing
      return {
        email,
        code: typed,
        error:
          "That email and access code don't match an active membership. Check for typos, or message us on Instagram.",
      };
    }
    registrationId = registration.id;
    await startMemberSession(registrationId);
  } catch (error) {
    console.error("[members] sign-in failed:", error);
    return { email, code: typed, error: "Something went wrong on our side. Please try again in a moment." };
  }
  redirect("/members");
}

/** "Preview the members area" button, shown only when running on your computer. */
export async function previewSignIn() {
  await startPreviewSession();
  redirect("/members");
}

export async function signOut() {
  await endMemberSession();
  redirect("/members/login");
}

// ── Answering a set ────────────────────────────────────────────────────────
// Called from the set player. Each checks the member and the set again.

/** Finds or starts the member's run through a set; returns its id. */
export async function startSetAttempt(slug: string): Promise<{ attemptId: string } | null> {
  const member = await getMember();
  if (!member) return null;
  const set = findSet(slug);
  const loaded = set ? await loadSet(slug) : null;
  if (!playable(loaded)) return null;
  const open = await getOpenAttempt(member.id, slug);
  if (open) return { attemptId: open.id };
  const attemptId = await createAttempt(
    member.id,
    slug,
    loaded.questions.map((q) => q.key),
    false,
  );
  return { attemptId };
}

export async function saveAnswer(input: {
  slug: string;
  attemptId: string;
  key: string;
  choice: string;
  seconds: number;
}): Promise<{ ok: boolean }> {
  const member = await getMember();
  if (!member) return { ok: false };
  const loaded = await loadSet(input.slug);
  const question = loaded?.questions.find((q) => q.key === input.key);
  if (!question || !question.choices.some((c) => c.id === input.choice)) return { ok: false };
  const attempt = await getAttempt(member.id, input.attemptId);
  if (!attempt || attempt.slug !== input.slug) return { ok: false };
  const ok = await recordAnswer({
    memberId: member.id,
    attemptId: input.attemptId,
    key: input.key,
    choice: input.choice,
    correct: input.choice === question.answer,
    seconds: Number(input.seconds) || 0,
  });
  return { ok };
}

export async function saveFlag(input: {
  attemptId: string;
  key: string;
  flagged: boolean;
}): Promise<{ ok: boolean }> {
  const member = await getMember();
  if (!member) return { ok: false };
  const ok = await recordFlag({
    memberId: member.id,
    attemptId: input.attemptId,
    key: input.key,
    flagged: Boolean(input.flagged),
  });
  return { ok };
}

export async function finishSetAttempt(attemptId: string) {
  const member = await requireMember();
  const ok = await finishAttempt(member.id, attemptId);
  if (!ok) redirect("/members");
  redirect(`/members/results/${attemptId}`);
}

/** Starts a run with only the questions missed in a finished attempt. */
export async function retakeMissed(formData: FormData) {
  const member = await requireMember();
  const attempt = await getAttempt(member.id, String(formData.get("attemptId") ?? ""));
  if (!attempt) redirect("/members");
  const loaded = await loadSet(attempt.slug);
  if (!playable(loaded)) redirect("/members/sets");
  const current = new Set(loaded.questions.map((q) => q.key));
  const missed = attempt.questionKeys.filter(
    (key) => current.has(key) && attempt.answers[key]?.correct !== true,
  );
  const keys = missed.length > 0 ? missed : loaded.questions.map((q) => q.key);
  const id = await createAttempt(member.id, attempt.slug, keys, missed.length > 0);
  redirect(`/members/sets/${attempt.slug}?attempt=${id}`);
}

/** Starts a fresh run through the whole set. */
export async function retakeSet(formData: FormData) {
  const member = await requireMember();
  const slug = String(formData.get("slug") ?? "");
  const loaded = findSet(slug) ? await loadSet(slug) : null;
  if (!playable(loaded)) redirect("/members/sets");
  const id = await createAttempt(
    member.id,
    slug,
    loaded.questions.map((q) => q.key),
    false,
  );
  redirect(`/members/sets/${slug}?attempt=${id}`);
}
