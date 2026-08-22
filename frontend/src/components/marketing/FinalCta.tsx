import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "./Section";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-line bg-bg-inset">
      <div
        className="bg-grid pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 80% at 50% 50%, black 20%, transparent 70%)",
        }}
      />
      <Container className="relative">
        <div className="flex flex-col items-center py-20 text-center sm:py-24">
          <h2 className="max-w-2xl text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-fg sm:text-[38px]">
            Point it at your documentation and see what it can already answer.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
            Free to start — one knowledge base, a hundred answers a month, no card.
            Upload a policy doc and ask it something hard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" variant="primary" size="lg">
              Create your account
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/login" size="lg">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
