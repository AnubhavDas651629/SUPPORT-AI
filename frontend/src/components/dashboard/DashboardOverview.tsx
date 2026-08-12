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
  isLiveTesterOpen,
  setIsLiveTesterOpen,
  onOpenNewTicket,
  isNewTicketOpen,
  setIsNewTicketOpen,
  isCommandPaletteOpen,
  setIsCommandPaletteOpen,
  isUpgradeOpen,
  setIsUpgradeOpen,
  onNavigateToTickets,
  onNavigateToKnowledge,
  onNavigateToDeveloper,
}: {
  onOpenLiveTester: () => void;
  isLiveTesterOpen: boolean;
  setIsLiveTesterOpen: (open: boolean) => void;
  onOpenNewTicket: () => void;
  isNewTicketOpen: boolean;
  setIsNewTicketOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (open: boolean) => void;
  onNavigateToTickets?: () => void;
  onNavigateToKnowledge?: () => void;
  onNavigateToDeveloper?: () => void;
}) {
  const { currentOrg } = useOrganization();
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  const handleCommandSelect = (key: string) => {
    if (key === "live_test") setIsLiveTesterOpen(true);
    else if (key === "new_ticket") setIsNewTicketOpen(true);
    else if (key === "embed_code") setIsEmbedModalOpen(true);
    else if (key === "upload_doc") onNavigateToKnowledge ? onNavigateToKnowledge() : alert("Document upload dialog triggered");
    else if (key === "webhooks" || key === "api_keys") onNavigateToDeveloper ? onNavigateToDeveloper() : setIsUpgradeOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Quick Action Launcher Cards (Inspiration 'Recommended Categories' style) */}
      <QuickActionCards
        onOpenLiveTester={() => setIsLiveTesterOpen(true)}
        onOpenUploadDoc={() => onNavigateToKnowledge ? onNavigateToKnowledge() : alert("Upload Document: Select PDF, DOCX, or TXT for pgvector")}
        onOpenTickets={() => onNavigateToTickets ? onNavigateToTickets() : setIsNewTicketOpen(true)}
        onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
        onOpenWebhooks={() => onNavigateToDeveloper ? onNavigateToDeveloper() : setIsUpgradeOpen(true)}
        onOpenApiKeys={() => onNavigateToDeveloper ? onNavigateToDeveloper() : setIsUpgradeOpen(true)}
      />

      {/* 2. Real-Time Performance & Quota HUD */}
      <MetricsHUD />

      {/* 3. Priority Human Escalation Ticket Queue (Inspiration list style) */}
      <TicketQueueTable onOpenNewTicket={() => setIsNewTicketOpen(true)} />

      {/* 4. Knowledge Base & Vector Documents Ingestion Status */}
      <KnowledgeBaseCard onOpenUploadModal={() => alert("Upload document to pgvector")} />

      {/* Slide-over Live AI Assistant Testing Drawer */}
      <LiveAiTestDrawer
        isOpen={isLiveTesterOpen}
        onClose={() => setIsLiveTesterOpen(false)}
      />

      {/* Create Manual Ticket Modal */}
      <CreateTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onCreated={(newTicket) => {
          alert(`Escalation Ticket "${newTicket.subject}" created successfully!`);
        }}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleCommandSelect}
      />

      {/* HTML Embed Script Snippet Modal */}
      <EmbedScriptModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
      />

      {/* Plan Upgrade & Billing Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
}
