"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/api";

export interface ResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** True only on the first load, so refreshes don't flash skeletons. */
  initialLoading: boolean;
  refetch: () => Promise<void>;
  setData: (updater: T | ((prev: T | null) => T | null)) => void;
}

/**
 * Fetches a resource and tracks loading / error / data.
 *
 * `deps` behaves like a useEffect dependency list: when any entry changes the
 * fetcher runs again. Passing `null`/`undefined` in deps skips the fetch, which
 * is how routes wait for the active organization to resolve.
 */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<string | number | boolean | null | undefined>,
  options: { enabled?: boolean } = {},
): ResourceState<T> {
  const enabled = options.enabled ?? deps.every((d) => d !== null && d !== undefined);

  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  // Guards against a slow earlier request overwriting a newer result.
  const requestId = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (id === requestId.current) setDataState(result);
    } catch (err) {
      if (id === requestId.current) setError(apiErrorMessage(err));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setHasLoaded(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  const setData = useCallback((updater: T | ((prev: T | null) => T | null)) => {
    setDataState((prev) =>
      typeof updater === "function" ? (updater as (p: T | null) => T | null)(prev) : updater,
    );
  }, []);

  return {
    data,
    error,
    loading,
    initialLoading: loading && !hasLoaded,
    refetch: run,
    setData,
  };
}
