import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "./Section";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Agents", href: "#agents" },
      { label: "Knowledge base", href: "#knowledge" },
      { label: "Analytics", href: "#analytics" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API overview", href: "#developers" },
      { label: "Interactive docs", href: "http://localhost:8000/docs" },
      { label: "Webhooks", href: "#developers" },
      { label: "Chat widget", href: "#conversations" },
    ],
  },
  {
    heading: "Workspace",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-inset">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Grounded AI support that investigates, acts and resolves — with every
              step recorded.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-subtle">
                {col.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="rounded text-[13.5px] text-muted transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-subtle">
            © {new Date().getFullYear()} Support-AI. Multi-tenant by design.
          </p>
          <p className="font-mono text-[11px] text-subtle">
            FastAPI · PostgreSQL + pgvector · Celery · Next.js
          </p>
        </div>
      </Container>
    </footer>
  );
}
