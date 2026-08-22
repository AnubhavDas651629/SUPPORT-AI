"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { useOrganization } from "@/context/OrganizationContext";
import { PLAN_META } from "@/lib/domain";
import { Meter } from "@/components/charts/Meter";
import { formatBytes } from "@/lib/utils";
import { NAV_SECTIONS, activeNavHref } from "./navigation";
import { OrgSwitcher } from "./OrgSwitcher";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeNavHref(pathname);
  const { subscription, usage } = useOrganization();
  const plan = subscription ? PLAN_META[subscription.plan_tier] : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="rounded-control"
          aria-label="Support-AI dashboard home"
        >
          <Logo />
        </Link>
      </div>

      <div className="border-b border-line p-3">
        <OrgSwitcher onNavigate={onNavigate} />
      </div>

      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-2.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-subtle">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = active === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13px] transition-colors",
                        isActive
                          ? "bg-surface-2 font-medium text-fg"
                          : "text-muted hover:bg-surface-2/60 hover:text-fg",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-accent-text" : "text-subtle group-hover:text-muted",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.preview && (
                        <span
                          title="Preview data — not backed by a live endpoint yet"
                          className="ml-auto size-1.5 shrink-0 rounded-full bg-warning"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {subscription && (
        <div className="shrink-0 border-t border-line p-3">
          <div className="rounded-panel border border-line bg-bg-inset p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-fg">
                {plan?.label} plan
              </span>
              {subscription.plan_tier === "FREE" && (
                <Link
                  href="/dashboard/settings/billing"
                  onClick={onNavigate}
                  className="inline-flex items-center gap-0.5 rounded text-[12px] font-medium text-accent-text hover:underline"
                >
                  Upgrade
                  <ArrowUpRight className="size-3" />
                </Link>
              )}
            </div>
            {usage && (
              <div className="mt-2.5 space-y-2.5">
                <Meter
                  label="AI responses"
                  used={usage.ai_responses.used}
                  limit={usage.ai_responses.limit}
                />
                <Meter
                  label="Storage"
                  used={usage.storage_bytes.used}
                  limit={usage.storage_bytes.limit}
                  formatValue={formatBytes}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
      <SidebarContent />
    </aside>
  );
}
