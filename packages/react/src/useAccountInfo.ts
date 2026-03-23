import type { AccountInfo } from "@i-coders/hiero-core";
import { useHieroContext } from "./HieroProvider";
import { useAsyncQuery } from "./useAsyncQuery";
import type { AsyncQueryOptions } from "./useAsyncQuery";

/** Return type for the useAccountInfo hook */
export interface UseAccountInfoResult {
  /** The account information (null while loading or on error) */
  account: AccountInfo | null;
  /** Whether the query is currently loading */
  loading: boolean;
  /** Error message if the query failed */
  error: string | null;
  /** Manually re-fetch the account info */
  refetch: () => void;
}

/**
 * Hook to query detailed information about a Hiero account.
 *
 * Equivalent to calling `AccountClient.getInfo()` in
 * hiero-enterprise-java, but reactive with loading/error states.
 *
 * @param accountId - The account ID to query, or null to skip
 * @param options - Optional: enabled flag to conditionally skip the query
 * @returns Account data with loading and error states
 *
 * @example
 * ```tsx
 * function AccountCard({ accountId }: { accountId: string }) {
 *   const { account, loading, error } = useAccountInfo(accountId);
 *
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error}</p>;
 *   if (!account) return null;
 *
 *   return (
 *     <div>
 *       <h3>{account.accountId}</h3>
 *       <p>Balance: {account.balance.toString()}</p>
 *       <p>Memo: {account.memo || "—"}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccountInfo(
  accountId: string | null,
  options?: AsyncQueryOptions
): UseAccountInfoResult {
  const { accountService } = useHieroContext();

  const { data, loading, error, refetch } = useAsyncQuery<AccountInfo>(
    accountId,
    (id) => accountService.getInfo(id),
    "Failed to fetch account info",
    options
  );

  return { account: data, loading, error, refetch };
}
