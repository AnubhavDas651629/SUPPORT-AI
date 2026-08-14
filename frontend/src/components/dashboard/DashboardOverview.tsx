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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Quick Action Launcher Cards (Inspiration 'Recommended Categories' style) */}
      <QuickActionCards
        onOpenLiveTester={() => onOpenLiveTester()}
        onOpenUploadDoc={() => onNavigateToKnowledge ? onNavigateToKnowledge() : alert("Upload Document: Select PDF, DOCX, or TXT for pgvector")}
        onOpenTickets={() => onNavigateToTickets ? onNavigateToTickets() : onOpenNewTicket()}
        onOpenEmbedModal={() => onOpenEmbedModal ? onOpenEmbedModal() : setIsEmbedModalOpen(true)}
        onOpenWebhooks={() => onNavigateToDeveloper ? onNavigateToDeveloper() : onOpenUpgrade?.()}
        onOpenApiKeys={() => onNavigateToDeveloper ? onNavigateToDeveloper() : onOpenUpgrade?.()}
      />

      {/* 2. Real-Time Performance & Quota HUD */}
      <MetricsHUD />

      {/* 3. Priority Human Escalation Ticket Queue (Inspiration list style) */}
      <TicketQueueTable onOpenNewTicket={() => onOpenNewTicket()} />

      {/* 4. Knowledge Base & Vector Documents Ingestion Status */}
      <KnowledgeBaseCard onOpenUploadModal={() => alert("Upload document to pgvector")} />


    </div>
  );
}
