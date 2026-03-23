import type { TokenInfo } from "@i-coders/hiero-core";
import { useHieroContext } from "./HieroProvider";
import { useAsyncQuery } from "./useAsyncQuery";
import type { AsyncQueryOptions } from "./useAsyncQuery";

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
 * @param options - Optional: enabled flag to conditionally skip the query
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
export function useTokenInfo(
  tokenId: string | null,
  options?: AsyncQueryOptions
): UseTokenInfoResult {
  const { tokenService } = useHieroContext();

  const { data, loading, error, refetch } = useAsyncQuery<TokenInfo>(
    tokenId,
    (id) => tokenService.getInfo(id),
    "Failed to fetch token info",
    options
  );

  return { token: data, loading, error, refetch };
}
