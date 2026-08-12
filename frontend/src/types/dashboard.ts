export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface OrganizationSettings {
  widget_title?: string;
  welcome_message?: string;
  primary_color?: string;
  system_prompt?: string;
  temperature?: number;
}

export interface UsageMetric {
  used: number;
  limit: number | null;
}

export interface UsageSummary {
  period_start: string;
  period_end: string;
  ai_responses: UsageMetric;
  storage_bytes: UsageMetric;
  conversations: UsageMetric;
}

export interface SubscriptionInfo {
  id: string;
  organization_id: string;
  plan_tier: PlanTier;
  status: string;
  current_period_start: string;
  current_period_end: string;
  limits: {
    max_ai_responses_per_month: number;
    max_knowledge_bases: number;
    max_documents_per_kb: number;
    max_members: number;
    max_storage_bytes: number;
    allows_api_keys: boolean;
    allows_webhooks: boolean;
    allows_custom_branding: boolean;
  };
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketItem {
  id: string;
  organization_id: string;
  conversation_id: string;
  subject?: string;
  customer_name?: string;
  customer_email?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to?: string;
  messages_count?: number;
  attachments_count?: number;
  sla_deadline?: string;
  ai_confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  file_name: string;
  file_size: string;
  chunks_count: number;
  status: "READY" | "INDEXING" | "FAILED";
  uploaded_at: string;
}
