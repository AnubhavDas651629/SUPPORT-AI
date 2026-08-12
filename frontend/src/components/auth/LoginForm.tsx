"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SocialButtons } from "./SocialButtons";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);
      await login(formData);

      // Route to dashboard if org exists, otherwise onboarding
      try {
        const orgRes = await api.get("/organizations");
        if (Array.isArray(orgRes.data) && orgRes.data.length > 0) {
          router.push("/dashboard");
          return;
        }
      } catch (orgErr) {
        // Fallback to onboarding
      }

      router.push("/onboarding");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setErrorMessage(detail);
      } else if (Array.isArray(detail)) {
        setErrorMessage(detail[0]?.msg || "Invalid credentials.");
      } else {
        setErrorMessage("Please enter the correct email and password.");
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Step Label — matches onboarding "STEP X OF 4" style */}
      <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-600 block mb-3 self-start">
        SIGN IN
      </span>

      {/* Official Logo */}
      <div className="mb-5 flex items-center justify-start w-full">
        <Logo height={36} width={160} />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight w-full mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-slate-500 mb-7 w-full">
        Sign in to your Support AI workspace.
      </p>

      {/* Error Alert */}
      {errorMessage && (
        <div className="w-full p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Social Sign-In */}
      <SocialButtons
        onGoogleClick={() => {
          alert("Google OAuth will initialize with backend /api/v1/auth/google");
        }}
        onGithubClick={() => {
          alert("GitHub OAuth login enabled");
        }}
        isLoading={isLoading}
      />

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4 mt-1">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-fuchsia-600 border-slate-300 cursor-pointer"
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-xs font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:underline transition cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary CTA — same style as onboarding "Save and continue" */}
        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full py-3 px-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white font-semibold text-sm shadow-md shadow-fuchsia-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="text-center text-xs text-slate-500 mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="font-semibold text-fuchsia-600 hover:underline">
          Create account
        </Link>
      </div>

      {/* OTP Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}
