import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "./Section";
import { ResolutionTrace } from "./ResolutionTrace";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background: a hairline grid that fades out, and one soft accent wash.
          No particles, no gradient mesh — just enough to give the fold depth. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="bg-grid absolute inset-0 opacity-[0.55]"
          style={{
            maskImage:
              "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
        <div
          className="absolute -top-40 left-1/2 h-[420px] w-[840px] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:py-28">
          <div className="max-w-xl">
            <p className="animate-fade-up font-code text-[11px] uppercase tracking-[0.16em] text-subtle">
              Customer support automation
            </p>

            <h1
              className="mt-5 animate-fade-up text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-fg sm:text-[52px] lg:text-[58px]"
              style={{ animationDelay: "60ms" }}
            >
              From question
              <br />
              to resolution.
            </h1>

            <p
              className="mt-5 animate-fade-up text-[16px] leading-relaxed text-muted sm:text-[17px]"
              style={{ animationDelay: "120ms" }}
            >
              Support-AI connects your documentation, customer data and live APIs to
              investigate issues, take action, and resolve requests without the
              back-and-forth.
            </p>

            <div
              className="mt-8 flex animate-fade-up flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "180ms" }}
            >
              <ButtonLink href="/register" variant="primary" size="lg">
                Start free
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#how" size="lg">
                See the resolution path
              </ButtonLink>
            </div>

            <dl
              className="mt-10 grid animate-fade-up grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-3"
              style={{ animationDelay: "240ms" }}
            >
              {[
                { label: "Grounded in", value: "Your docs" },
                { label: "Acts through", value: "Your APIs" },
                { label: "Escalates with", value: "Full trail" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 bg-bg px-4 py-2.5 sm:block sm:py-3"
                >
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-subtle">
                    {item.label}
                  </dt>
                  <dd className="text-[13.5px] font-medium text-fg sm:mt-1">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up lg:pl-4" style={{ animationDelay: "140ms" }}>
            <ResolutionTrace />
          </div>
        </div>
      </Container>
    </section>
  );
}
