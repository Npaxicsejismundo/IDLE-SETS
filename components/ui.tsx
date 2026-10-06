import type { ReactNode } from "react";

/** Circular "IDLE" badge used in the header, quiz card and footer. */
export function LogoBadge({
  size,
  className = "",
}: {
  size: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-8 border-[1.5px] border-ink text-[12px]",
    md: "size-12 border-2 border-ink text-[18px] tracking-[-0.02em]",
    lg: "size-24 text-[36px] tracking-[-0.02em]",
  };
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full bg-white font-display text-ink ${sizes[size]} ${className}`}
    >
      IDLE
    </span>
  );
}

/** Small uppercase label above section headings. */
export function Eyebrow({
  children,
  className = "text-rust",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[13px] font-bold uppercase tracking-[0.14em] ${className}`}
    >
      {children}
    </p>
  );
}

/** Split "ONE-TIME | PAYMENT" pill. */
export function OneTimePill({ size }: { size: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <span
      className={`inline-flex items-center rounded-full border-[1.5px] border-ink p-[3px] font-extrabold tracking-[0.1em] text-ink ${
        lg ? "h-10 bg-paper text-[12px]" : "h-[34px] text-[11px]"
      }`}
    >
      <span
        className={`flex h-full items-center rounded-full bg-orange ${
          lg ? "px-3.5" : "px-3"
        }`}
      >
        ONE-TIME
      </span>
      <span className={lg ? "pr-3.5 pl-2.5" : "pr-3 pl-2"}>PAYMENT</span>
    </span>
  );
}

/**
 * Centered content column with the site's side gutters.
 * 1344px = a 1280px content area plus the 32px gutters on each side
 * (border-box), which matches the design's 1280px column.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-[1344px] px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}
