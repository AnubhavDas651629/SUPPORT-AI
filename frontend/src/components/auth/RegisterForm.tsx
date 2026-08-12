"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User as UserIcon, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SocialButtons } from "./SocialButtons";
import { PasswordCriteria, isPasswordValid } from "./PasswordCriteria";
import { useAuth } from "@/context/AuthContext";

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    if (!isPasswordValid(password)) {
      setErrorMessage("Please satisfy all password criteria below.");
      return;
    }

    setErrorMessage("");

    try {
      await register({
        full_name: fullName,
        email: email,
        password: password,
      });
      router.push("/onboarding");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setErrorMessage(detail);
      } else if (Array.isArray(detail)) {
        setErrorMessage(detail[0]?.msg || "Registration failed.");
      } else {
        setErrorMessage("Could not create account. Please try again.");
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Step Label — matches onboarding accent label style */}
      <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-600 block mb-3 self-start">
        GET STARTED
      </span>

      {/* Official Logo */}
      <div className="mb-5 flex items-center justify-start w-full">
        <Logo height={36} width={160} />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight w-full mb-1">
        Create your account
      </h1>
      <p className="text-sm text-slate-500 mb-7 w-full">
        Get started with Support AI in less than 2 minutes.
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4 mt-1">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alice Smith"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-xs"
            />
          </div>
        </div>

        {/* Work Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@acme.com"
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

        {/* Live Password Criteria Checklist */}
        {password.length > 0 && <PasswordCriteria password={password} />}

        {/* Primary CTA — same fuchsia style as onboarding */}
        <button
          type="submit"
          disabled={isLoading || !fullName || !email || !isPasswordValid(password)}
          className="w-full py-3 px-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 text-white font-semibold text-sm shadow-md shadow-fuchsia-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-3"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <>
              <span>Create account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center text-xs text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-fuchsia-600 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
