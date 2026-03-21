/**
 * Configuration for connecting to a Hiero network.
 * Equivalent to the Spring `application.properties` configuration
 * in hiero-enterprise-java.
 */
export interface HieroConfig {
  /** The Hiero/Hedera network to connect to */
  network: "mainnet" | "testnet" | "previewnet";
  /** The operator account ID (e.g., "0.0.12345") */
  operatorId: string;
  /** The DER-encoded private key for the operator account */
  operatorKey: string;
}

// ──────────────────────────────────────────────
// Mirror Node API response types
// ──────────────────────────────────────────────

/** Paginated response wrapper from Mirror Node REST API */
export interface Paginated<T> {
  /** Array of result items */
  data: T[];
  /** Link to the next page, or null if no more pages */
  nextLink: string | null;
  /** Fetch the next page of results. Returns null if no more pages. */
  fetchNext(): Promise<Paginated<T> | null>;
}

/** Mirror Node account representation */
export interface MirrorAccount {
  account: string;
  alias: string | null;
  balance: {
    balance: number;
    timestamp: string;
    tokens: Array<{ token_id: string; balance: number }>;
  };
  created_timestamp: string;
  memo: string;
  evm_address: string | null;
  key: { _type: string; key: string } | null;
  auto_renew_period: number | null;
  deleted: boolean;
}

/** Mirror Node token representation */
export interface MirrorToken {
  token_id: string;
  symbol: string;
  name: string;
  decimals: string;
  total_supply: string;
  type: "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE";
  treasury_account_id: string;
  created_timestamp: string;
  memo: string;
}

/** Mirror Node NFT representation */
export interface MirrorNft {
  token_id: string;
  serial_number: number;
  account_id: string;
  metadata: string;
  created_timestamp: string;
  modified_timestamp: string;
  deleted: boolean;
}

/** Mirror Node transaction representation */
export interface MirrorTransaction {
  transaction_id: string;
  name: string;
  node: string;
  result: string;
  consensus_timestamp: string;
  valid_start_timestamp: string;
  charged_tx_fee: number;
  memo_base64: string;
  transfers: Array<{
    account: string;
    amount: number;
    is_approval: boolean;
  }>;
}

/** Mirror Node token balance for an account */
export interface MirrorTokenBalance {
  token_id: string;
  balance: number;
}

/** Raw Mirror Node paginated response envelope */
export interface MirrorNodeResponse<T> {
  [key: string]: unknown;
  links?: { next: string | null };
}
