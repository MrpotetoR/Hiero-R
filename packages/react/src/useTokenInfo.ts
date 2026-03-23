import { useState, useEffect, useCallback } from "react";
import type { TokenInfo } from "@i-coders/hiero-core";
import { useHieroContext } from "./HieroProvider";

/** Return type for the useTokenInfo hook */
export interface UseTokenInfoResult {
  /** The token information (null while loading or on error) */
  token: TokenInfo | null;
  /** Whether the query is currently loading */
  loading: boolean;
  /** Error message if the query failed */
  error: string | null;
  /** Manually re-fetch the token info */
  refetch: () => void;
}

/**
 * Hook to query information about a fungible or non-fungible token.
 *
 * Equivalent to calling `FungibleTokenClient.getInfo()` in
 * hiero-enterprise-java, but reactive with loading/error states.
 *
 * @param tokenId - The token ID to query (e.g., "0.0.456789"), or null to skip
 * @returns Token data with loading and error states
 *
 * @example
 * ```tsx
 * function TokenDetails({ tokenId }: { tokenId: string }) {
 *   const { token, loading, error } = useTokenInfo(tokenId);
 *
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error}</p>;
 *   if (!token) return null;
 *
 *   return (
 *     <div>
 *       <h2>{token.name} ({token.symbol})</h2>
 *       <p>Supply: {token.totalSupply}</p>
 *       <p>Decimals: {token.decimals}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTokenInfo(tokenId: string | null): UseTokenInfoResult {
  const { tokenService } = useHieroContext();
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    if (!tokenId) {
      setToken(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await tokenService.getInfo(tokenId);
      setToken(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch token info";
      setError(message);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [tokenId, tokenService]);

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      if (!tokenId) {
        setToken(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await tokenService.getInfo(tokenId);
        if (!cancelled) {
          setToken(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch token info";
          setError(message);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [tokenId, tokenService]);

  return { token, loading, error, refetch: fetchToken };
}
