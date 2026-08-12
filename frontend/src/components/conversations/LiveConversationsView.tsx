"use client";

import React, { useState, useEffect } from "react";
import { ConversationListPane, ConversationItem } from "./ConversationListPane";
import { ConversationDetailWorkspace } from "./ConversationDetailWorkspace";
import { LiveAiTestDrawer } from "@/components/dashboard/LiveAiTestDrawer";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function LiveConversationsView() {
  const { currentOrg } = useOrganization();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const loadConversations = async () => {
    if (!currentOrg) return;
    setIsLoading(true);

    try {
      const res = await api.get(`/conversations?organization_id=${currentOrg.id}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: ConversationItem[] = res.data.map((c: any) => ({
          id: c.id,
          title: c.title || "Website Visitor Chat",
          updated_at: new Date(c.updated_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          messages_count: 2,
          last_message: "Customer query in progress...",
          sentiment: "neutral",
          is_escalated: false,
        }));
        setConversations(mapped);
        setSelectedConversation(mapped[0]);
      } else {
        setConversations([]);
        setSelectedConversation(null);
      }
    } catch (err) {
      console.warn("Could not load conversations:", err);
      setConversations([]);
      setSelectedConversation(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentOrg]);

  const handleEscalated = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, is_escalated: true } : c))
    );
  };

  return (
    <div className="flex gap-4 max-w-7xl mx-auto h-full">
      {/* Left List Pane */}
      <ConversationListPane
        conversations={conversations}
        isLoading={isLoading}
        selectedId={selectedConversation?.id || ""}
        onSelectConversation={setSelectedConversation}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Right Detail Workspace */}
      <ConversationDetailWorkspace
        conversation={selectedConversation}
        onEscalated={handleEscalated}
      />

      {/* Simulator Drawer for testing */}
      <LiveAiTestDrawer
        isOpen={isSimulatorOpen}
        onClose={() => {
          setIsSimulatorOpen(false);
          loadConversations();
        }}
      />
    </div>
  );
}
