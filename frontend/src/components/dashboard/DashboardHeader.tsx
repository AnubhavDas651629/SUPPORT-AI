"use client";

import React, { useState } from "react";
import {
  Search,
  Command,
  Bell,
  Plus,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrganization } from "@/context/OrganizationContext";

interface DashboardHeaderProps {
  title: string;
  onOpenCommandPalette: () => void;
  onOpenNewTicket: () => void;
  onOpenLiveTester: () => void;
}

export function DashboardHeader({
  title,
  onOpenCommandPalette,
  onOpenNewTicket,
  onOpenLiveTester,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const { currentOrg, subscription } = useOrganization();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Section Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>

        {/* Live System Health Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Gateway Operational</span>
        </div>
      </div>

      {/* Center: Global Search & Command Bar (matches Inspo Search Bar) */}
      <div className="flex-1 max-w-md mx-6 hidden sm:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl text-xs text-slate-400 transition cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            <span className="text-slate-400 group-hover:text-slate-600">Search or type a command...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-500 font-bold shadow-2xs">
            <Command className="w-3 h-3" /> F
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action CTAs, Notifications, & Profile */}
      <div className="flex items-center gap-3">
        {/* Test AI Live Chat Button */}
        <button
          type="button"
          onClick={onOpenLiveTester}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200/60 text-xs font-semibold transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-600" />
          <span>Test AI Live</span>
        </button>

        {/* Create Ticket / Quick Action CTA (matches inspo '+ New Project' button) */}
        <button
          type="button"
          onClick={onOpenNewTicket}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Ticket</span>
        </button>

        {/* User Profile Pill & Dropdown (matches inspo avatar icon) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-2xl hover:bg-slate-50 border border-slate-200/80 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden md:inline">
              {user?.full_name || user?.email?.split("@")[0] || "User"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.full_name || "Support AI Operator"}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>

              <div className="space-y-0.5 my-1">
                <button
                  type="button"
                  onClick={() => alert("Workspace: " + currentOrg?.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Role: Owner</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
