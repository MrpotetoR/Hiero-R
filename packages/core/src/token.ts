import {
  Client,
  TokenId,
  TokenInfoQuery,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  AccountId,
  PrivateKey,
  Hbar,
} from "@hashgraph/sdk";

/** Simplified token information */
export interface TokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  treasuryAccountId: string;
  type: string;
  supplyType: string;
  maxSupply: string;
  memo: string;
  isDeleted: boolean;
}

/** Parameters for creating a new fungible token */
export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals?: number;
  initialSupply?: number;
  treasuryAccountId: string;
  treasuryKey?: PrivateKey;
  maxSupply?: number;
  memo?: string;
}

/**
 * Service for interacting with fungible tokens on Hiero.
 *
 * Equivalent to `FungibleTokenClient` in hiero-enterprise-java.
 *
 * @example
 * ```ts
 * const service = new TokenService(client);
 * const info = await service.getInfo("0.0.456789");
 * console.log(`${info.name} (${info.symbol}): ${info.totalSupply}`);
 * ```
 */
export class TokenService {
  constructor(private readonly client: Client) {}

  /**
   * Queries information about a token.
   *
   * @param tokenId - The token ID to query (e.g., "0.0.456789")
   * @returns Simplified token information
   */
  async getInfo(tokenId: string): Promise<TokenInfo> {
    const id = TokenId.fromString(tokenId);
    const info = await new TokenInfoQuery()
      .setTokenId(id)
      .execute(this.client);

    return {
      tokenId: info.tokenId.toString(),
      name: info.name,
      symbol: info.symbol,
      decimals: info.decimals,
      totalSupply: info.totalSupply.toString(),
      treasuryAccountId: info.treasuryAccountId?.toString() ?? "",
      type: info.tokenType?.toString() ?? "UNKNOWN",
      supplyType: info.supplyType?.toString() ?? "UNKNOWN",
      maxSupply: info.maxSupply?.toString() ?? "0",
      memo: info.tokenMemo,
      isDeleted: info.isDeleted,
    };
  }

  /**
   * Creates a new fungible token on the Hiero network.
   *
   * @param params - Token creation parameters
   * @returns The new token ID as a string
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    const tx = new TokenCreateTransaction()
      .setTokenName(params.name)
      .setTokenSymbol(params.symbol)
      .setDecimals(params.decimals ?? 2)
      .setInitialSupply(params.initialSupply ?? 0)
      .setTreasuryAccountId(AccountId.fromString(params.treasuryAccountId))
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(
        params.maxSupply ? TokenSupplyType.Finite : TokenSupplyType.Infinite
      );

    if (params.maxSupply) {
      tx.setMaxSupply(params.maxSupply);
    }
    if (params.memo) {
      tx.setTokenMemo(params.memo);
    }

    let frozenTx = tx.freezeWith(this.client);
    if (params.treasuryKey) {
      frozenTx = await frozenTx.sign(params.treasuryKey);
    }

    const response = await frozenTx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    if (!receipt.tokenId) {
      throw new Error("Token creation failed: no token ID in receipt");
    }

    return receipt.tokenId.toString();
  }

  /**
   * Associates a token with an account so the account can hold it.
   *
   * @param accountId - The account to associate the token with
   * @param tokenId - The token to associate
   * @param accountKey - The private key of the account
   */
  async associateToken(
    accountId: string,
    tokenId: string,
    accountKey: PrivateKey
  ): Promise<void> {
    const tx = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(tokenId)])
      .freezeWith(this.client)
      .sign(accountKey);

    const response = await tx.execute(this.client);
    await response.getReceipt(this.client);
  }
}
