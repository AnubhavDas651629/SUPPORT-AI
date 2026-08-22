"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Layers, Trash2 } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ChunkInspector } from "@/components/knowledge/ChunkInspector";
import { DocumentUpload } from "@/components/knowledge/DocumentUpload";
import { RetrievalTester } from "@/components/knowledge/RetrievalTester";
import { documentsApi, knowledgeApi } from "@/lib/api";
import type { DocumentListItem, KnowledgeBase } from "@/lib/api/types";
import { DOCUMENT_STATUS_META, canWorkQueue } from "@/lib/domain";
import { useOrganization } from "@/context/OrganizationContext";
import { useAsyncAction, useResource } from "@/lib/hooks";

export default function KnowledgeBaseDetailPage() {
  const params = useParams<{ id: string }>();
  const knowledgeBaseId = params.id;
  const toast = useToast();
  const { currentOrg, role } = useOrganization();
  const orgId = currentOrg?.id ?? null;
  const canEdit = canWorkQueue(role);

  const [query, setQuery] = useState("");
  const [inspecting, setInspecting] = useState<DocumentListItem | null>(null);
  const [deleting, setDeleting] = useState<DocumentListItem | null>(null);

  const base = useResource<KnowledgeBase>(
    () => knowledgeApi.get(orgId!, knowledgeBaseId),
    [orgId, knowledgeBaseId],
  );

  const documents = useResource<DocumentListItem[]>(
    () => documentsApi.list(orgId!, knowledgeBaseId),
    [orgId, knowledgeBaseId],
  );

  // Indexing happens in a background task, so poll while anything is in flight.
  const indexing = (documents.data ?? []).some(
    (d) => d.status === "PROCESSING" || d.status === "UPLOADING",
  );
  const refetchDocuments = documents.refetch;
  useEffect(() => {
    if (!indexing) return;
    const timer = setInterval(refetchDocuments, 4000);
    return () => clearInterval(timer);
  }, [indexing, refetchDocuments]);

  const remove = useAsyncAction(async (documentId: string) => {
    await documentsApi.remove(orgId!, knowledgeBaseId, documentId);
    documents.setData((prev) => (prev ?? []).filter((d) => d.id !== documentId));
    setDeleting(null);
    toast("Document deleted.");
  });

  const filtered = (documents.data ?? []).filter((d) =>
    d.original_filename.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const counts = useCallback(
    (status: string) => (documents.data ?? []).filter((d) => d.status === status).length,
    [documents.data],
  );

  if (base.error) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Panel>
          <ErrorState message={base.error} onRetry={base.refetch} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="border-b border-line pb-5">
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">
          {base.data?.name ?? "Knowledge base"}
        </h1>
        {base.data?.description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            {base.data.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge>
            {documents.data?.length ?? 0} document
            {(documents.data?.length ?? 0) === 1 ? "" : "s"}
          </Badge>
          {counts("READY") > 0 && (
            <Badge tone="success" dot>
              {counts("READY")} ready
            </Badge>
          )}
          {counts("PROCESSING") + counts("UPLOADING") > 0 && (
            <Badge tone="info" dot>
              {counts("PROCESSING") + counts("UPLOADING")} indexing
            </Badge>
          )}
          {counts("FAILED") > 0 && (
            <Badge tone="danger" dot>
              {counts("FAILED")} failed
            </Badge>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel>
          <PanelHeader
            title="Documents"
            description="Chunked and embedded on upload"
            action={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Filter files"
                label="Filter documents"
                className="w-44"
              />
            }
          />

          {documents.error ? (
            <ErrorState message={documents.error} onRetry={documents.refetch} />
          ) : documents.initialLoading ? (
            <LoadingRows rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={query ? "No files match" : "No documents yet"}
              description={
                query
                  ? "Try a different filter."
                  : "Upload the policies and runbooks your agents should answer from."
              }
            />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>File</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((document) => {
                    const meta = DOCUMENT_STATUS_META[document.status];
                    return (
                      <Tr key={document.id}>
                        <Td className="max-w-sm">
                          <span className="flex items-center gap-2.5">
                            <FileText className="size-4 shrink-0 text-subtle" />
                            <span className="truncate text-[13px] text-fg">
                              {document.original_filename}
                            </span>
                          </span>
                        </Td>
                        <Td>
                          <Badge tone={meta.tone} dot>
                            {meta.label}
                          </Badge>
                        </Td>
                        <Td>
                          <span className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInspecting(document)}
                              disabled={document.status !== "READY"}
                            >
                              <Layers className="size-3.5" />
                              Chunks
                            </Button>
                            {canEdit && (
                              <IconButton
                                label={`Delete ${document.original_filename}`}
                                size="sm"
                                onClick={() => setDeleting(document)}
                              >
                                <Trash2 className="size-3.5" />
                              </IconButton>
                            )}
                          </span>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Panel>

        <div className="space-y-6">
          {canEdit && orgId && (
            <Panel>
              <PanelHeader title="Add documents" />
              <div className="p-4 sm:p-5">
                <DocumentUpload
                  organizationId={orgId}
                  knowledgeBaseId={knowledgeBaseId}
                  onUploaded={() => documents.refetch()}
                />
              </div>
            </Panel>
          )}

          {orgId && (
            <Panel>
              <PanelHeader
                title="Test retrieval"
                description="See what an agent would find"
              />
              <div className="p-4 sm:p-5">
                <RetrievalTester
                  organizationId={orgId}
                  knowledgeBaseId={knowledgeBaseId}
                />
              </div>
            </Panel>
          )}
        </div>
      </div>

      {orgId && (
        <ChunkInspector
          open={!!inspecting}
          onClose={() => setInspecting(null)}
          organizationId={orgId}
          knowledgeBaseId={knowledgeBaseId}
          documentId={inspecting?.id ?? null}
          filename={inspecting?.original_filename ?? ""}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.run(deleting.id)}
        title={`Delete "${deleting?.original_filename ?? ""}"?`}
        message="The file and its indexed chunks are removed. Answers that cited it will no longer resolve."
        confirmLabel="Delete document"
        destructive
        loading={remove.pending}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/knowledge"
      className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-3.5" />
      All knowledge bases
    </Link>
  );
}
