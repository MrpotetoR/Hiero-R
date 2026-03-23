import { useState, useEffect, useCallback } from "react";
import type { Paginated } from "@i-coders/hiero-core";
import { useHieroContext } from "./HieroProvider";

/** Return type for the useMirrorQuery hook */
export interface UseMirrorQueryResult<T> {
  /** Current page of data */
  data: T[];
  /** Whether the initial query or pagination is loading */
  loading: boolean;
  /** Error message if the query failed */
  error: string | null;
  /** Whether there are more pages available */
  hasNextPage: boolean;
  /** Fetch the next page and append results */
  fetchNextPage: () => Promise<void>;
  /** Re-fetch from the beginning */
  refetch: () => void;
}

/**
 * Generic hook for paginated Mirror Node REST API queries.
 *
 * Equivalent to the Mirror Node repository classes in
 * hiero-enterprise-java (AccountRepository, NftRepository, etc.),
 * but as a single, flexible React hook with automatic pagination.
 *
 * @param path - The Mirror Node API path (e.g., "/api/v1/accounts/0.0.100/tokens")
 * @param dataKey - The JSON key that holds the data array (e.g., "tokens", "nfts", "transactions")
 * @param options - Optional: enabled flag to conditionally skip the query
 * @returns Paginated data with loading states and pagination controls
 *
 * @example
 * ```tsx
 * // Fetch tokens for an account with automatic pagination
 * function TokenList({ accountId }: { accountId: string }) {
 *   const { data, loading, hasNextPage, fetchNextPage } = useMirrorQuery<MirrorTokenBalance>(
 *     `/api/v1/accounts/${accountId}/tokens`,
 *     "tokens"
 *   );
 *
 *   return (
 *     <div>
 *       {data.map(t => <p key={t.token_id}>{t.token_id}: {t.balance}</p>)}
 *       {loading && <p>Loading...</p>}
 *       {hasNextPage && (
 *         <button onClick={fetchNextPage}>Load more</button>
 *       )}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Fetch transactions
 * const { data: txs } = useMirrorQuery<MirrorTransaction>(
 *   `/api/v1/transactions?account.id=${accountId}`,
 *   "transactions"
 * );
 * ```
 */
export function useMirrorQuery<T>(
  path: string | null,
  dataKey: string,
  options?: { enabled?: boolean }
): UseMirrorQueryResult<T> {
  const { mirrorClient } = useHieroContext();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Paginated<T> | null>(null);

  const enabled = options?.enabled !== false;

  const fetchInitial = useCallback(async () => {
    if (!path || !enabled) {
      setData([]);
      setError(null);
      setCurrentPage(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const page = await mirrorClient.queryPaginated<T>(path, dataKey);
      setData(page.data);
      setCurrentPage(page);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Mirror Node query failed";
      setError(message);
      setData([]);
      setCurrentPage(null);
    } finally {
      setLoading(false);
    }
  }, [path, dataKey, enabled, mirrorClient]);

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      if (!path || !enabled) {
        setData([]);
        setError(null);
        setCurrentPage(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const page = await mirrorClient.queryPaginated<T>(path, dataKey);
        if (!cancelled) {
          setData(page.data);
          setCurrentPage(page);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Mirror Node query failed";
          setError(message);
          setData([]);
          setCurrentPage(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [path, dataKey, enabled, mirrorClient]);

  const fetchNextPage = useCallback(async () => {
    if (!currentPage?.nextLink) return;

    setLoading(true);
    try {
      const nextPage = await currentPage.fetchNext();
      if (nextPage) {
        setData((prev) => [...prev, ...nextPage.data]);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch next page";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  return {
    data,
    loading,
    error,
    hasNextPage: !!currentPage?.nextLink,
    fetchNextPage,
    refetch: fetchInitial,
  };
}
