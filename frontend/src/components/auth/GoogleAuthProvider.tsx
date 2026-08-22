"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * Only mounts the provider when a client ID is configured. Without this the
 * provider injects Google's Identity Services script into every page —
 * including the dashboard, which never uses it — and logs a console error when
 * the script can't load.
 */
export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
