import type {
  Paginated,
  MirrorAccount,
  MirrorToken,
  MirrorNft,
  MirrorTransaction,
  MirrorTokenBalance,
} from "./types";

/**
 * Options for Mirror Node queries.
 */
export interface MirrorQueryOptions {
  /** Maximum number of results per page (default: 25, max: 100) */
  limit?: number;
  /** Sort order */
  order?: "asc" | "desc";
}

/**
 * Typed REST client for the Hiero Mirror Node API.
 *
 * Equivalent to `MirrorNodeClient` and the repository classes
 * (AccountRepository, NftRepository, TransactionRepository) in
 * hiero-enterprise-java.
 *
 * Features:
 * - Full TypeScript types for all responses
 * - Automatic pagination with `fetchNext()`
 * - Configurable base URL for any Hiero network
 *
 * @example
 * ```ts
 * const mirror = new MirrorNodeClient("https://testnet.mirrornode.hedera.com");
 * const account = await mirror.getAccount("0.0.100");
 * const tokens = await mirror.getAccountTokens("0.0.100");
 *
 * // Automatic pagination
 * let page = await mirror.getAccountTransactions("0.0.100");
 * while (page) {
 *   page.data.forEach(tx => console.log(tx.transaction_id));
 *   page = await page.fetchNext();
 * }
 * ```
 */
/** Configuration options for MirrorNodeClient */
export interface MirrorClientOptions {
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts on failure (default: 2) */
  retries?: number;
}

export class MirrorNodeClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(baseUrl: string, options?: MirrorClientOptions) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = options?.timeout ?? 10_000;
    this.retries = options?.retries ?? 2;
  }

  // ──────────────────────────────────────────────
  // Account queries
  // ──────────────────────────────────────────────

  /**
   * Fetches account details from the Mirror Node.
   *
   * @param accountId - The account ID (e.g., "0.0.100")
   * @returns Account details including balance and token holdings
   */
  async getAccount(accountId: string): Promise<MirrorAccount> {
    const response = await this.fetch<MirrorAccount>(
      `/api/v1/accounts/${accountId}`
    );
    return response;
  }

  /**
   * Fetches token balances for an account.
   *
   * @param accountId - The account ID
   * @param options - Query options (limit, order)
   * @returns Paginated list of token balances
   */
  async getAccountTokens(
    accountId: string,
    options?: MirrorQueryOptions
  ): Promise<Paginated<MirrorTokenBalance>> {
    const params = this.buildParams(options);
    return this.fetchPaginated<MirrorTokenBalance>(
      `/api/v1/accounts/${accountId}/tokens${params}`,
      "tokens"
    );
  }

  /**
   * Fetches NFTs owned by an account.
   *
   * @param accountId - The account ID
   * @param options - Query options (limit, order)
   * @returns Paginated list of NFTs
   */
  async getAccountNfts(
    accountId: string,
    options?: MirrorQueryOptions
  ): Promise<Paginated<MirrorNft>> {
    const params = this.buildParams(options);
    return this.fetchPaginated<MirrorNft>(
      `/api/v1/accounts/${accountId}/nfts${params}`,
      "nfts"
    );
  }

  /**
   * Fetches transactions for an account.
   *
   * @param accountId - The account ID
   * @param options - Query options (limit, order)
   * @returns Paginated list of transactions
   */
  async getAccountTransactions(
    accountId: string,
    options?: MirrorQueryOptions
  ): Promise<Paginated<MirrorTransaction>> {
    const params = this.buildParams(options);
    return this.fetchPaginated<MirrorTransaction>(
      `/api/v1/transactions${params}${params ? "&" : "?"}account.id=${accountId}`,
      "transactions"
    );
  }

  // ──────────────────────────────────────────────
  // Token queries
  // ──────────────────────────────────────────────

  /**
   * Fetches token information from the Mirror Node.
   *
   * @param tokenId - The token ID (e.g., "0.0.456789")
   * @returns Token details
   */
  async getToken(tokenId: string): Promise<MirrorToken> {
    return this.fetch<MirrorToken>(`/api/v1/tokens/${tokenId}`);
  }

  /**
   * Fetches NFTs in a collection.
   *
   * @param tokenId - The NFT collection token ID
   * @param options - Query options (limit, order)
   * @returns Paginated list of NFTs in the collection
   */
  async getTokenNfts(
    tokenId: string,
    options?: MirrorQueryOptions
  ): Promise<Paginated<MirrorNft>> {
    const params = this.buildParams(options);
    return this.fetchPaginated<MirrorNft>(
      `/api/v1/tokens/${tokenId}/nfts${params}`,
      "nfts"
    );
  }

  // ──────────────────────────────────────────────
  // Generic query (for advanced/custom endpoints)
  // ──────────────────────────────────────────────

  /**
   * Executes a generic query against any Mirror Node REST API endpoint.
   * Useful for endpoints not covered by the typed methods above.
   *
   * @param path - The API path (e.g., "/api/v1/network/supply")
   * @returns The raw JSON response
   */
  async query<T = unknown>(path: string): Promise<T> {
    return this.fetch<T>(path);
  }

  /**
   * Executes a generic paginated query against any Mirror Node endpoint.
   *
   * @param path - The API path
   * @param dataKey - The key in the response that holds the data array
   * @returns Paginated result
   */
  async queryPaginated<T>(
    path: string,
    dataKey: string
  ): Promise<Paginated<T>> {
    return this.fetchPaginated<T>(path, dataKey);
  }

  // ──────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────

  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await globalThis.fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          throw new Error(
            `Mirror Node request failed: ${response.status} ${response.statusText} for ${url}`
          );
        }

        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Don't retry on 4xx client errors
        if (lastError.message.includes("4")) break;
        // Wait before retrying (exponential backoff)
        if (attempt < this.retries) {
          await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
        }
      }
    }

    throw lastError ?? new Error(`Mirror Node request failed for ${url}`);
  }

  private async fetch<T>(path: string): Promise<T> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const response = await this.fetchWithRetry(url);
    return response.json() as Promise<T>;
  }

  private async fetchPaginated<T>(
    path: string,
    dataKey: string
  ): Promise<Paginated<T>> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    const response = await this.fetchWithRetry(url);

    const json = await response.json() as Record<string, unknown>;
    const data: T[] = (json[dataKey] as T[] | undefined) ?? [];
    const nextLink: string | null = ((json.links as Record<string, unknown> | undefined)?.next as string | undefined) ?? null;

    const self = this;
    return {
      data,
      nextLink,
      async fetchNext(): Promise<Paginated<T> | null> {
        if (!nextLink) return null;
        return self.fetchPaginated<T>(
          `${self.baseUrl}${nextLink}`,
          dataKey
        );
      },
    };
  }

  private buildParams(options?: MirrorQueryOptions): string {
    if (!options) return "";
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.order) params.set("order", options.order);
    const str = params.toString();
    return str ? `?${str}` : "";
  }
}
