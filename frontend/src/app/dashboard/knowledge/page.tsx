"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, MoreHorizontal, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import {
  DeleteKnowledgeBaseDialog,
  KnowledgeBaseFormDialog,
} from "@/components/knowledge/KnowledgeBaseDialogs";
import { documentsApi, knowledgeApi } from "@/lib/api";
import type { DocumentStatus, KnowledgeBaseListItem } from "@/lib/api/types";
import { DOCUMENT_STATUS_META } from "@/lib/domain";
import { useOrganization } from "@/context/OrganizationContext";
import { useResource } from "@/lib/hooks";
import { Pencil, Trash2 } from "lucide-react";

interface DocStats {
  total: number;
  ready: number;
  processing: number;
  failed: number;
}

export default function KnowledgePage() {
  const { currentOrg, subscription } = useOrganization();
  const orgId = currentOrg?.id ?? null;

  const bases = useResource(() => knowledgeApi.list(orgId!), [orgId]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeBaseListItem | null>(null);
  const [deleting, setDeleting] = useState<KnowledgeBaseListItem | null>(null);

  // Document counts need one request per base — there is no aggregate endpoint.
  // Keyed on the base ids so it re-runs when a base is added or removed.
  const baseIds = (bases.data ?? []).map((kb) => kb.id).join(",");
  const stats = useResource<Record<string, DocStats>>(
    async () => {
      const results = await Promise.allSettled(
        (bases.data ?? []).map(async (kb) => ({
          id: kb.id,
          documents: await documentsApi.list(orgId!, kb.id),
        })),
      );
      const next: Record<string, DocStats> = {};
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const count = (status: DocumentStatus) =>
          result.value.documents.filter((d) => d.status === status).length;
        next[result.value.id] = {
          total: result.value.documents.length,
          ready: count("READY"),
          processing: count("PROCESSING") + count("UPLOADING"),
          failed: count("FAILED"),
        };
      }
      return next;
    },
    [orgId, baseIds],
    { enabled: !!orgId && !!bases.data },
  );

  const limit = subscription?.limits.max_knowledge_bases;
  const atLimit = limit != null && (bases.data?.length ?? 0) >= limit;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge base"
        description="The documentation your agents retrieve from. Answers are only as good as what is indexed here."
        actions={
          <Button
            variant="primary"
            size="sm"
            disabled={atLimit}
            title={atLimit ? `Your plan allows ${limit} knowledge bases` : undefined}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New knowledge base
          </Button>
        }
      />

      {atLimit && (
        <p className="rounded-control border border-warning/25 bg-warning-soft px-3 py-2 text-[13px] text-warning">
          You&apos;ve reached the {limit} knowledge base
          {limit === 1 ? "" : "s"} your plan allows.{" "}
          <Link href="/dashboard/settings/billing" className="font-medium underline underline-offset-2">
            Compare plans
          </Link>
        </p>
      )}

      {bases.error ? (
        <Panel>
          <ErrorState message={bases.error} onRetry={bases.refetch} />
        </Panel>
      ) : bases.initialLoading ? (
        <Panel>
          <LoadingRows rows={3} />
        </Panel>
      ) : (bases.data?.length ?? 0) === 0 ? (
        <Panel>
          <EmptyState
            icon={BookOpen}
            title="No knowledge bases yet"
            description="Create one and upload your policies, FAQs and runbooks. Until then, agents have nothing to ground answers in."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-3.5" />
                Create a knowledge base
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
          {bases.data!.map((kb) => {
            const stat = stats.data?.[kb.id];
            return (
              <article key={kb.id} className="flex flex-col bg-surface p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/knowledge/${kb.id}`}
                    className="min-w-0 flex-1 rounded"
                  >
                    <h2 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-fg">
                      {kb.name}
                    </h2>
                  </Link>
                  <Menu
                    label={`Actions for ${kb.name}`}
                    trigger={
                      <IconButton label={`Actions for ${kb.name}`} size="sm" className="-mr-1.5 -mt-1">
                        <MoreHorizontal className="size-4" />
                      </IconButton>
                    }
                    items={[
                      {
                        label: "Rename",
                        icon: Pencil,
                        onSelect: () => {
                          setEditing(kb);
                          setFormOpen(true);
                        },
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        destructive: true,
                        onSelect: () => setDeleting(kb),
                      },
                    ]}
                  />
                </div>

                <p className="mt-1 line-clamp-2 min-h-8 text-[13px] leading-relaxed text-muted">
                  {kb.description || "No description"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                    <FileText className="size-3.5 text-subtle" />
                    {stat ? `${stat.total} document${stat.total === 1 ? "" : "s"}` : "…"}
                  </span>
                  {stat && stat.processing > 0 && (
                    <Badge tone={DOCUMENT_STATUS_META.PROCESSING.tone} dot>
                      {stat.processing} indexing
                    </Badge>
                  )}
                  {stat && stat.failed > 0 && (
                    <Badge tone={DOCUMENT_STATUS_META.FAILED.tone} dot>
                      {stat.failed} failed
                    </Badge>
                  )}
                  {stat && stat.total > 0 && stat.processing === 0 && stat.failed === 0 && (
                    <Badge tone="success" dot>
                      Indexed
                    </Badge>
                  )}
                </div>

                <Link
                  href={`/dashboard/knowledge/${kb.id}`}
                  className="mt-4 rounded border-t border-line pt-3 text-[13px] font-medium text-accent-text hover:underline"
                >
                  Open
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {orgId && (
        <>
          <KnowledgeBaseFormDialog
            open={formOpen}
            onClose={() => setFormOpen(false)}
            organizationId={orgId}
            existing={editing}
            onSaved={() => bases.refetch()}
          />
          <DeleteKnowledgeBaseDialog
            open={!!deleting}
            onClose={() => setDeleting(null)}
            organizationId={orgId}
            knowledgeBase={deleting}
            onDeleted={() => bases.refetch()}
          />
        </>
      )}
    </div>
  );
}
