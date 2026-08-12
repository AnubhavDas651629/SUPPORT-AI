"use client";

import React, { useState } from "react";
import { TicketListPane } from "./TicketListPane";
import { TicketDetailWorkspace } from "./TicketDetailWorkspace";
import { TicketItem, TicketPriority, TicketStatus } from "@/types/dashboard";
import { CreateTicketModal } from "@/components/dashboard/CreateTicketModal";

const INITIAL_TICKETS: TicketItem[] = [
  {
    id: "88392",
    organization_id: "org_1",
    conversation_id: "conv_88392",
    subject: "Refund request for $500 - Order #88392 (VIP Customer)",
    customer_name: "Sarah Jenkins",
    customer_email: "sarah.j@enterprise.com",
    status: "OPEN",
    priority: "URGENT",
    assigned_to: "Unassigned",
    messages_count: 4,
    attachments_count: 2,
    sla_deadline: "1 hour left",
    ai_confidence: 12,
    created_at: "10 mins ago",
    updated_at: "10 mins ago",
  },
  {
    id: "88341",
    organization_id: "org_1",
    conversation_id: "conv_88341",
    subject: "Custom webhook signature validation failing on staging server",
    customer_name: "Alex Rivera",
    customer_email: "alex@techcorp.io",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assigned_to: "Partha Das (You)",
    messages_count: 8,
    attachments_count: 4,
    sla_deadline: "3 hours left",
    ai_confidence: 45,
    created_at: "45 mins ago",
    updated_at: "12 mins ago",
  },
  {
    id: "88290",
    organization_id: "org_1",
    conversation_id: "conv_88290",
    subject: "Knowledge Base DOCX ingestion timeout on 45MB document",
    customer_name: "David Kim",
    customer_email: "david.k@startup.co",
    status: "OPEN",
    priority: "MEDIUM",
    assigned_to: "Unassigned",
    messages_count: 5,
    attachments_count: 1,
    sla_deadline: "8 hours left",
    ai_confidence: 68,
    created_at: "2 hours ago",
    updated_at: "2 hours ago",
  },
  {
    id: "88112",
    organization_id: "org_1",
    conversation_id: "conv_88112",
    subject: "International shipping rates inquiry to Tokyo, Japan",
    customer_name: "Kenji Sato",
    customer_email: "kenji@tokyo-retail.jp",
    status: "RESOLVED",
    priority: "LOW",
    assigned_to: "Auto-AI Deflected",
    messages_count: 4,
    attachments_count: 0,
    sla_deadline: "Completed",
    ai_confidence: 96,
    created_at: "Yesterday",
    updated_at: "Yesterday",
  },
];

export function TicketInboxView() {
  const [tickets, setTickets] = useState<TicketItem[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem>(INITIAL_TICKETS[0]);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  const handleStatusChange = (status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, status } : t))
    );
    setSelectedTicket((prev) => ({ ...prev, status }));
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, priority } : t))
    );
    setSelectedTicket((prev) => ({ ...prev, priority }));
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
        selectedTicketId={selectedTicket.id}
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
