"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  TicketPlus,
  UserCheck,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { DerivedNote } from "@/components/dashboard/DerivedNote";
import {
  buildNotifications,
  getReadIds,
  setReadIds,
  type AppNotification,
  type NotificationKind,
} from "@/lib/derived/notifications";
import { useAuth } from "@/context/AuthContext";
import { useSupportSnapshot } from "@/lib/hooks";
import { cn, formatRelative } from "@/lib/utils";

const KIND_META: Record<
  NotificationKind,
  { icon: typeof Bell; className: string; label: string }
> = {
  escalation: { icon: TicketPlus, className: "text-accent", label: "Escalation" },
  sla_breach: { icon: AlertTriangle, className: "text-danger", label: "SLA" },
  resolved: { icon: CheckCircle2, className: "text-success", label: "Resolved" },
  assignment: { icon: UserCheck, className: "text-warning", label: "Assigned" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const snapshot = useSupportSnapshot({ limit: 100 });
  const [read, setRead] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState("unread");

  // Read state lives in localStorage, an external store the server can't see.
  // Seeding it during render would desync the server and client HTML, so it is
  // deliberately read once after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setRead(getReadIds()), []);

  const notifications = useMemo(
    () => buildNotifications(snapshot.tickets, user?.id),
    [snapshot.tickets, user?.id],
  );

  const unread = notifications.filter((n) => !read.has(n.id));
  const visible = tab === "unread" ? unread : notifications;

  function markRead(ids: string[]) {
    const next = new Set(read);
    ids.forEach((id) => next.add(id));
    setRead(next);
    setReadIds(next);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Escalations that need attention, and the ones that closed themselves."
        actions={
          unread.length > 0 ? (
            <Button size="sm" onClick={() => markRead(unread.map((n) => n.id))}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <Panel>
        <Tabs
          items={[
            { id: "unread", label: "Unread", count: unread.length },
            { id: "all", label: "All", count: notifications.length },
          ]}
          value={tab}
          onChange={setTab}
          className="px-3"
        />

        {snapshot.error ? (
          <ErrorState message={snapshot.error} onRetry={snapshot.refetch} />
        ) : snapshot.initialLoading ? (
          <LoadingRows rows={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={tab === "unread" ? "You're all caught up" : "Nothing yet"}
            description={
              tab === "unread"
                ? "New escalations, SLA breaches and closures show up here."
                : "Notifications appear as Support-AI escalates and your team resolves."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.slice(0, 100).map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                isRead={read.has(notification.id)}
                onRead={() => markRead([notification.id])}
              />
            ))}
          </ul>
        )}
      </Panel>

      <DerivedNote>
        Assembled from your escalations — the backend has no notification model or feed
        endpoint. Read state is stored in this browser only, so it doesn&apos;t follow you
        to another device.
      </DerivedNote>
    </div>
  );
}

function NotificationRow({
  notification,
  isRead,
  onRead,
}: {
  notification: AppNotification;
  isRead: boolean;
  onRead: () => void;
}) {
  const meta = KIND_META[notification.kind];
  const Icon = meta.icon;

  return (
    <li>
      <Link
        href={notification.href}
        onClick={onRead}
        className={cn(
          "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5",
          !isRead && "bg-accent-soft/35",
        )}
      >
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface"
        >
          <Icon className={cn("size-3.5", meta.className)} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[13.5px] font-medium text-fg">{notification.title}</span>
            {!isRead && (
              <span
                className="size-1.5 rounded-full bg-accent"
                aria-label="Unread"
                role="img"
              />
            )}
          </span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
            {notification.body}
          </span>
          <span className="mt-1 block text-[11.5px] text-subtle">
            {formatRelative(notification.createdAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}
