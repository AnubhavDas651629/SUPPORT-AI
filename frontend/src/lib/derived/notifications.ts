/**
 * The notification feed.
 *
 * There is no notification model or endpoint in the backend, so the feed is
 * assembled from events the API *does* expose: escalations that were created,
 * breached their SLA, or were resolved. Read state lives in localStorage on the
 * viewer's device — it is intentionally per-device until a server-side feed
 * exists.
 */
import type { Ticket } from "@/lib/api/types";
import { isOpenStatus } from "@/lib/domain";

export type NotificationKind = "escalation" | "sla_breach" | "resolved" | "assignment";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  /** Dashboard route this notification points at. */
  href: string;
}

const READ_KEY = "supportai_read_notifications";

export function buildNotifications(tickets: Ticket[], currentUserId?: string | null): AppNotification[] {
  const items: AppNotification[] = [];

  for (const t of tickets) {
    if (t.sla_deadline === "Breached" && isOpenStatus(t.status)) {
      items.push({
        id: `sla-${t.id}`,
        kind: "sla_breach",
        title: "SLA breached",
        body: `"${t.subject}" passed its ${t.priority.toLowerCase()}-priority response window.`,
        createdAt: t.updated_at,
        href: `/dashboard/escalations/${t.id}`,
      });
    }

    if (t.created_by_ai) {
      items.push({
        id: `esc-${t.id}`,
        kind: "escalation",
        title: "Support-AI escalated a conversation",
        body: `"${t.subject}" was handed to the team at ${t.priority.toLowerCase()} priority.`,
        createdAt: t.created_at,
        href: `/dashboard/escalations/${t.id}`,
      });
    }

    if (currentUserId && t.assigned_to_user_id === currentUserId && isOpenStatus(t.status)) {
      items.push({
        id: `asg-${t.id}`,
        kind: "assignment",
        title: "Assigned to you",
        body: `"${t.subject}" is waiting on you.`,
        createdAt: t.updated_at,
        href: `/dashboard/escalations/${t.id}`,
      });
    }

    if (!isOpenStatus(t.status)) {
      items.push({
        id: `res-${t.id}`,
        kind: "resolved",
        title: "Escalation closed",
        body: `"${t.subject}" was marked ${t.status.toLowerCase().replace("_", " ")}.`,
        createdAt: t.updated_at,
        href: `/dashboard/escalations/${t.id}`,
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function setReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    // Storage can be unavailable (private mode, blocked site data) — the feed
    // still works, it just won't remember what was read.
  }
}
