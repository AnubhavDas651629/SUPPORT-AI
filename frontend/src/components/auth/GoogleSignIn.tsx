"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "next-themes";
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
  // resolvedTheme is undefined until next-themes has read the document, which
  // doubles as the hydration signal for Google's own injected button.
  const { resolvedTheme } = useTheme();
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

  // Google's script paints its own button; hold space until the theme is known
  // so it doesn't flash the wrong variant.
  if (!resolvedTheme) return <div className="h-10" aria-hidden="true" />;

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
          theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
          text={text}
          shape="rectangular"
          width="352"
        />
      </div>
    </div>
  );
}
