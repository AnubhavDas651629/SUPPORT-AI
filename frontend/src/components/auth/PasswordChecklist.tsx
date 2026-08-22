import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mirrors the backend rule in `UserCreate.validate_password` (min 8 chars). */
const RULES: { id: string; label: string; test: (v: string) => boolean }[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.trim().length >= 8 },
  { id: "case", label: "Upper and lower case", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "number", label: "A number or symbol", test: (v) => /[\d\W]/.test(v) },
];

/** The rules the backend itself enforces — the rest are advisory. */
export function passwordIssues(password: string): string[] {
  return RULES.filter((r) => r.id === "length" && !r.test(password)).map((r) => r.label);
}

export function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;

  return (
    <ul className="space-y-1" aria-live="polite">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        const required = rule.id === "length";
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-[12px]",
              ok ? "text-success" : required ? "text-muted" : "text-subtle",
            )}
          >
            {ok ? <Check className="size-3.5" /> : <X className="size-3.5 opacity-50" />}
            {rule.label}
            {!required && <span className="text-subtle">(recommended)</span>}
          </li>
        );
      })}
    </ul>
  );
}
