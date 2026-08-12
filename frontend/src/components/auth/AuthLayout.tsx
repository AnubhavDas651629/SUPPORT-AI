"use client";

import React from "react";
import Link from "next/link";
import { ConstellationCanvas } from "./ConstellationCanvas";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#F8FAFC]">
      {/* Outer Card — same proportions as OnboardingWizard */}
      <div className="w-full max-w-6xl min-h-[640px] bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">

        {/* Left Column: Auth Form (5 cols to match onboarding right-panel feel) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-10 md:p-12 overflow-y-auto">
          <div className="w-full max-w-sm mx-auto my-auto">
            {children}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">
            By continuing, you agree to our{" "}
            <Link href="#" className="underline hover:text-slate-600 transition">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-slate-600 transition">
              Privacy Policy
            </Link>
            .
          </div>
        </div>

        {/* Right Column: Feature Showcase Canvas (7 cols) */}
        <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-b from-[#FDF2F8]/60 via-[#F5F3FF]/40 to-slate-50 border-l border-slate-100 items-center justify-center relative">
          <ConstellationCanvas />
        </div>
      </div>
    </div>
  );
}
