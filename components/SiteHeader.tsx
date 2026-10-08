"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/content";
import { CloseIcon, MenuIcon } from "./icons";
import { Container, LogoBadge } from "./ui";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Close if the viewport grows past the breakpoint where the full nav shows.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="relative z-40">
      <Container className="flex items-center justify-between gap-4 py-5 lg:gap-8">
        <Link
          href="/#top"
          aria-label="IDLE Sets home"
          className="flex items-center gap-3"
        >
          <LogoBadge size="md" />
          <span className="text-[14px] font-extrabold tracking-[0.1em]">
            IDLE SETS
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="hidden gap-x-7 gap-y-2 text-[15px] font-semibold lg:flex"
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-rust">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/subscribe"
            className="hidden h-[46px] items-center rounded-full bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-coal sm:inline-flex"
          >
            Be a member
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-[46px] items-center justify-center rounded-full border-[1.5px] border-ink bg-paper lg:hidden"
          >
            {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </Container>

      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-full border-y-[1.5px] border-ink bg-cream shadow-[0_24px_40px_-24px_rgba(22,20,18,0.4)] lg:hidden"
      >
        <Container className="flex flex-col gap-6 pt-2 pb-8">
          <nav aria-label="Mobile" className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="border-b-[1.5px] border-line-strong py-4 font-display text-[32px] leading-none uppercase hover:text-rust"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
            <Link
              href="/subscribe"
              onClick={close}
              className="flex h-[58px] items-center justify-center rounded-full bg-ink text-[17px] font-bold text-white hover:bg-coal"
            >
              Be a member now
            </Link>
          </div>
        </Container>
      </div>
    </header>
  );
}
