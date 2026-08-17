"use client";

import React, { useState } from "react";
import { QuickActionCards } from "./QuickActionCards";
import { MetricsHUD } from "./MetricsHUD";
import { TicketQueueTable } from "./TicketQueueTable";
import { KnowledgeBaseCard } from "./KnowledgeBaseCard";
import { LiveAiTestDrawer } from "./LiveAiTestDrawer";
import { CreateTicketModal } from "./CreateTicketModal";
import { CommandPaletteModal } from "./CommandPaletteModal";
import { EmbedScriptModal } from "./EmbedScriptModal";
import { UpgradeModal } from "./UpgradeModal";
import { useOrganization } from "@/context/OrganizationContext";

import { RecentActivityList } from "./RecentActivityList";

export function DashboardOverview({
  onOpenLiveTester,
  onOpenNewTicket,
  onOpenEmbedModal,
  onNavigateToTickets,
  onNavigateToKnowledge,
  onNavigateToDeveloper,
  onOpenUpgrade,
}: {
  onOpenLiveTester: () => void;
  onOpenNewTicket: () => void;
  onOpenEmbedModal?: () => void;
  onNavigateToTickets?: () => void;
  onNavigateToKnowledge?: () => void;
  onNavigateToDeveloper?: () => void;
  onOpenUpgrade?: () => void;
}) {
  const { currentOrg } = useOrganization();
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  const handleCommandSelect = (key: string) => {
    if (key === "live_test") onOpenLiveTester();
    else if (key === "new_ticket") onOpenNewTicket();
    else if (key === "embed_code" && onOpenEmbedModal) onOpenEmbedModal();
    else if (key === "upload_doc") onNavigateToKnowledge ? onNavigateToKnowledge() : alert("Document upload dialog triggered");
    else if (key === "webhooks" || key === "api_keys") onNavigateToDeveloper ? onNavigateToDeveloper() : onOpenUpgrade?.();
  };

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto pb-12 h-full">
      {/* 1. Quick Action Links Row */}
      <QuickActionCards
        onOpenLiveTester={() => onOpenLiveTester()}
        onOpenUploadDoc={() => onNavigateToKnowledge ? onNavigateToKnowledge() : alert("Upload Document: Select PDF, DOCX, or TXT for pgvector")}
        onOpenTickets={() => onNavigateToTickets ? onNavigateToTickets() : onOpenNewTicket()}
        onOpenEmbedModal={() => onOpenEmbedModal ? onOpenEmbedModal() : setIsEmbedModalOpen(true)}
        onOpenWebhooks={() => onNavigateToDeveloper ? onNavigateToDeveloper() : onOpenUpgrade?.()}
        onOpenApiKeys={() => onNavigateToDeveloper ? onNavigateToDeveloper() : onOpenUpgrade?.()}
      />

      {/* 2. Compact Metrics Row */}
      <MetricsHUD />

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Main Column: Needs Attention List */}
        <div className="lg:col-span-2">
          <TicketQueueTable onOpenNewTicket={() => onOpenNewTicket()} />
        </div>

        {/* Side Column: Recent Activity & Knowledge Base */}
        <div className="space-y-6">
          <RecentActivityList />
          <KnowledgeBaseCard onOpenUploadModal={() => alert("Upload document to pgvector")} />
        </div>
      </div>
    </div>
  );
}
