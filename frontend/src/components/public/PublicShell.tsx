/**
 * Root wrapper for the public surface — the landing page and the auth screens.
 *
 * The `sai-public` class is what scopes the design-system base rules in
 * globals.css (surface background, border-colour default, focus ring) to these
 * screens, leaving the authenticated dashboard styled exactly as it is.
 *
 * It also carries the skip link, since both public layouts render a `#main`
 * landmark for it to target.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sai-public min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-fg"
      >
        Skip to content
      </a>
      {children}
    </div>
  );
}
