/**
 * @i-coders/hiero-core
 *
 * Core services for interacting with Hiero networks.
 * TypeScript equivalent of hiero-enterprise-java's base module.
 *
 * @packageDocumentation
 */

// Client factory
export { createHieroClient, getMirrorUrl } from "./client";

// Services
export { AccountService } from "./account";
export type { AccountBalance, AccountInfo } from "./account";

export { TokenService } from "./token";
export type { TokenInfo, CreateTokenParams } from "./token";

export { NftService } from "./nft";
export type { CreateNftCollectionParams } from "./nft";

// Mirror Node client
export { MirrorNodeClient } from "./mirror";
export type { MirrorQueryOptions, MirrorClientOptions } from "./mirror";

// Shared types
export type {
  HieroConfig,
  Paginated,
  MirrorAccount,
  MirrorToken,
  MirrorNft,
  MirrorTransaction,
  MirrorTokenBalance,
} from "./types";
