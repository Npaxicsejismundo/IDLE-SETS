import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

// Everything under /members is private: keep it out of search results.
export const metadata: Metadata = {
  title: { default: "Members — IDLE Sets", template: "%s — IDLE Sets members" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f3f0ea",
  viewportFit: "cover",
};

export default function MembersLayout({ children }: { children: ReactNode }) {
  return children;
}
