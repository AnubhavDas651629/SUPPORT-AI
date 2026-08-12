"use client";

import React, { useState, useEffect } from "react";
import { TicketListPane } from "./TicketListPane";
import { TicketDetailWorkspace } from "./TicketDetailWorkspace";
import { TicketItem, TicketPriority, TicketStatus } from "@/types/dashboard";
import { CreateTicketModal } from "@/components/dashboard/CreateTicketModal";
import { useOrganization } from "@/context/OrganizationContext";
import { api } from "@/lib/api";

export function TicketInboxView() {
  const { currentOrg } = useOrganization();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  const loadTickets = async () => {
    if (!currentOrg) return;
    setIsLoading(true);

    try {
      const res = await api.get(`/tickets?organization_id=${currentOrg.id}`);
      const items = res.data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        const mapped: TicketItem[] = items.map((t: any) => ({
          id: t.id,
          organization_id: t.organization_id,
          conversation_id: t.conversation_id,
          subject: t.subject || "Customer Support Escalation",
          customer_name: "Customer",
          customer_email: "customer@example.com",
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to_user_id ? "Assigned Agent" : "Unassigned",
          messages_count: 3,
          attachments_count: 0,
          sla_deadline: "4 hours left",
          ai_confidence: t.created_by_ai ? 100 : 0,
          created_at: new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          updated_at: new Date(t.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setTickets(mapped);
        setSelectedTicket(mapped[0]);
      } else {
        setTickets([]);
        setSelectedTicket(null);
      }
    } catch (err) {
      console.warn("Could not load tickets:", err);
      setTickets([]);
      setSelectedTicket(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [currentOrg]);

  const handleStatusChange = (status: TicketStatus) => {
    if (!selectedTicket) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, status } : t))
    );
    setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    if (!selectedTicket) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, priority } : t))
    );
    setSelectedTicket((prev) => (prev ? { ...prev, priority } : null));
  };

  const handleNewTicketCreated = (newTicket: TicketItem) => {
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
  };

  return (
    <div className="flex gap-4 max-w-7xl mx-auto h-full">
      {/* Left Ticket List Pane */}
      <TicketListPane
        tickets={tickets}
        isLoading={isLoading}
        selectedTicketId={selectedTicket?.id || ""}
        onSelectTicket={setSelectedTicket}
        onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
      />

      {/* Right Active Ticket Detail Workspace */}
      <TicketDetailWorkspace
        ticket={selectedTicket}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onCreated={handleNewTicketCreated}
      />
    </div>
  );
}
