import { useState, useEffect, useCallback } from "react";
import { Hbar } from "@hashgraph/sdk";
import type { AccountBalance } from "@i-coders/hiero-core";
import { useHieroContext } from "./HieroProvider";

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
export function useBalance(accountId: string | null): UseBalanceResult {
  const { accountService } = useHieroContext();
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!accountId) {
      setBalance(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await accountService.getBalance(accountId);
      setBalance(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch balance";
      setError(message);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, accountService]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
}
