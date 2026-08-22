"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge, PreviewDataBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, InlineAlert } from "@/components/ui/States";
import { StatGrid, StatTile } from "@/components/charts/StatTile";
import { CUSTOMER_HEALTH_META, findCustomer } from "@/lib/mock/customers";
import { useSupportSnapshot } from "@/lib/hooks";
import { formatDate, formatRelative, hashInt } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customer = findCustomer(params.id);
  const snapshot = useSupportSnapshot({ limit: 40 });

  if (!customer) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Panel>
          <EmptyState
            title="Customer not found"
            description="This placeholder record no longer exists."
          />
        </Panel>
      </div>
    );
  }

  // The mock directory has no real link to live conversations, so a stable
  // slice is shown to illustrate the join rather than implying one exists.
  const linkedConversations = snapshot.conversations.slice(
    0,
    Math.min(3, hashInt(customer.id, 4)),
  );

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar name={customer.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-[-0.01em] text-fg">
              {customer.name}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-muted">
              {customer.email} · {customer.company}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={customer.plan === "Enterprise" ? "accent" : "neutral"}>
                {customer.plan}
              </Badge>
              <Badge tone={CUSTOMER_HEALTH_META[customer.health].tone} dot>
                {CUSTOMER_HEALTH_META[customer.health].label}
              </Badge>
              <span className="text-[12.5px] text-subtle">{customer.location}</span>
            </div>
          </div>
        </div>
        <PreviewDataBadge />
      </header>

      <InlineAlert tone="info">
        This profile is placeholder data. It shows the context Support-AI would load
        before answering — plan, entitlements, external IDs and support history.
      </InlineAlert>

      <StatGrid columns={4}>
        <StatTile
          label="Lifetime value"
          value={`$${customer.lifetimeValueUsd.toLocaleString()}`}
        />
        <StatTile label="Open escalations" value={customer.openTickets} />
        <StatTile label="Conversations" value={customer.totalConversations} />
        <StatTile
          label="Customer since"
          value={formatDate(customer.signedUpAt)}
          caption={`last seen ${formatRelative(customer.lastSeenAt)}`}
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel>
          <PanelHeader
            title="Recent conversations"
            description="Threads that would resolve to this customer"
          />
          {linkedConversations.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No conversations yet"
              description="Once conversations carry a customer identity, they appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {linkedConversations.map((conversation) => (
                <li key={conversation.id}>
                  <Link
                    href={`/dashboard/conversations?id=${conversation.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                  >
                    <MessagesSquare className="size-4 shrink-0 text-subtle" />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-fg">
                      {conversation.title ?? "Untitled conversation"}
                    </span>
                    <span className="shrink-0 text-[12px] text-subtle">
                      {formatRelative(conversation.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line px-4 py-3 text-[12px] text-subtle sm:px-5">
            These are your organization&apos;s real conversations. They are not actually
            linked to this placeholder customer — the backend stores no contact record
            on a conversation.
          </p>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Account" />
            <dl className="divide-y divide-line">
              {customer.attributes.map((attribute) => (
                <div
                  key={attribute.label}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:px-5"
                >
                  <dt className="text-[12.5px] text-muted">{attribute.label}</dt>
                  <dd className="text-right text-[12.5px] font-medium text-fg">
                    {attribute.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel>
            <PanelHeader
              title="External IDs"
              description="What an action would key on"
            />
            {customer.externalIds.length === 0 ? (
              <p className="px-4 py-4 text-[12.5px] text-subtle sm:px-5">
                No linked systems.
              </p>
            ) : (
              <dl className="divide-y divide-line">
                {customer.externalIds.map((id) => (
                  <div key={id.key} className="px-4 py-2.5 sm:px-5">
                    <dt className="font-mono text-[11px] text-subtle">{id.key}</dt>
                    <dd className="mt-0.5 font-mono text-[12.5px] text-fg">{id.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/customers"
      className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-3.5" />
      All customers
    </Link>
  );
}
