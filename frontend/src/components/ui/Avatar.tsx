import { cn } from "@/lib/utils";

/** Deterministic tint so the same name always gets the same colour. */
const TINTS = [
  "bg-[#e0e7ff] text-[#3730a3] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]",
  "bg-[#dcfce7] text-[#166534] dark:bg-[#052e16] dark:text-[#86efac]",
  "bg-[#fef3c7] text-[#854d0e] dark:bg-[#292014] dark:text-[#fcd34d]",
  "bg-[#fee2e2] text-[#991b1b] dark:bg-[#2a1215] dark:text-[#fca5a5]",
  "bg-[#cffafe] text-[#155e75] dark:bg-[#083344] dark:text-[#67e8f9]",
  "bg-[#f3e8ff] text-[#6b21a8] dark:bg-[#2a1440] dark:text-[#d8b4fe]",
];

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const tint = TINTS[hash % TINTS.length];
  const sizes = {
    xs: "size-5 text-[9px]",
    sm: "size-7 text-[10.5px]",
    md: "size-9 text-xs",
    lg: "size-11 text-sm",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide",
        sizes[size],
        tint,
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
