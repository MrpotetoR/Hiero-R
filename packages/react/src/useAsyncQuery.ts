import { useState, useEffect, useCallback, useRef } from "react";

/** Options for async query hooks */
export interface AsyncQueryOptions {
  /** Whether the query should execute (default: true) */
  enabled?: boolean;
}

/** Return type for async query hooks */
export interface AsyncQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Internal hook that extracts the shared fetch-with-cancellation pattern
 * used by useBalance, useTokenInfo, and useAccountInfo.
 *
 * Handles:
 * - Automatic fetch on key/dependency change
 * - Race condition prevention via cancellation flag
 * - Loading/error state management
 * - Manual refetch
 * - Optional enabled flag to skip query
 */
export function useAsyncQuery<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>,
  errorLabel: string,
  options?: AsyncQueryOptions
): AsyncQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const enabled = options?.enabled !== false;

  const refetch = useCallback(() => {
    if (!key || !enabled) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetcherRef
      .current(key)
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : errorLabel;
        setError(message);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key, enabled, errorLabel]);

  useEffect(() => {
    if (!key || !enabled) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcherRef
      .current(key)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : errorLabel;
          setError(message);
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, enabled, errorLabel]);

  return { data, loading, error, refetch };
}
