"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOrganization } from "@/context/OrganizationContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TicketInboxView } from "@/components/tickets/TicketInboxView";
import { KnowledgeBaseManagerView } from "@/components/knowledge/KnowledgeBaseManagerView";
import { AssistantSettingsView } from "@/components/assistant/AssistantSettingsView";
import { DeveloperPortalView } from "@/components/developer/DeveloperPortalView";
import { UsageAnalyticsView } from "@/components/billing/UsageAnalyticsView";
import { LiveConversationsView } from "@/components/conversations/LiveConversationsView";
import { WorkspaceSettingsView } from "@/components/settings/WorkspaceSettingsView";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { currentOrg, isLoading: isOrgLoading } = useOrganization();

  const [activeTab, setActiveTab] = useState("overview");
  const [isLiveTesterOpen, setIsLiveTesterOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Keyboard shortcut listener for Command Palette (⌘K or ⌘F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "f")) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getTabTitle = () => {
    switch (activeTab) {
      case "tickets":
        return "Escalated Tickets & Helpdesk";
      case "conversations":
        return "Live Widget Conversations";
      case "knowledge":
        return "Knowledge Base & Vector Store";
      case "assistant":
        return "AI Assistant Studio & Widget";
      case "developer":
        return "Developer Hub & API Gateway";
      case "analytics":
        return "Usage, Quotas & Subscription Billing";
      case "settings":
        return "Workspace Organization & Team Settings";
      default:
        return "Command Center";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Permanent Left Sidebar Navigation */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <DashboardHeader
          title={getTabTitle()}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNewTicket={() => setIsNewTicketOpen(true)}
          onOpenLiveTester={() => setIsLiveTesterOpen(true)}
        />

        {/* Dynamic Content Body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {activeTab === "tickets" ? (
            <TicketInboxView />
          ) : activeTab === "conversations" ? (
            <LiveConversationsView />
          ) : activeTab === "knowledge" ? (
            <KnowledgeBaseManagerView />
          ) : activeTab === "assistant" ? (
            <AssistantSettingsView />
          ) : activeTab === "developer" ? (
            <DeveloperPortalView />
          ) : activeTab === "analytics" ? (
            <UsageAnalyticsView />
          ) : activeTab === "settings" ? (
            <WorkspaceSettingsView />
          ) : (
            <DashboardOverview
              onOpenLiveTester={() => setIsLiveTesterOpen(true)}
              isLiveTesterOpen={isLiveTesterOpen}
              setIsLiveTesterOpen={setIsLiveTesterOpen}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
              isNewTicketOpen={isNewTicketOpen}
              setIsNewTicketOpen={setIsNewTicketOpen}
              isCommandPaletteOpen={isCommandPaletteOpen}
              setIsCommandPaletteOpen={setIsCommandPaletteOpen}
              isUpgradeOpen={isUpgradeOpen}
              setIsUpgradeOpen={setIsUpgradeOpen}
              onNavigateToTickets={() => setActiveTab("tickets")}
              onNavigateToKnowledge={() => setActiveTab("knowledge")}
              onNavigateToDeveloper={() => setActiveTab("developer")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
