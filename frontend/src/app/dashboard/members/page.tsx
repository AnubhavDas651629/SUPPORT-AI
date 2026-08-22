"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState, ErrorState, InlineAlert, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { membersApi } from "@/lib/api";
import {
  ORGANIZATION_ROLES,
  type OrganizationMember,
  type OrganizationRole,
} from "@/lib/api/types";
import { ROLE_META, canManageOrganization } from "@/lib/domain";
import { useAsyncAction, useResource } from "@/lib/hooks";
import { useAuth } from "@/context/AuthContext";
import { useOrganization } from "@/context/OrganizationContext";

export default function MembersPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { currentOrg, role, subscription } = useOrganization();
  const orgId = currentOrg?.id ?? null;
  const canManage = canManageOrganization(role);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("SUPPORT");
  const [removing, setRemoving] = useState<OrganizationMember | null>(null);

  const members = useResource<OrganizationMember[]>(
    () => membersApi.list(orgId!),
    [orgId],
  );

  const invite = useAsyncAction(async () => {
    await membersApi.invite(orgId!, email.trim(), inviteRole);
    setInviteOpen(false);
    setEmail("");
    toast(`${email.trim()} added to ${currentOrg?.name}.`);
    members.refetch();
  });

  const changeRole = useAsyncAction(async (userId: string, next: OrganizationRole) => {
    await membersApi.updateRole(orgId!, userId, next);
    members.setData((prev) =>
      (prev ?? []).map((m) => (m.id === userId ? { ...m, role: next } : m)),
    );
    toast("Role updated.");
  });

  const remove = useAsyncAction(async (userId: string) => {
    await membersApi.remove(orgId!, userId);
    members.setData((prev) => (prev ?? []).filter((m) => m.id !== userId));
    setRemoving(null);
    toast("Member removed.");
  });

  const limit = subscription?.limits.max_members;
  const atLimit = limit != null && (members.data?.length ?? 0) >= limit;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`Who can see and work ${currentOrg?.name ?? "this organization"}'s support queue.`}
        actions={
          <Button
            size="sm"
            variant="primary"
            disabled={!canManage || atLimit}
            title={
              atLimit
                ? `Your plan allows ${limit} member${limit === 1 ? "" : "s"}`
                : !canManage
                  ? "Only the organization owner can add members"
                  : undefined
            }
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="size-3.5" />
            Add member
          </Button>
        }
      />

      {atLimit && (
        <InlineAlert tone="warning">
          You&apos;ve reached the {limit} member{limit === 1 ? "" : "s"} your plan allows.
          Upgrade to add more.
        </InlineAlert>
      )}

      {(invite.error || changeRole.error || remove.error) && (
        <InlineAlert>{invite.error ?? changeRole.error ?? remove.error}</InlineAlert>
      )}

      <Panel>
        <PanelHeader
          title="People"
          description={`${members.data?.length ?? 0} member${(members.data?.length ?? 0) === 1 ? "" : "s"}`}
        />

        {members.error ? (
          <ErrorState message={members.error} onRetry={members.refetch} />
        ) : members.initialLoading ? (
          <LoadingRows rows={4} />
        ) : (members.data?.length ?? 0) === 0 ? (
          <EmptyState icon={Users} title="No members" description="Add a teammate to get started." />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Member</Th>
                  <Th>Role</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {members.data!.map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <Tr key={member.id}>
                      <Td>
                        <span className="flex items-center gap-3">
                          <Avatar name={member.full_name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-fg">
                              {member.full_name}
                              {isSelf && (
                                <span className="ml-1.5 text-[12px] font-normal text-subtle">
                                  you
                                </span>
                              )}
                            </span>
                            <span className="block truncate text-[12px] text-subtle">
                              {member.email}
                            </span>
                          </span>
                        </span>
                      </Td>
                      <Td>
                        {canManage && !isSelf ? (
                          <Select
                            value={member.role}
                            aria-label={`Role for ${member.full_name}`}
                            className="h-8 w-36 text-[12.5px]"
                            disabled={changeRole.pending}
                            onChange={(e) =>
                              changeRole.run(member.id, e.target.value as OrganizationRole)
                            }
                          >
                            {ORGANIZATION_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_META[r].label}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Badge tone={ROLE_META[member.role].tone}>
                            {ROLE_META[member.role].label}
                          </Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        {canManage && !isSelf && member.role !== "OWNER" && (
                          <Button size="sm" variant="ghost" onClick={() => setRemoving(member)}>
                            Remove
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="What each role can do" />
        <dl className="divide-y divide-line">
          {ORGANIZATION_ROLES.map((r) => (
            <div key={r} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4 sm:px-5">
              <dt className="sm:w-28 sm:shrink-0">
                <Badge tone={ROLE_META[r].tone}>{ROLE_META[r].label}</Badge>
              </dt>
              <dd className="text-[13px] leading-relaxed text-muted">
                {ROLE_META[r].description}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Add a member"
        description="The person must already have a Support-AI account — they're added to this organization immediately, with no invitation email."
        size="sm"
        footer={
          <>
            <Button size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={invite.pending}
              disabled={!email.includes("@")}
              onClick={() => invite.run()}
            >
              Add member
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) invite.run();
          }}
          className="space-y-3"
        >
          {invite.error && <InlineAlert>{invite.error}</InlineAlert>}
          <Field label="Email address" htmlFor="invite-email" required>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              autoFocus
              required
            />
          </Field>
          <Field label="Role" htmlFor="invite-role" hint={ROLE_META[inviteRole].description}>
            <Select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
            >
              {ORGANIZATION_ROLES.filter((r) => r !== "OWNER").map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r].label}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.run(removing.id)}
        title={`Remove ${removing?.full_name ?? ""}?`}
        message="They lose access to this organization's conversations, knowledge and settings. Their account itself is untouched."
        confirmLabel="Remove member"
        destructive
        loading={remove.pending}
      />
    </div>
  );
}
