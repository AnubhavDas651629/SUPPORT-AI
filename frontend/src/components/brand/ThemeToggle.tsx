"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/Button";

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  // next-themes leaves resolvedTheme undefined until it has read the document,
  // which is exactly the "not hydrated yet" signal — no mounted flag needed.
  const { resolvedTheme, setTheme } = useTheme();

  if (!resolvedTheme) {
    return (
      <span
        aria-hidden="true"
        className={size === "sm" ? "block size-8" : "block size-9.5"}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <IconButton
      label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      size={size}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </IconButton>
  );
}
