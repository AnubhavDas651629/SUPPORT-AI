import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";

const PIPELINE = [
  { step: "01", label: "Understand", detail: "Classify the request and load the customer's context." },
  { step: "02", label: "Retrieve", detail: "Search indexed documentation for grounded evidence." },
  { step: "03", label: "Act", detail: "Call your APIs to check or change the underlying record." },
  { step: "04", label: "Resolve", detail: "Answer, or escalate with the full trail attached." },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      {/* Form column */}
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8">
          <Link href="/" className="rounded-control" aria-label="Support-AI home">
            <Logo />
          </Link>
          <ThemeToggle size="sm" />
        </header>

        <main id="main" className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-sm">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 text-[13px] text-muted">{footer}</div>
          </div>
        </main>
      </div>

      {/* Product column — hidden on small screens where it would just be filler */}
      <aside className="relative hidden overflow-hidden border-l border-line bg-bg-inset lg:flex lg:flex-col lg:justify-center">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative px-12 py-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
            The resolution path
          </p>
          <p className="mt-3 max-w-sm text-[19px] font-medium leading-snug tracking-[-0.01em] text-fg">
            Every request runs the same four steps — and every step is recorded.
          </p>

          <ol className="mt-10 max-w-md">
            {PIPELINE.map((item, i) => (
              <li key={item.step} className="relative flex gap-4 pb-8 last:pb-0">
                {i < PIPELINE.length - 1 && (
                  <span
                    className="absolute left-[13px] top-7 h-full w-px bg-line-strong"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-code text-[10px] font-medium text-muted">
                  {item.step}
                </span>
                <div className="pt-0.5">
                  <p className="text-[13.5px] font-medium text-fg">{item.label}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
