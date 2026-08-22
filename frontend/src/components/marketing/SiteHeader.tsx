"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Container } from "./Section";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#agents", label: "Agents" },
  { href: "#knowledge", label: "Knowledge" },
  { href: "#developers", label: "Developers" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent the page scrolling behind the open mobile panel.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-200",
        scrolled || open
          ? "border-b border-line bg-bg/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="rounded-control" aria-label="Support-AI home">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-control px-3 py-2 text-[13.5px] text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle size="sm" />
            <ButtonLink href="/login" size="sm" variant="ghost" className="hidden sm:inline-flex">
              Sign in
            </ButtonLink>
            <ButtonLink href="/register" size="sm" variant="primary">
              Get started
            </ButtonLink>
            <IconButton
              label={open ? "Close menu" : "Open menu"}
              size="sm"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </IconButton>
          </div>
        </div>
      </Container>

      {open && (
        <div className="border-t border-line bg-bg lg:hidden">
          <Container>
            <nav aria-label="Mobile" className="py-3">
              <ul className="space-y-0.5">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-control px-2 py-2.5 text-[14px] text-muted hover:bg-surface-2 hover:text-fg"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li className="pt-2">
                  <a
                    href="/login"
                    className="block rounded-control px-2 py-2.5 text-[14px] font-medium text-fg hover:bg-surface-2"
                  >
                    Sign in
                  </a>
                </li>
              </ul>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
