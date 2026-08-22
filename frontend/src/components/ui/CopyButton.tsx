"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  variant = "secondary",
  className,
}: {
  value: string;
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be unavailable outside a secure context — fall back silently.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button size={size} variant={variant} onClick={copy} className={className}>
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
