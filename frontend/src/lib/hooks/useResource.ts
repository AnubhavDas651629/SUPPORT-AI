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

interface Snapshot<T> {
  /** Which request this result belongs to. */
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Fetches a resource and tracks loading / error / data.
 *
 * `deps` behaves like a useEffect dependency list: when any entry changes the
 * fetcher runs again. Passing `null`/`undefined` in deps skips the fetch, which
 * is how routes wait for the active organization to resolve.
 *
 * Loading is *derived* — it's true whenever the snapshot we hold isn't for the
 * request we currently want — rather than toggled with setState inside the
 * effect, which would cascade an extra render on every fetch.
 */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<string | number | boolean | null | undefined>,
  options: { enabled?: boolean } = {},
): ResourceState<T> {
  const enabled = options.enabled ?? deps.every((d) => d !== null && d !== undefined);

  const [reloadCount, setReloadCount] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);

  const requestKey = `${JSON.stringify(deps)}::${reloadCount}`;

  // The fetcher closes over render values, so it changes identity every render.
  // Keep the latest in a ref, written from an effect (never during render).
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Guards against a slow earlier request overwriting a newer result.
  const activeKey = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;

    activeKey.current = requestKey;
    let cancelled = false;

    (async () => {
      try {
        const result = await fetcherRef.current();
        if (!cancelled && activeKey.current === requestKey) {
          setSnapshot({ key: requestKey, data: result, error: null });
        }
      } catch (err) {
        if (!cancelled && activeKey.current === requestKey) {
          setSnapshot({ key: requestKey, data: null, error: apiErrorMessage(err) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, requestKey]);

  const refetch = useCallback(async () => {
    setReloadCount((n) => n + 1);
  }, []);

  const setData = useCallback(
    (updater: T | ((prev: T | null) => T | null)) => {
      setSnapshot((prev) => {
        const nextData =
          typeof updater === "function"
            ? (updater as (p: T | null) => T | null)(prev?.data ?? null)
            : updater;
        return { key: prev?.key ?? requestKey, data: nextData, error: null };
      });
    },
    [requestKey],
  );

  const settled = snapshot?.key === requestKey;
  const loading = enabled && !settled;

  return {
    data: snapshot?.data ?? null,
    error: settled ? snapshot!.error : null,
    loading,
    initialLoading: loading && snapshot === null,
    refetch,
    setData,
  };
}
