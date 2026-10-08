"use client";

import { useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

const button =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-paper px-3.5 text-[13px] font-bold hover:bg-white";

/** Copies text to the clipboard and says so for a moment. */
export function CopyButton({ text, children }: { text: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={button}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copy this:", text);
        }
      }}
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      <span aria-live="polite">{copied ? "Copied" : children}</span>
    </button>
  );
}

/** Submit button that asks first. */
export function ConfirmSubmit({
  message,
  className = button,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
