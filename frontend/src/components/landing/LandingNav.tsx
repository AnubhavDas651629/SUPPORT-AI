"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function LandingNav() {
  return (
    <header className="relative z-10 border-b border-white/[0.06]">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" aria-label="Support AI home" className="flex items-center">
          {/* The mark is monochrome black, so a straight invert reads as white on the dark hero. */}
          <Logo height={30} width={132} className="invert" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white/[0.07] px-3.5 py-2 text-[13.5px] font-medium text-slate-200 transition-colors hover:bg-white/[0.12]"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
