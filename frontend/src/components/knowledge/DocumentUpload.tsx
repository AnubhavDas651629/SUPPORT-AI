"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { InlineAlert } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { documentsApi, apiErrorMessage } from "@/lib/api";
import type { DocumentDetail } from "@/lib/api/types";
import { formatBytes } from "@/lib/utils";

interface QueueItem {
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "failed";
  error?: string;
}

const ACCEPTED = ".pdf,.md,.markdown,.txt,.csv,.json,.html";

/**
 * Uploads to `POST .../documents`, which stores the row as PENDING and kicks
 * off chunking and embedding in the background. The list polls until each
 * document reaches READY or FAILED.
 */
export function DocumentUpload({
  organizationId,
  knowledgeBaseId,
  onUploaded,
}: {
  organizationId: string;
  knowledgeBaseId: string;
  onUploaded: (document: DocumentDetail) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setQueue(list.map((file) => ({ file, progress: 0, status: "queued" as const })));

    for (const [index, file] of list.entries()) {
      setQueue((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status: "uploading" } : item)),
      );
      try {
        const document = await documentsApi.upload(
          organizationId,
          knowledgeBaseId,
          file,
          (percent) =>
            setQueue((prev) =>
              prev.map((item, i) => (i === index ? { ...item, progress: percent } : item)),
            ),
        );
        setQueue((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, status: "done", progress: 100 } : item,
          ),
        );
        onUploaded(document);
      } catch (err) {
        setQueue((prev) =>
          prev.map((item, i) =>
            i === index
              ? { ...item, status: "failed", error: apiErrorMessage(err) }
              : item,
          ),
        );
      }
    }

    const failed = queue.filter((q) => q.status === "failed").length;
    if (!failed) toast(`${list.length} document${list.length === 1 ? "" : "s"} uploaded.`);
    setTimeout(() => setQueue((prev) => prev.filter((q) => q.status === "failed")), 2500);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-panel border border-dashed p-6 text-center transition-colors",
          dragging ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2/50",
        )}
      >
        <Upload className="mx-auto size-5 text-subtle" aria-hidden="true" />
        <p className="mt-2.5 text-[13.5px] font-medium text-fg">
          Drop documents here
        </p>
        <p className="mt-1 text-[12.5px] text-muted">
          PDF, Markdown, plain text, CSV, JSON or HTML
        </p>
        <Button
          size="sm"
          className="mt-3"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="sr-only"
          aria-label="Choose documents to upload"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {queue.map((item, i) => (
            <li
              key={`${item.file.name}-${i}`}
              className="rounded-control border border-line bg-surface px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg">
                  {item.file.name}
                </span>
                <span className="shrink-0 text-[11.5px] text-subtle">
                  {formatBytes(item.file.size)}
                </span>
                {item.status === "failed" && (
                  <button
                    onClick={() => setQueue((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Dismiss ${item.file.name}`}
                    className="rounded p-0.5 text-subtle hover:text-fg"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {item.status === "uploading" && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-accent transition-[width]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === "done" && (
                <p className="mt-1 text-[11.5px] text-success">
                  Uploaded — indexing in the background
                </p>
              )}
              {item.status === "failed" && (
                <p className="mt-1 text-[11.5px] text-danger">{item.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {queue.some((q) => q.status === "failed") && (
        <InlineAlert>
          Some uploads failed. Plan limits cap documents per knowledge base and total
          storage — check your usage in Settings if this keeps happening.
        </InlineAlert>
      )}
    </div>
  );
}
