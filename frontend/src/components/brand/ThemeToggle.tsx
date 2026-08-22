"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/Button";

/**
 * Renders identically on the server and on first paint: both icons are always
 * in the DOM and the active theme's `.dark` class on <html> decides which is
 * visible. Branching on the resolved theme during render would hydrate
 * differently from the server HTML.
 */
export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <IconButton
      label="Toggle light and dark theme"
      size={size}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </IconButton>
  );
}
