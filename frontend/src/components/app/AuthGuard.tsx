"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

/** Redirects unauthenticated visitors to /login, preserving where they were headed. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isBootstrapping, isAuthenticated, router, pathname]);

  if (isBootstrapping || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-5 text-subtle" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
