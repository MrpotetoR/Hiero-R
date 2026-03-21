/**
 * @i-coders/hiero-react
 *
 * React hooks and provider for Hiero networks.
 * TypeScript equivalent of hiero-enterprise-java's Spring module.
 *
 * @packageDocumentation
 */

// Provider
export { HieroProvider, useHieroContext } from "./HieroProvider";
export type { HieroProviderProps, HieroContextValue } from "./HieroProvider";

// Hooks
export { useHieroClient } from "./useHieroClient";
export { useBalance } from "./useBalance";
export type { UseBalanceResult } from "./useBalance";

export { useTransfer } from "./useTransfer";
export type { UseTransferResult, TransferStatus } from "./useTransfer";

export { useTokenInfo } from "./useTokenInfo";
export type { UseTokenInfoResult } from "./useTokenInfo";

export { useAccountInfo } from "./useAccountInfo";
export type { UseAccountInfoResult } from "./useAccountInfo";

export { useMirrorQuery } from "./useMirrorQuery";
export type { UseMirrorQueryResult } from "./useMirrorQuery";

// Re-export core types for convenience
export type {
  HieroConfig,
  AccountBalance,
  AccountInfo,
  TokenInfo,
  Paginated,
  MirrorAccount,
  MirrorToken,
  MirrorNft,
  MirrorTransaction,
  MirrorTokenBalance,
} from "@i-coders/hiero-core";
