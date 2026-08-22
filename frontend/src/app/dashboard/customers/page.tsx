"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { PreviewDataBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Field";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState, InlineAlert } from "@/components/ui/States";
import {
  CUSTOMER_HEALTH_META,
  MOCK_CUSTOMERS,
  type CustomerHealth,
} from "@/lib/mock/customers";
import { formatRelative } from "@/lib/utils";

export default function CustomersPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<CustomerHealth | "">("");
  const [plan, setPlan] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_CUSTOMERS.filter((customer) => {
      if (
        q &&
        ![customer.name, customer.email, customer.company].some((field) =>
          field.toLowerCase().includes(q),
        )
      )
        return false;
      if (health && customer.health !== health) return false;
      if (plan && customer.plan !== plan) return false;
      return true;
    });
  }, [query, health, plan]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Who is asking, what they pay for, and what they've asked before."
        actions={<PreviewDataBadge />}
      />

      <InlineAlert tone="info">
        The backend has no customer model yet — widget visitors are anonymous, so a
        conversation carries no contact record. This directory shows the intended
        shape using placeholder records from{" "}
        <code className="font-mono text-[12px]">lib/mock/customers.ts</code>; swap it
        for the endpoint when one ships.
      </InlineAlert>

      <Panel>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search name, email or company"
            label="Search customers"
            className="sm:max-w-sm"
          />
          <div className="flex gap-2 sm:ml-auto">
            <Select
              value={health}
              onChange={(e) => setHealth(e.target.value as CustomerHealth | "")}
              aria-label="Filter by health"
              className="h-9 text-[13px]"
            >
              <option value="">All health</option>
              {Object.entries(CUSTOMER_HEALTH_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
            <Select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              aria-label="Filter by plan"
              className="h-9 text-[13px]"
            >
              <option value="">All plans</option>
              {["Free", "Growth", "Scale", "Enterprise"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Company</Th>
                  <Th>Plan</Th>
                  <Th>Health</Th>
                  <Th className="text-right">Open</Th>
                  <Th className="text-right">Conversations</Th>
                  <Th className="text-right">Last seen</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <Tr
                    key={customer.id}
                    interactive
                    tabIndex={0}
                    role="link"
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/dashboard/customers/${customer.id}`);
                      }
                    }}
                  >
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={customer.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-fg">
                            {customer.name}
                          </span>
                          <span className="block truncate text-[12px] text-subtle">
                            {customer.email}
                          </span>
                        </span>
                      </span>
                    </Td>
                    <Td className="text-[13px] text-muted">{customer.company}</Td>
                    <Td>
                      <Badge tone={customer.plan === "Enterprise" ? "accent" : "neutral"}>
                        {customer.plan}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={CUSTOMER_HEALTH_META[customer.health].tone} dot>
                        {CUSTOMER_HEALTH_META[customer.health].label}
                      </Badge>
                    </Td>
                    <Td className="text-right text-[13px] tnum text-fg">
                      {customer.openTickets}
                    </Td>
                    <Td className="text-right text-[13px] tnum text-muted">
                      {customer.totalConversations}
                    </Td>
                    <Td className="whitespace-nowrap text-right text-[13px] text-subtle">
                      {formatRelative(customer.lastSeenAt)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
