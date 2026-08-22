import { Check, Minus } from "lucide-react";
import { Section } from "./Section";
import { ButtonLink } from "@/components/ui/Button";
import { PLANS, PLAN_COMPARISON } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <Section
      id="pricing"
      index="09"
      eyebrow="Pricing"
      title="Priced on answers, not seats."
      lede="Start free with a single knowledge base. Move up when your volume does — the limits below are the ones the platform actually enforces."
    >
      <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = plan.tier === "PRO";
          return (
            <div
              key={plan.tier}
              className={cn(
                "flex flex-col p-6 sm:p-7",
                featured ? "bg-surface" : "bg-bg",
              )}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                  {plan.name}
                </h3>
                {featured && (
                  <span className="rounded-full border border-accent-line bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    Most teams
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {plan.tagline}
              </p>

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[32px] font-semibold leading-none tracking-[-0.025em] text-fg">
                  {plan.priceLabel}
                </span>
                <span className="text-[13px] text-subtle">{plan.priceNote}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <ButtonLink
                href={plan.tier === "ENTERPRISE" ? "/register" : "/register"}
                variant={featured ? "primary" : "secondary"}
                fullWidth
                className="mt-7"
              >
                {plan.ctaLabel}
              </ButtonLink>
            </div>
          );
        })}
      </div>

      {/* Limits table — the numbers the backend enforces */}
      <div className="mt-8 overflow-hidden rounded-panel border border-line bg-surface">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <caption className="sr-only">Plan limits compared</caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="border-b border-line bg-surface-2/60 px-4 py-2.5 text-left text-[11.5px] font-medium uppercase tracking-[0.06em] text-subtle"
                >
                  Limit
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.tier}
                    scope="col"
                    className="border-b border-line bg-surface-2/60 px-4 py-2.5 text-right text-[11.5px] font-medium uppercase tracking-[0.06em] text-subtle"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((row) => (
                <tr key={row.label} className="last:[&>td]:border-b-0 last:[&>th]:border-b-0">
                  <th
                    scope="row"
                    className="border-b border-line px-4 py-2.5 text-left text-[13px] font-normal text-muted"
                  >
                    {row.label}
                  </th>
                  {PLANS.map((plan) => {
                    const raw = plan.limits[row.key];
                    const formatted = row.format(raw);
                    return (
                      <td
                        key={plan.tier}
                        className="border-b border-line px-4 py-2.5 text-right text-[13px] tnum text-fg"
                      >
                        {formatted === "yes" ? (
                          <Check
                            className="ml-auto size-4 text-success"
                            aria-label="Included"
                          />
                        ) : formatted === "—" ? (
                          <Minus
                            className="ml-auto size-4 text-subtle"
                            aria-label="Not included"
                          />
                        ) : (
                          formatted
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}
