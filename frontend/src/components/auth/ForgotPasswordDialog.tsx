"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { useAsyncAction } from "@/lib/hooks";
import { PasswordChecklist, passwordIssues } from "./PasswordChecklist";

type Step = "email" | "otp" | "reset" | "done";

/**
 * The three-call reset flow the backend implements: request an OTP (emailed
 * via the Celery high_priority queue), exchange it for a short-lived reset
 * token, then set the new password.
 *
 * All three calls go through the application's AuthContext so there is exactly
 * one place that talks to the auth endpoints.
 */
export function ForgotPasswordDialog({
  open,
  onClose,
  initialEmail = "",
}: {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}) {
  const { forgotPassword, verifyOTP, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function reset() {
    setStep("email");
    setOtp("");
    setResetToken("");
    setPassword("");
    setNotice(null);
  }

  const sendOtp = useAsyncAction(async () => {
    setNotice(await forgotPassword(email));
    setStep("otp");
  });

  const verifyOtp = useAsyncAction(async () => {
    setResetToken(await verifyOTP(email, otp.trim()));
    setNotice(null);
    setStep("reset");
  });

  const submitReset = useAsyncAction(async () => {
    setNotice(await resetPassword(resetToken, password));
    setStep("done");
  });

  const issues = passwordIssues(password);
  const activeError = sendOtp.error ?? verifyOtp.error ?? submitReset.error;

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        // Let the close animation finish before resetting the visible step.
        setTimeout(reset, 200);
      }}
      title="Reset your password"
      description={
        {
          email: "We'll email you a one-time code.",
          otp: "Enter the code we sent you.",
          reset: "Choose a new password.",
          done: "",
        }[step]
      }
      size="sm"
      footer={
        step === "done" ? (
          <Button size="sm" variant="primary" onClick={onClose}>
            Back to sign in
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={onClose}>
              Cancel
            </Button>
            {step === "email" && (
              <Button
                size="sm"
                variant="primary"
                loading={sendOtp.pending}
                disabled={!email.includes("@")}
                onClick={() => sendOtp.run()}
              >
                Send code
              </Button>
            )}
            {step === "otp" && (
              <Button
                size="sm"
                variant="primary"
                loading={verifyOtp.pending}
                disabled={otp.trim().length < 4}
                onClick={() => verifyOtp.run()}
              >
                Verify code
              </Button>
            )}
            {step === "reset" && (
              <Button
                size="sm"
                variant="primary"
                loading={submitReset.pending}
                disabled={issues.length > 0}
                onClick={() => submitReset.run()}
              >
                Set new password
              </Button>
            )}
          </>
        )
      }
    >
      <div className="space-y-4">
        {activeError && <InlineAlert>{activeError}</InlineAlert>}
        {notice && step !== "email" && <InlineAlert tone="info">{notice}</InlineAlert>}

        {step === "email" && (
          <Field label="Email address" htmlFor="reset-email" required>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoFocus
            />
          </Field>
        )}

        {step === "otp" && (
          <Field
            label="One-time code"
            htmlFor="reset-otp"
            required
            hint={`Sent to ${email}. Codes expire after a few minutes.`}
          >
            <Input
              id="reset-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="font-code tracking-[0.3em]"
              autoFocus
            />
          </Field>
        )}

        {step === "reset" && (
          <div className="space-y-3">
            <Field label="New password" htmlFor="reset-password" required>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </Field>
            <PasswordChecklist password={password} />
          </div>
        )}

        {step === "done" && (
          <p className="text-sm leading-relaxed text-muted">
            Your password has been updated. Sign in with your new password.
          </p>
        )}
      </div>
    </Dialog>
  );
}
