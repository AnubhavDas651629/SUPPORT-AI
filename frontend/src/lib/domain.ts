/**
 * Presentation rules for backend enums — one place, so a status renders the
 * same way on every screen.
 */
import type { BadgeTone } from "@/components/ui/Badge";
import type {
  DocumentStatus,
  MessageRole,
  OrganizationRole,
  PlanTier,
  TicketPriority,
  TicketStatus,
} from "@/lib/api/types";

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; tone: BadgeTone; open: boolean }
> = {
  OPEN: { label: "Open", tone: "warning", open: true },
  IN_PROGRESS: { label: "In progress", tone: "info", open: true },
  WAITING_CUSTOMER: { label: "Waiting on customer", tone: "neutral", open: true },
  RESOLVED: { label: "Resolved", tone: "success", open: false },
  CLOSED: { label: "Closed", tone: "neutral", open: false },
};

export const TICKET_PRIORITY_META: Record<
  TicketPriority,
  { label: string; tone: BadgeTone; rank: number }
> = {
  LOW: { label: "Low", tone: "neutral", rank: 1 },
  MEDIUM: { label: "Medium", tone: "info", rank: 2 },
  HIGH: { label: "High", tone: "warning", rank: 3 },
  URGENT: { label: "Urgent", tone: "danger", rank: 4 },
};

export const DOCUMENT_STATUS_META: Record<
  DocumentStatus,
  { label: string; tone: BadgeTone }
> = {
  UPLOADING: { label: "Uploading", tone: "neutral" },
  PROCESSING: { label: "Indexing", tone: "info" },
  READY: { label: "Ready", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const ROLE_META: Record<
  OrganizationRole,
  { label: string; tone: BadgeTone; description: string }
> = {
  OWNER: {
    label: "Owner",
    tone: "accent",
    description:
      "Full control. Only owners can change billing, API keys, webhooks and organization settings.",
  },
  ADMIN: {
    label: "Admin",
    tone: "info",
    description: "Manages members, knowledge bases and the support queue.",
  },
  SUPPORT: {
    label: "Support",
    tone: "neutral",
    description: "Works the inbox — replies, assigns and resolves escalations.",
  },
  MEMBER: {
    label: "Member",
    tone: "neutral",
    description: "Read access to conversations, knowledge and analytics.",
  },
};

export const MESSAGE_ROLE_META: Record<
  MessageRole,
  { label: string; align: "left" | "right" }
> = {
  USER: { label: "Customer", align: "left" },
  ASSISTANT: { label: "Support-AI", align: "right" },
  SUPPORT: { label: "Human agent", align: "right" },
  SYSTEM: { label: "System", align: "left" },
};

export const PLAN_META: Record<
  PlanTier,
  { label: string; tone: BadgeTone; blurb: string }
> = {
  FREE: { label: "Free", tone: "neutral", blurb: "For evaluating Support-AI" },
  PRO: { label: "Pro", tone: "accent", blurb: "For teams running live support" },
  ENTERPRISE: {
    label: "Enterprise",
    tone: "info",
    blurb: "For high-volume, multi-team operations",
  },
};

/** Owner-gated actions, matching the checks the backend services enforce. */
export function canManageOrganization(role: OrganizationRole | null): boolean {
  return role === "OWNER";
}

/** Members and admins can work the queue; every role can read. */
export function canWorkQueue(role: OrganizationRole | null): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "SUPPORT";
}

export function isOpenStatus(status: TicketStatus): boolean {
  return TICKET_STATUS_META[status].open;
}
