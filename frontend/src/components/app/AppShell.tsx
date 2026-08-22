"use client";

import { useOrganization } from "@/context/OrganizationContext";
import { Spinner } from "@/components/ui/Spinner";
import { DesktopSidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { OrganizationSetup } from "./OrganizationSetup";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, needsOnboarding } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-5 text-subtle" />
        <span className="sr-only">Loading your workspace…</span>
      </div>
    );
  }

  // Every dashboard route is scoped by organization, so there is nothing to
  // show until one exists.
  if (needsOnboarding) return <OrganizationSetup />;

  return (
    <div className="min-h-dvh bg-bg">
      <DesktopSidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
