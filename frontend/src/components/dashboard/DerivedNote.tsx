import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * States plainly where a number comes from. The backend has no analytics
 * endpoint, so several figures are aggregated client-side — saying so is
 * better than presenting an approximation as a measurement.
 */
export function DerivedNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-[12px] leading-relaxed text-subtle",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
