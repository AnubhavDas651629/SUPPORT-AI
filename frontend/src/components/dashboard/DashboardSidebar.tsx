"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  BookOpen,
  Sliders,
  Webhook,
  BarChart3,
  Settings,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Building2,
  Plus,
  Check,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { name: "Escalated Tickets", href: "/dashboard?tab=tickets", icon: LifeBuoy, badgeKey: "tickets" },
  { name: "Live Conversations", href: "/dashboard?tab=conversations", icon: MessageSquare },
  { name: "Knowledge Base", href: "/dashboard?tab=knowledge", icon: BookOpen },
  { name: "AI Assistant", href: "/dashboard?tab=assistant", icon: Sliders },
  { name: "Organization", href: "/dashboard?tab=organization", icon: Building2 },
  { name: "Webhooks & API", href: "/dashboard?tab=developer", icon: Webhook },
  { name: "Usage & Analytics", href: "/dashboard?tab=analytics", icon: BarChart3 },
];

export function DashboardSidebar({
  activeTab,
  setActiveTab,
  onOpenUpgrade,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpgrade?: () => void;
}) {
  const pathname = usePathname();
  const { organizations, currentOrg, setCurrentOrg, subscription } = useOrganization();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);

  const planTier = subscription?.plan_tier || "FREE";

  // Fetch live open tickets count for the active workspace
  useEffect(() => {
    if (!currentOrg) return;
    async function fetchOpenTickets() {
      try {
        const res = await api.get(`/tickets?organization_id=${currentOrg!.id}`);
        const items = res.data?.items || [];
        const open = items.filter((t: any) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
        setOpenTicketsCount(open);
      } catch (e) {
        setOpenTicketsCount(0);
      }
    }
    fetchOpenTickets();
  }, [currentOrg, activeTab]);

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Top Section: Logo & Org Switcher */}
      <div>
        {/* Brand Logo Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80">
          <Link href="/">
            <Logo height={32} width={130} />
          </Link>
        </div>

        {/* Workspace / Org Switcher Dropdown */}
        <div className="px-4 py-3 relative">
          <button
            type="button"
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {currentOrg?.name ? currentOrg.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentOrg?.name || "Acme Support"}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      planTier === "PRO"
                        ? "bg-fuchsia-100 text-fuchsia-700"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {planTier}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">workspace</span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition" />
          </button>

          {/* Org Switcher Menu */}
          {isOrgDropdownOpen && (
            <div className="absolute top-16 left-4 right-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">
                Workspaces
              </div>
              <div className="space-y-1 my-1 max-h-48 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setCurrentOrg(org);
                      setIsOrgDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      currentOrg?.id === org.id
                        ? "bg-fuchsia-50 text-fuchsia-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{org.name}</span>
                    </div>
                    {currentOrg?.id === org.id && <Check className="w-3.5 h-3.5 text-fuchsia-600" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 mt-1">
                <Link
                  href="/onboarding?new=true"
                  onClick={() => setIsOrgDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-600 hover:text-fuchsia-600 hover:bg-fuchsia-50/50 transition font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation Menu */}
        <div className="px-3 pt-2">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 pb-2 uppercase tracking-wider">
            Menu
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const tabKey = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
              const isSelected = activeTab === tabKey || (tabKey === "commandcenter" && activeTab === "overview");
              const badgeCount = item.badgeKey === "tickets" && openTicketsCount > 0 ? openTicketsCount : null;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    if (tabKey === "commandcenter") setActiveTab("overview");
                    else if (tabKey === "escalatedtickets") setActiveTab("tickets");
                    else if (tabKey === "liveconversations") setActiveTab("conversations");
                    else if (tabKey === "knowledgebase") setActiveTab("knowledge");
                    else if (tabKey === "aiassistant") setActiveTab("assistant");
                    else if (tabKey === "organization") setActiveTab("organization");
                    else if (tabKey === "webhooksapi") setActiveTab("developer");
                    else if (tabKey === "usageanalytics") setActiveTab("analytics");
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-[#FDF2F8] to-[#F5F3FF] dark:from-fuchsia-950/40 dark:to-indigo-950/40 text-fuchsia-700 dark:text-fuchsia-400 border border-fuchsia-200/60 dark:border-fuchsia-800/60 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-fuchsia-600 stroke-[2.3]" : "text-slate-400 stroke-[2]"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {badgeCount !== null && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-fuchsia-600 text-white"
                          : "bg-fuchsia-100 text-fuchsia-700"
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Upgrade Promo Card & Settings */}
      <div className="p-4 space-y-3">
        {/* Inspo-styled Upgrade Promo Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FDF2F8] via-[#FAF5FF] to-[#F5F3FF] border border-fuchsia-200/70 shadow-xs relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-fuchsia-600 fill-fuchsia-600" />
              <h4 className="text-xs font-extrabold text-slate-900">Upgrade your plan</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              {planTier === "FREE"
                ? "Your Free tier includes 100 AI responses/mo. Unlock unlimited RAG & API keys."
                : "Manage enterprise seats, SLA escalation rules, and unlimited vector storage."}
            </p>
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>See plans</span>
            </button>
          </div>
        </div>

        {/* Settings & Help Footer Links */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <a
            href="https://docs.supportai.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </a>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
