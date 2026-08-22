"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { useAuth } from "@/context/AuthContext";
import { useAsyncAction } from "@/lib/hooks";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  const next = params.get("next") ?? "/dashboard";
  const expired = params.get("expired") === "1";
  const registered = params.get("registered") === "1";

  const submit = useAsyncAction(async () => {
    await login(email.trim(), password);
    router.push(next);
  });

  const withGoogle = useAsyncAction(async (idToken: string) => {
    await googleLogin(idToken);
    router.push(next);
  });

  const error = submit.error ?? withGoogle.error;

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit.run();
        }}
        className="space-y-4"
        noValidate
      >
        {expired && !error && (
          <InlineAlert tone="warning">
            Your session expired. Sign in again to continue.
          </InlineAlert>
        )}
        {registered && !error && (
          <InlineAlert tone="success">
            Account created. Sign in to get started.
          </InlineAlert>
        )}
        {error && <InlineAlert>{error}</InlineAlert>}

        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="password" className="text-[13px] font-medium text-fg">
              Password<span className="ml-0.5 text-danger">*</span>
            </label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="rounded text-[12.5px] text-accent hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={submit.pending}
          disabled={!email || !password}
        >
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11.5px] uppercase tracking-[0.08em] text-subtle">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignIn onCredential={(token) => withGoogle.run(token)} text="signin_with" />

      <ForgotPasswordDialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={email}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Pick up where your support queue left off."
      footer={
        <>
          New to Support-AI?{" "}
          <Link href="/register" className="rounded font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-72" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
