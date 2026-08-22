"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { useAsyncAction } from "@/lib/hooks";

const STEPS = [
  "Create your organization — it owns knowledge, conversations and members.",
  "Add a knowledge base and upload the documents your agents should answer from.",
  "Drop the widget on your site, or call the API with an organization API key.",
];

/** Shown when a signed-in user has no organization yet. */
export function OrganizationSetup() {
  const { createOrganization } = useOrganization();
  const { user, logout } = useAuth();
  const [name, setName] = useState("");

  const create = useAsyncAction(async (orgName: string) => {
    await createOrganization(orgName);
  });

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-line px-4 sm:px-6">
        <Logo />
        <button
          onClick={logout}
          className="rounded text-[13px] text-muted hover:text-fg"
        >
          Sign out
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <p className="text-[13px] font-medium text-accent">Step 1 of 3</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.015em] text-fg">
            Create your organization
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}. Everything
            in Support-AI is scoped to an organization — knowledge bases, conversations,
            members and API keys all live inside one.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length >= 2) create.run(name.trim());
            }}
            className="mt-6 space-y-4"
          >
            {create.error && <InlineAlert>{create.error}</InlineAlert>}
            <Field
              label="Organization name"
              htmlFor="setup-org"
              required
              hint="You can rename this later in Settings."
            >
              <Input
                id="setup-org"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Support"
                minLength={2}
                maxLength={100}
                autoFocus
                required
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={create.pending}
              disabled={name.trim().length < 2}
            >
              Create organization
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <ol className="mt-8 space-y-3 border-t border-line pt-6">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-[13px] leading-relaxed">
                <span
                  className={
                    i === 0
                      ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-fg"
                      : "flex size-5 shrink-0 items-center justify-center rounded-full border border-line text-[11px] font-medium text-subtle"
                  }
                >
                  {i + 1}
                </span>
                <span className={i === 0 ? "text-fg" : "text-muted"}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
