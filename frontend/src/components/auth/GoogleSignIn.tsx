"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { InlineAlert } from "@/components/ui/States";

/**
 * Renders Google's own sign-in button. Its `credential` is the ID token that
 * `POST /auth/google` verifies server-side (`AuthService.google_login`), so
 * this is the flow the backend actually accepts — `useGoogleLogin`'s implicit
 * mode hands back an access token, which the backend rejects.
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID; without it the button is replaced by
 * a note rather than a control that silently fails.
 */
export function GoogleSignIn({
  onCredential,
  text = "signin_with",
}: {
  onCredential: (idToken: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  const [error, setError] = useState<string | null>(null);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <p className="rounded-control border border-line bg-surface-2 px-3 py-2.5 text-center text-[12.5px] text-muted">
        Google sign-in becomes available once{" "}
        <code className="font-mono text-[11.5px] text-fg">
          NEXT_PUBLIC_GOOGLE_CLIENT_ID
        </code>{" "}
        is configured.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && <InlineAlert>{error}</InlineAlert>}
      <div className="flex justify-center [&>div]:w-full">
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              setError(null);
              onCredential(response.credential);
            } else {
              setError("Google did not return a credential. Try again.");
            }
          }}
          onError={() => setError("Google sign-in was cancelled or failed.")}
          // A fixed variant: branching on the resolved theme would render
          // differently on the server than on hydration.
          theme="outline"
          text={text}
          shape="rectangular"
          width="352"
        />
      </div>
    </div>
  );
}
