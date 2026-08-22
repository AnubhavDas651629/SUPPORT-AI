"use client";

import { useCallback, useState } from "react";
import { apiErrorMessage } from "@/lib/api";

/**
 * Wraps a mutation so every call site gets the same pending/error handling
 * instead of re-implementing try/catch/setLoading.
 */
export function useAsyncAction<Args extends unknown[], R>(
  action: (...args: Args) => Promise<R>,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<R | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (err) {
        setError(apiErrorMessage(err));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return { run, pending, error, clearError: () => setError(null) };
}
