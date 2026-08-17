"use client";

import React, { useState, useEffect } from "react";
import { ConversationListPane, ConversationItem } from "./ConversationListPane";
import { ConversationDetailWorkspace } from "./ConversationDetailWorkspace";
import { ConversationSessionMetadata } from "./ConversationSessionMetadata";
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
    if (selectedConversation?.id === convId) {
      setSelectedConversation(prev => prev ? { ...prev, is_escalated: true } : null);
    }
  };

  return (
    <div className="flex max-w-[1400px] mx-auto h-[calc(100vh-120px)] bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
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

      {/* Session Intelligence Sidebar */}
      {selectedConversation && (
        <ConversationSessionMetadata
          conversation={selectedConversation}
        />
      )}

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
