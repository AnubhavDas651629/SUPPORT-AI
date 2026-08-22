"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { PasswordChecklist, passwordIssues } from "@/components/auth/PasswordChecklist";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { useAuth } from "@/context/AuthContext";
import { useAsyncAction } from "@/lib/hooks";

export default function RegisterPage() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const issues = passwordIssues(password);
  const nameValid = fullName.trim().length > 0;
  const emailValid = /.+@.+\..+/.test(email.trim());
  const canSubmit = nameValid && emailValid && issues.length === 0;

  const submit = useAsyncAction(async () => {
    await register({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
    });
    router.push("/dashboard");
  });

  const withGoogle = useAsyncAction(async (idToken: string) => {
    await googleLogin(idToken);
    router.push("/dashboard");
  });

  const error = submit.error ?? withGoogle.error;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Connect your documentation and start resolving requests in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="rounded font-medium text-accent-text hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (canSubmit) submit.run();
        }}
        className="space-y-4"
        noValidate
      >
        {error && <InlineAlert>{error}</InlineAlert>}

        <Field
          label="Full name"
          htmlFor="full_name"
          required
          error={touched && !nameValid ? "Enter your name." : null}
        >
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            required
            maxLength={100}
            aria-invalid={touched && !nameValid}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        </Field>

        <Field
          label="Work email"
          htmlFor="email"
          required
          error={touched && !emailValid ? "Enter a valid email address." : null}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={touched && !emailValid}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>

        <div className="space-y-2">
          <Field
            label="Password"
            htmlFor="password"
            required
            error={touched && issues.length > 0 ? issues[0] : null}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              aria-invalid={touched && issues.length > 0}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <PasswordChecklist password={password} />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={submit.pending}
        >
          Create account
        </Button>

        <p className="text-[12px] leading-relaxed text-subtle">
          You&apos;ll create your organization on the next step. It owns your knowledge
          bases, conversations, members and API keys.
        </p>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11.5px] uppercase tracking-[0.08em] text-subtle">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignIn onCredential={(token) => withGoogle.run(token)} text="signup_with" />
    </AuthLayout>
  );
}
