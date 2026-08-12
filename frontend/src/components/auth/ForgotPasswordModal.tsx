"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Lock, Key, ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { PasswordCriteria, isPasswordValid } from "./PasswordCriteria";
import { useAuth } from "@/context/AuthContext";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type Step = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

export function ForgotPasswordModal({ isOpen, onClose, initialEmail = "" }: ForgotPasswordModalProps) {
  const { forgotPassword, verifyOTP, resetPassword } = useAuth();

  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savedSafely, setSavedSafely] = useState(false);
  const [resetToken, setResetToken] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "OTP" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      await forgotPassword(email);
      setStep("OTP");
      setResendTimer(60);
      setCanResend(false);
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Could not send verification code. Please check your email.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle pasting multi-digit code
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input if filled
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const token = await verifyOTP(email, fullOtp);
      setResetToken(token);
      setStep("NEW_PASSWORD");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(newPassword)) {
      setErrorMsg("Please satisfy all password strength criteria.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!savedSafely) {
      setErrorMsg("Please confirm that you have saved your password safely.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await resetPassword(resetToken, newPassword);
      setStep("SUCCESS");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366F1", "#8B5CF6", "#EC4899", "#10B981"],
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header Background with 3D-Style Icon */}
        <div className="relative pt-8 pb-6 px-6 bg-gradient-to-b from-indigo-50/80 via-purple-50/40 to-white flex flex-col items-center justify-center text-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Glowing 3D Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center mb-3 transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-white/90 backdrop-blur rounded-[14px] flex items-center justify-center text-indigo-600">
              {step === "EMAIL" && <Lock className="w-8 h-8 stroke-[2.2]" />}
              {step === "OTP" && <Key className="w-8 h-8 stroke-[2.2] animate-pulse" />}
              {(step === "NEW_PASSWORD" || step === "SUCCESS") && (
                <ShieldCheck className="w-8 h-8 stroke-[2.2] text-indigo-600" />
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {step === "EMAIL" && "Reset Password"}
            {step === "OTP" && "Verification code"}
            {step === "NEW_PASSWORD" && "Set Password"}
            {step === "SUCCESS" && "Password Updated!"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {step === "EMAIL" && "Enter your email address to receive a 6-digit verification code."}
            {step === "OTP" && `We just sent a verification code to ${email}. Enter it below.`}
            {step === "NEW_PASSWORD" && "Set a strong password to keep your account safe."}
            {step === "SUCCESS" && "Your password has been changed successfully. You can now sign in."}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 pt-2">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === "EMAIL" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@acme.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              {/* 6 Digit Input Boxes */}
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-inner"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpDigits.some((d) => !d)}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Code"}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div>
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    disabled={!canResend || isLoading}
                    onClick={handleSendOTP}
                    className={`font-semibold ${
                      canResend ? "text-indigo-600 hover:underline cursor-pointer" : "text-slate-400"
                    }`}
                  >
                    Resend {resendTimer > 0 && `(${resendTimer}s)`}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === "NEW_PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password Saved Safely Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={savedSafely}
                  onChange={(e) => setSavedSafely(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="font-medium">Password Saved Safely?</span>
              </label>

              {/* Live Password Criteria Checklist */}
              <PasswordCriteria password={newPassword} />

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid(newPassword) || newPassword !== confirmPassword || !savedSafely}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </form>
          )}

          {/* STEP 4: Success State */}
          {step === "SUCCESS" && (
            <div className="text-center space-y-4 py-2">
              <p className="text-sm text-slate-600">
                You can now proceed to log in with your updated credentials.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
