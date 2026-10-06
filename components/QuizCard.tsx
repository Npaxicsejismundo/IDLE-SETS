"use client";

import { useState } from "react";
import { quiz } from "@/lib/content";
import { LogoBadge } from "./ui";

export function QuizCard() {
  const [picked, setPicked] = useState<string | null>(null);
  const isCorrect = picked === quiz.answerId;

  return (
    <div className="relative w-full max-w-[460px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl border-[1.5px] border-ink bg-orange [transform:rotate(4deg)_translate(12px,10px)]"
      />
      <div className="relative overflow-hidden rounded-3xl border-[1.5px] border-ink bg-paper shadow-[0_30px_60px_-30px_rgba(22,20,18,0.45)]">
        <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-line-soft px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LogoBadge size="sm" />
            <span className="text-[13px] font-extrabold tracking-[0.08em]">
              IDLE SETS
            </span>
          </div>
          <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
            Try a question
          </span>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-[22px] pb-5">
          <p
            id="quiz-question"
            className="mb-1.5 rounded-2xl bg-orange px-[22px] py-5 text-[22px] leading-[1.25] font-extrabold text-ink"
          >
            {quiz.question}
          </p>

          <div
            role="group"
            aria-labelledby="quiz-question"
            className="flex flex-col gap-3"
          >
            {quiz.options.map((opt) => {
              const isPicked = picked === opt.id;
              const state = !isPicked
                ? "border-line-strong bg-paper hover:border-ink"
                : opt.id === quiz.answerId
                  ? "border-ink bg-orange"
                  : "border-ink bg-sand";
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={isPicked}
                  onClick={() => setPicked(opt.id)}
                  className={`flex min-h-[52px] w-full cursor-pointer items-center gap-3.5 rounded-full border-[1.5px] px-4 py-2.5 text-left text-[17px] leading-[normal] font-semibold text-ink ${state}`}
                >
                  <span
                    className={`flex size-7 flex-none items-center justify-center rounded-full border-[1.5px] border-ink text-[13px] font-extrabold ${
                      isPicked ? "bg-ink text-white" : "bg-paper text-ink"
                    }`}
                  >
                    {opt.letter}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>

          <div
            aria-live="polite"
            className="min-h-[50px] pt-1 text-[15px] leading-[1.45] text-body"
          >
            {!picked && (
              <p>
                Pick an answer from memory. No peeking — that&apos;s the whole
                point.
              </p>
            )}
            {picked && isCorrect && (
              <p>
                <strong className="text-ink">Correct.</strong> Active recall
                turns every review session into a performance check.
              </p>
            )}
            {picked && !isCorrect && (
              <p>
                <strong className="text-ink">Not quite.</strong> It feels
                productive, but it won&apos;t prepare you for real exam
                conditions. Try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
