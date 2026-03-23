import type { AccountBalance } from "@i-coders/hiero-core";
import { useHieroContext } from "./HieroProvider";
import { useAsyncQuery } from "./useAsyncQuery";
import type { AsyncQueryOptions } from "./useAsyncQuery";

/** Return type for the useBalance hook */
export interface UseBalanceResult {
  /** The account balance (null while loading or on error) */
  balance: AccountBalance | null;
  /** Whether the query is currently loading */
  loading: boolean;
  /** Error message if the query failed */
  error: string | null;
  /** Manually re-fetch the balance */
  refetch: () => void;
}

/**
 * Hook to query the HBAR and token balance of a Hiero account.
 *
 * Equivalent to calling `AccountClient.getBalance()` in
 * hiero-enterprise-java, but reactive — it automatically fetches
 * on mount and provides loading/error states.
 *
 * @param accountId - The account ID to query (e.g., "0.0.100")
 * @param options - Optional: enabled flag to conditionally skip the query
 * @returns Balance data with loading and error states
 *
 * @example
 * ```tsx
 * function BalanceDisplay() {
 *   const { balance, loading, error } = useBalance("0.0.100");
 *
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error}</p>;
 *   return <p>Balance: {balance?.hbars.toString()}</p>;
 * }
 * ```
 */
export function useBalance(
  accountId: string | null,
  options?: AsyncQueryOptions
): UseBalanceResult {
  const { accountService } = useHieroContext();

  const { data, loading, error, refetch } = useAsyncQuery<AccountBalance>(
    accountId,
    (id) => accountService.getBalance(id),
    "Failed to fetch balance",
    options
  );

  return { balance: data, loading, error, refetch };
}
