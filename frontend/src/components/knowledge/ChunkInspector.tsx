"use client";

import { Dialog } from "@/components/ui/Dialog";
import { LoadingRows, ErrorState, EmptyState } from "@/components/ui/States";
import { documentsApi } from "@/lib/api";
import type { DocumentChunk } from "@/lib/api/types";
import { useResource } from "@/lib/hooks";
import { formatNumber } from "@/lib/utils";

/**
 * Shows exactly what was indexed for a document. When an answer is wrong, this
 * is where you find out whether the source text was chunked badly.
 */
export function ChunkInspector({
  open,
  onClose,
  organizationId,
  knowledgeBaseId,
  documentId,
  filename,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  knowledgeBaseId: string;
  documentId: string | null;
  filename: string;
}) {
  const chunks = useResource<DocumentChunk[]>(
    () => documentsApi.chunks(organizationId, knowledgeBaseId, documentId!),
    [organizationId, knowledgeBaseId, documentId, open],
    { enabled: open && !!documentId },
  );

  const totalTokens = (chunks.data ?? []).reduce((sum, c) => sum + c.token_count, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={filename}
      description={
        chunks.data
          ? `${chunks.data.length} chunk${chunks.data.length === 1 ? "" : "s"} · ${formatNumber(totalTokens)} tokens indexed`
          : "Indexed chunks"
      }
      size="lg"
    >
      {chunks.error ? (
        <ErrorState message={chunks.error} onRetry={chunks.refetch} />
      ) : chunks.loading && !chunks.data ? (
        <LoadingRows rows={4} className="p-0" />
      ) : (chunks.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No chunks yet"
          description="This document hasn't finished indexing, or parsing produced no text."
        />
      ) : (
        <ol className="space-y-3">
          {chunks.data!.map((chunk) => (
            <li key={chunk.id} className="rounded-panel border border-line bg-surface-2/40">
              <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5">
                <span className="font-mono text-[11px] text-subtle">
                  chunk {chunk.chunk_index}
                </span>
                <span className="font-mono text-[11px] tnum text-subtle">
                  {formatNumber(chunk.token_count)} tokens
                </span>
              </div>
              <p className="whitespace-pre-wrap px-3 py-2.5 text-[12.5px] leading-relaxed text-muted">
                {chunk.content}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}
