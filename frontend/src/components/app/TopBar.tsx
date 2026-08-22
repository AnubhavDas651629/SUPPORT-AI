"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, LogOut, User as UserIcon, Building2 } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Dialog";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { ALL_NAV_ITEMS, activeNavHref } from "./navigation";
import { SidebarContent } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const active = activeNavHref(pathname);
  const currentItem = ALL_NAV_ITEMS.find((i) => i.href === active);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-surface/85 px-3 backdrop-blur-md sm:px-5">
        <IconButton
          label="Open navigation"
          className="lg:hidden"
          onClick={() => setNavOpen(true)}
        >
          <MenuIcon className="size-4.5" />
        </IconButton>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li className="hidden sm:block">
              <Link href="/dashboard" className="rounded text-subtle hover:text-fg">
                Dashboard
              </Link>
            </li>
            {currentItem && currentItem.href !== "/dashboard" && (
              <>
                <li className="hidden text-subtle sm:block" aria-hidden="true">
                  /
                </li>
                <li className="min-w-0">
                  <span className="block truncate font-medium text-fg">
                    {currentItem.label}
                  </span>
                </li>
              </>
            )}
            {currentItem?.href === "/dashboard" && (
              <li className="font-medium text-fg sm:hidden">Overview</li>
            )}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <NotificationBell />
          <ThemeToggle />
          <Menu
            label="Account menu"
            trigger={
              <button
                className="ml-1 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label={`Account: ${user?.full_name ?? "signed in"}`}
              >
                <Avatar name={user?.full_name ?? "?"} size="sm" />
              </button>
            }
            items={[
              {
                label: "Organization settings",
                icon: Building2,
                onSelect: () => {
                  window.location.href = "/dashboard/settings";
                },
              },
              {
                label: "Members",
                icon: UserIcon,
                onSelect: () => {
                  window.location.href = "/dashboard/members";
                },
              },
              { label: "Sign out", icon: LogOut, destructive: true, onSelect: logout },
            ]}
          />
        </div>
      </header>

      <Sheet open={navOpen} onClose={() => setNavOpen(false)} title="Navigation" side="left">
        <SidebarContent onNavigate={() => setNavOpen(false)} />
      </Sheet>
    </>
  );
}
