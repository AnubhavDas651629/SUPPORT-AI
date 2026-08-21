"use client";

import Link from "next/link";
import { HeroBackground } from "./HeroBackground";
import { HeroVisualization } from "./HeroVisualization";
import { LandingNav } from "./LandingNav";
import { WarpText } from "./WarpText";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#020617]">
      <HeroBackground />

      <div className="relative">
        <LandingNav />

        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
          <div className="mx-auto max-w-3xl pb-16 pt-20 text-center sm:pt-28 lg:pb-24 lg:pt-36">
            <h1 className="text-balance text-[clamp(1.95rem,5.6vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.032em]">
              <span className="block text-[#E9EDF7]">Stop answering tickets.</span>
              <span className="mt-1 block sm:mt-1.5">
                <WarpText text="Start resolving them." />
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-[34rem] text-[15px] leading-relaxed text-slate-400 sm:text-base">
              Give your support team the context, knowledge, and agents they need
              to solve—not just respond.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="w-full rounded-lg bg-slate-100 px-5 py-2.5 text-center text-[14px] font-medium text-[#0B1220] transition-colors hover:bg-white sm:w-auto"
              >
                Get Started
              </Link>
              <a
                href="#product-preview"
                className="w-full rounded-lg border border-white/[0.12] px-5 py-2.5 text-center text-[14px] font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-slate-100 sm:w-auto"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="pb-20 lg:pb-28">
            <HeroVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}
