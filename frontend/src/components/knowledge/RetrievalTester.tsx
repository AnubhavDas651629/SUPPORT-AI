"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineAlert } from "@/components/ui/States";
import { knowledgeApi } from "@/lib/api";
import type { KnowledgeSearchResult } from "@/lib/api/types";
import { useAsyncAction } from "@/lib/hooks";

/**
 * Runs the same retrieval an agent runs, so you can see which passages a
 * question actually pulls before a customer asks it.
 */
export function RetrievalTester({
  organizationId,
  knowledgeBaseId,
}: {
  organizationId: string;
  knowledgeBaseId: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[] | null>(null);

  const search = useAsyncAction(async () => {
    const found = await knowledgeApi.search(organizationId, knowledgeBaseId, query.trim(), 5);
    setResults(found);
  });

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) search.run();
        }}
        className="flex gap-2"
      >
        <label htmlFor="retrieval-query" className="sr-only">
          Test a question against this knowledge base
        </label>
        <Input
          id="retrieval-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something a customer would ask…"
        />
        <Button
          type="submit"
          variant="primary"
          loading={search.pending}
          disabled={!query.trim()}
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Retrieve</span>
        </Button>
      </form>

      {search.error && <InlineAlert>{search.error}</InlineAlert>}

      {results && results.length === 0 && (
        <p className="rounded-control border border-line bg-surface-2 px-3 py-2.5 text-[12.5px] text-muted">
          Nothing matched. An agent asked this would have no evidence to answer from.
        </p>
      )}

      {results && results.length > 0 && (
        <ol className="space-y-2">
          {results.map((result, i) => (
            <li
              key={`${result.document_name}-${result.chunk_index}-${i}`}
              className="rounded-panel border border-line bg-surface-2/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[12px] text-fg">
                  {result.document_name}
                </span>
                <span className="font-mono text-[11px] text-subtle">
                  chunk {result.chunk_index}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <span
                    className="h-1 w-14 overflow-hidden rounded-full bg-surface-3"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(result.score, 0) * 100}%` }}
                    />
                  </span>
                  <span className="font-mono text-[11px] tnum text-muted">
                    {result.score.toFixed(2)}
                  </span>
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                {result.snippet}
              </p>
            </li>
          ))}
        </ol>
      )}

      <p className="text-[12px] leading-relaxed text-subtle">
        Ranking is real pgvector similarity. The score shown is a rank-derived
        approximation — the search endpoint returns ordered passages, not raw
        distances.
      </p>
    </div>
  );
}
