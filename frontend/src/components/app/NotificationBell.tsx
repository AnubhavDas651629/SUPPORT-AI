"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { useOrganization } from "@/context/OrganizationContext";
import { useResource } from "@/lib/hooks";
import { ticketsApi } from "@/lib/api";
import { buildNotifications, getReadIds } from "@/lib/derived/notifications";

export function NotificationBell() {
  const router = useRouter();
  const { currentOrg } = useOrganization();

  const tickets = useResource(
    () => ticketsApi.list(currentOrg!.id, { limit: 50 }),
    [currentOrg?.id],
  );

  const unread = useMemo(() => {
    if (!tickets.data) return 0;
    const read = getReadIds();
    return buildNotifications(tickets.data.items).filter((n) => !read.has(n.id)).length;
  }, [tickets.data]);

  return (
    <IconButton
      label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      onClick={() => router.push("/dashboard/notifications")}
      className="relative"
    >
      <Bell className="size-4" />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold leading-4 text-accent-fg tnum">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </IconButton>
  );
}
