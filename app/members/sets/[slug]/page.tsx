import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SetPlayer, type PlayerQuestion } from "@/components/members/SetPlayer";
import { requireMember } from "@/lib/member-auth";
import { getAttempt, getOpenAttempt } from "@/lib/progress";
import { loadSet, playable } from "@/lib/set-questions";
import { findSet, setLabel } from "@/lib/sets";

export async function generateMetadata(props: PageProps<"/members/sets/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: findSet(slug)?.title ?? "Set" };
}

export default async function SetPage(props: PageProps<"/members/sets/[slug]">) {
  const member = await requireMember();
  const { slug } = await props.params;
  const set = findSet(slug);
  if (!set) notFound();

  const loaded = await loadSet(slug);
  if (!playable(loaded)) {
    // Not answered in the site yet: send members to the Google Form.
    if (set.formUrl) redirect(set.formUrl);
    notFound();
  }

  // Resume the requested run (e.g. a retake), else the latest unfinished one.
  const searchParams = await props.searchParams;
  const requested = typeof searchParams.attempt === "string" ? searchParams.attempt : "";
  let attempt = requested ? await getAttempt(member.id, requested) : null;
  if (attempt && (attempt.slug !== slug || attempt.finishedAt)) {
    if (attempt.finishedAt && attempt.slug === slug) redirect(`/members/results/${attempt.id}`);
    attempt = null;
  }
  attempt ??= await getOpenAttempt(member.id, slug);

  const byKey = new Map(loaded.questions.map((q) => [q.key, q]));
  const questions: PlayerQuestion[] = (
    attempt ? attempt.questionKeys.map((key) => byKey.get(key)).filter((q) => q !== undefined) : loaded.questions
  ).map((q) => ({
    key: q.key,
    number: q.number,
    text: q.text,
    choices: q.choices,
    answer: q.answer,
    explanation: q.explanation,
  }));

  return (
    <SetPlayer
      // A new run gets a fresh player.
      key={attempt?.id ?? "new"}
      slug={slug}
      title={set.title}
      label={setLabel(set)}
      questions={questions}
      attemptId={attempt?.id ?? null}
      isRetake={attempt?.isRetake ?? false}
      saved={attempt?.answers ?? {}}
    />
  );
}
