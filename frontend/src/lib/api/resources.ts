/**
 * Every backend call the app makes, grouped by resource.
 * Components never build URLs — they call these functions.
 */
import { api } from "./client";
import type {
  ApiKey,
  ApiKeyCreated,
  ChatResponse,
  ConversationDetail,
  ConversationSummary,
  CursorPage,
  DocumentChunk,
  DocumentDetail,
  DocumentListItem,
  GenericMessageResponse,
  KnowledgeBase,
  KnowledgeBaseListItem,
  KnowledgeSearchResult,
  Membership,
  Message,
  Organization,
  OrganizationMember,
  OrganizationRole,
  OrganizationSettings,
  OrganizationSettingsUpdate,
  Subscription,
  Ticket,
  TicketEvent,
  TicketNote,
  TicketPriority,
  TicketStatus,
  TokenResponse,
  UsageSummary,
  User,
  VerifyOTPResponse,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEndpointCreated,
  WebhookTestResult,
} from "./types";

/* ── Auth ─────────────────────────────────────────────────────────────── */

export const authApi = {
  /** The backend uses OAuth2PasswordRequestForm, so this must be form-encoded. */
  async login(email: string, password: string) {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const { data } = await api.post<TokenResponse>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },

  async register(payload: { email: string; password: string; full_name: string }) {
    const { data } = await api.post<User>("/auth/register", payload);
    return data;
  },

  async google(idToken: string) {
    const { data } = await api.post<TokenResponse>("/auth/google", { id_token: idToken });
    return data;
  },

  async me() {
    const { data } = await api.get<User>("/users/me");
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<GenericMessageResponse>("/auth/forgot-password", { email });
    return data;
  },

  async verifyOtp(email: string, otp: string) {
    const { data } = await api.post<VerifyOTPResponse>("/auth/verify-forgot-password-otp", {
      email,
      otp,
    });
    return data;
  },

  async resetPassword(resetToken: string, newPassword: string) {
    const { data } = await api.post<GenericMessageResponse>("/auth/reset-password", {
      reset_token: resetToken,
      new_password: newPassword,
    });
    return data;
  },
};

/* ── Organizations ────────────────────────────────────────────────────── */

export const organizationsApi = {
  async list() {
    const { data } = await api.get<Organization[]>("/organizations");
    return data;
  },
  async create(name: string) {
    const { data } = await api.post<Organization>("/organizations", { name });
    return data;
  },
  async update(organizationId: string, name: string) {
    const { data } = await api.patch<Organization>(`/organizations/${organizationId}`, { name });
    return data;
  },
  async remove(organizationId: string) {
    await api.delete(`/organizations/${organizationId}`);
  },
};

export const membersApi = {
  async list(organizationId: string) {
    const { data } = await api.get<OrganizationMember[]>(
      `/organizations/${organizationId}/members`,
    );
    return data;
  },
  async invite(organizationId: string, email: string, role: OrganizationRole) {
    const { data } = await api.post<Membership>(`/organizations/${organizationId}/members`, {
      email,
      role,
    });
    return data;
  },
  async updateRole(organizationId: string, userId: string, role: OrganizationRole) {
    const { data } = await api.patch<Membership>(
      `/organizations/${organizationId}/members/${userId}`,
      { role },
    );
    return data;
  },
  async remove(organizationId: string, userId: string) {
    await api.delete(`/organizations/${organizationId}/members/${userId}`);
  },
};

export const settingsApi = {
  async get(organizationId: string) {
    const { data } = await api.get<OrganizationSettings>(
      `/organizations/${organizationId}/settings`,
    );
    return data;
  },
  async update(organizationId: string, patch: OrganizationSettingsUpdate) {
    const { data } = await api.patch<OrganizationSettings>(
      `/organizations/${organizationId}/settings`,
      patch,
    );
    return data;
  },
};

/* ── Knowledge ────────────────────────────────────────────────────────── */

export const knowledgeApi = {
  async list(organizationId: string) {
    const { data } = await api.get<KnowledgeBaseListItem[]>(
      `/organizations/${organizationId}/knowledge-bases`,
    );
    return data;
  },
  async get(organizationId: string, knowledgeBaseId: string) {
    const { data } = await api.get<KnowledgeBase>(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}`,
    );
    return data;
  },
  async create(organizationId: string, payload: { name: string; description?: string | null }) {
    const { data } = await api.post<KnowledgeBase>(
      `/organizations/${organizationId}/knowledge-bases`,
      payload,
    );
    return data;
  },
  async update(
    organizationId: string,
    knowledgeBaseId: string,
    payload: { name: string; description?: string | null },
  ) {
    const { data } = await api.patch<KnowledgeBase>(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}`,
      payload,
    );
    return data;
  },
  async remove(organizationId: string, knowledgeBaseId: string) {
    await api.delete(`/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}`);
  },
  async search(
    organizationId: string,
    knowledgeBaseId: string,
    query: string,
    limit = 5,
  ) {
    const { data } = await api.post<KnowledgeSearchResult[]>(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}/search`,
      { query, limit },
    );
    return data;
  },
};

export const documentsApi = {
  async list(organizationId: string, knowledgeBaseId: string) {
    const { data } = await api.get<DocumentListItem[]>(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}/documents`,
    );
    return data;
  },
  async get(organizationId: string, knowledgeBaseId: string, documentId: string) {
    const { data } = await api.get<DocumentDetail>(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
    );
    return data;
  },
  async upload(
    organizationId: string,
    knowledgeBaseId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<DocumentDetail>(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}/documents`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    return data;
  },
  async remove(organizationId: string, knowledgeBaseId: string, documentId: string) {
    await api.delete(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
    );
  },
  async chunks(organizationId: string, knowledgeBaseId: string, documentId: string) {
    const { data } = await api.get<DocumentChunk[]>(
      `/organizations/${organizationId}/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/chunks`,
    );
    return data;
  },
};

/* ── Conversations ────────────────────────────────────────────────────── */

export const conversationsApi = {
  async list(organizationId: string, params: { limit?: number; offset?: number } = {}) {
    const { data } = await api.get<ConversationSummary[]>("/conversations", {
      params: {
        organization_id: organizationId,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
    });
    return data;
  },
  async get(conversationId: string) {
    const { data } = await api.get<ConversationDetail>(`/conversations/${conversationId}`);
    return data;
  },
  async reply(conversationId: string, content: string) {
    const { data } = await api.post<Message>(`/conversations/${conversationId}/reply`, {
      content,
    });
    return data;
  },
  async remove(conversationId: string) {
    await api.delete(`/conversations/${conversationId}`);
  },
};

export const chatApi = {
  async send(payload: {
    question: string;
    conversation_id?: string;
    knowledge_base_id?: string;
    organization_id?: string;
  }) {
    const { data } = await api.post<ChatResponse>("/chat", payload);
    return data;
  },
};

export const messagesApi = {
  async feedback(messageId: string, feedback: "POSITIVE" | "NEGATIVE") {
    const { data } = await api.put(`/messages/${messageId}/feedback`, { feedback });
    return data;
  },
};

/* ── Tickets (escalations) ────────────────────────────────────────────── */

export const ticketsApi = {
  async list(
    organizationId: string,
    params: {
      status?: TicketStatus;
      priority?: TicketPriority;
      search?: string;
      cursor?: string | null;
      limit?: number;
    } = {},
  ) {
    const { data } = await api.get<CursorPage<Ticket>>("/tickets", {
      params: {
        organization_id: organizationId,
        status: params.status,
        priority: params.priority,
        search: params.search || undefined,
        cursor: params.cursor || undefined,
        limit: params.limit ?? 25,
      },
    });
    return data;
  },
  async get(ticketId: string) {
    const { data } = await api.get<Ticket>(`/tickets/${ticketId}`);
    return data;
  },
  async create(conversationId: string, priority: TicketPriority = "MEDIUM") {
    const { data } = await api.post<Ticket>("/tickets", {
      conversation_id: conversationId,
      priority,
    });
    return data;
  },
  async updateStatus(ticketId: string, status: TicketStatus) {
    const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/status`, { status });
    return data;
  },
  async updatePriority(ticketId: string, priority: TicketPriority) {
    const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/priority`, { priority });
    return data;
  },
  async assign(ticketId: string, userId: string) {
    const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/assign`, { user_id: userId });
    return data;
  },
  async reply(ticketId: string, content: string) {
    const { data } = await api.post<Message>(`/tickets/${ticketId}/reply`, { content });
    return data;
  },
  async remove(ticketId: string) {
    await api.delete(`/tickets/${ticketId}`);
  },
  async events(ticketId: string) {
    const { data } = await api.get<TicketEvent[]>(`/tickets/${ticketId}/events`);
    return data;
  },
  async notes(ticketId: string) {
    const { data } = await api.get<TicketNote[]>(`/tickets/${ticketId}/notes`);
    return data;
  },
  async addNote(ticketId: string, content: string) {
    const { data } = await api.post<TicketNote>(`/tickets/${ticketId}/notes`, { content });
    return data;
  },
  async removeNote(noteId: string) {
    await api.delete(`/tickets/notes/${noteId}`);
  },
};

/* ── Developer surface ────────────────────────────────────────────────── */

export const apiKeysApi = {
  async list(organizationId: string) {
    const { data } = await api.get<ApiKey[]>(`/organizations/${organizationId}/api-keys`);
    return data;
  },
  async create(organizationId: string, name: string, expiresAt?: string | null) {
    const { data } = await api.post<ApiKeyCreated>(
      `/organizations/${organizationId}/api-keys`,
      { name, expires_at: expiresAt ?? null },
    );
    return data;
  },
  async revoke(organizationId: string, apiKeyId: string) {
    const { data } = await api.delete<ApiKey>(
      `/organizations/${organizationId}/api-keys/${apiKeyId}`,
    );
    return data;
  },
};

export const webhooksApi = {
  async list(organizationId: string) {
    const { data } = await api.get<WebhookEndpoint[]>(
      `/organizations/${organizationId}/webhooks`,
    );
    return data;
  },
  async create(
    organizationId: string,
    payload: { name: string; url: string; subscribed_events: string[] },
  ) {
    const { data } = await api.post<WebhookEndpointCreated>(
      `/organizations/${organizationId}/webhooks`,
      payload,
    );
    return data;
  },
  async update(
    organizationId: string,
    endpointId: string,
    payload: Partial<{
      name: string;
      url: string;
      subscribed_events: string[];
      is_active: boolean;
    }>,
  ) {
    const { data } = await api.patch<WebhookEndpoint>(
      `/organizations/${organizationId}/webhooks/${endpointId}`,
      payload,
    );
    return data;
  },
  async remove(organizationId: string, endpointId: string) {
    await api.delete(`/organizations/${organizationId}/webhooks/${endpointId}`);
  },
  async test(organizationId: string, endpointId: string) {
    const { data } = await api.post<WebhookTestResult>(
      `/organizations/${organizationId}/webhooks/${endpointId}/test`,
    );
    return data;
  },
  async deliveries(organizationId: string, endpointId: string) {
    const { data } = await api.get<WebhookDelivery[]>(
      `/organizations/${organizationId}/webhooks/${endpointId}/deliveries`,
    );
    return data;
  },
};

/* ── Billing ──────────────────────────────────────────────────────────── */

export const billingApi = {
  async subscription(organizationId: string) {
    const { data } = await api.get<Subscription>(
      `/organizations/${organizationId}/subscription`,
    );
    return data;
  },
  async usage(organizationId: string) {
    const { data } = await api.get<UsageSummary>(`/organizations/${organizationId}/usage`);
    return data;
  },
  async checkout(
    organizationId: string,
    payload: { price_id: string; success_url: string; cancel_url: string },
  ) {
    const { data } = await api.post<{ checkout_url: string }>(
      `/organizations/${organizationId}/subscription/checkout`,
      payload,
    );
    return data;
  },
  async portal(organizationId: string, returnUrl: string) {
    const { data } = await api.post<{ checkout_url: string }>(
      `/organizations/${organizationId}/subscription/portal`,
      { return_url: returnUrl },
    );
    return data;
  },
};

export const systemApi = {
  async health() {
    const { data } = await api.get<{ status: string; database: string; redis: string }>(
      "/health",
    );
    return data;
  },
};
