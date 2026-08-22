import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  BookOpen,
  Code2,
  LayoutDashboard,
  MessagesSquare,
  ScrollText,
  TicketCheck,
  Users,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Marks a screen not yet backed by a live endpoint. */
  preview?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/conversations", label: "Conversations", icon: MessagesSquare },
      { href: "/dashboard/escalations", label: "Escalations", icon: TicketCheck },
      { href: "/dashboard/customers", label: "Customers", icon: Users, preview: true },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard/agents", label: "Agents", icon: Bot },
      { href: "/dashboard/knowledge", label: "Knowledge base", icon: BookOpen },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/dashboard/members", label: "Members", icon: UsersRound },
      { href: "/dashboard/developers", label: "Developers", icon: Code2 },
      { href: "/dashboard/audit-logs", label: "Audit log", icon: ScrollText },
      { href: "/dashboard/settings", label: "Settings", icon: Building2 },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

/** Longest-prefix match so nested routes keep their parent highlighted. */
export function activeNavHref(pathname: string): string | null {
  const matches = ALL_NAV_ITEMS.map((i) => i.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length);
  return matches[0] ?? null;
}
