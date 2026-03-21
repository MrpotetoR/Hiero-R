import {
  Client,
  TokenId,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  NftId,
  PrivateKey,
} from "@hashgraph/sdk";

/** Parameters for creating a new NFT collection */
export interface CreateNftCollectionParams {
  name: string;
  symbol: string;
  treasuryAccountId: string;
  treasuryKey?: PrivateKey;
  supplyKey?: PrivateKey;
  maxSupply?: number;
  memo?: string;
}

/**
 * Service for interacting with non-fungible tokens (NFTs) on Hiero.
 *
 * Equivalent to `NftClient` in hiero-enterprise-java.
 *
 * @example
 * ```ts
 * const service = new NftService(client);
 * const collectionId = await service.createCollection({
 *   name: "My NFTs",
 *   symbol: "MNFT",
 *   treasuryAccountId: "0.0.12345",
 * });
 * ```
 */
export class NftService {
  constructor(private readonly client: Client) {}

  /**
   * Creates a new NFT collection (Non-Fungible Unique token type).
   *
   * @param params - Collection creation parameters
   * @returns The new token ID as a string
   */
  async createCollection(params: CreateNftCollectionParams): Promise<string> {
    const { PrivateKey: PK } = await import("@hashgraph/sdk");
    const supplyKey = params.supplyKey ?? PK.generateED25519();

    const tx = new TokenCreateTransaction()
      .setTokenName(params.name)
      .setTokenSymbol(params.symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(
        params.maxSupply ? TokenSupplyType.Finite : TokenSupplyType.Infinite
      )
      .setSupplyKey(supplyKey)
      .setTreasuryAccountId(AccountId.fromString(params.treasuryAccountId))
      .setDecimals(0)
      .setInitialSupply(0);

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
      throw new Error("NFT collection creation failed: no token ID in receipt");
    }

    return receipt.tokenId.toString();
  }

  /**
   * Mints new NFTs in an existing collection.
   *
   * @param tokenId - The NFT collection token ID
   * @param metadata - Array of metadata byte arrays (one per NFT to mint)
   * @param supplyKey - The supply key for the collection
   * @returns Array of serial numbers for the minted NFTs
   */
  async mint(
    tokenId: string,
    metadata: Uint8Array[],
    supplyKey: PrivateKey
  ): Promise<number[]> {
    const tx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata(metadata)
      .freezeWith(this.client)
      .sign(supplyKey);

    const response = await tx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    return receipt.serials.map((s) => Number(s));
  }

  /**
   * Transfers an NFT from one account to another.
   *
   * @param tokenId - The NFT collection token ID
   * @param serialNumber - The serial number of the NFT
   * @param fromAccountId - The sender account ID
   * @param toAccountId - The recipient account ID
   */
  async transfer(
    tokenId: string,
    serialNumber: number,
    fromAccountId: string,
    toAccountId: string
  ): Promise<void> {
    const nftId = new NftId(TokenId.fromString(tokenId), serialNumber);

    const tx = new TransferTransaction().addNftTransfer(
      nftId,
      AccountId.fromString(fromAccountId),
      AccountId.fromString(toAccountId)
    );

    const response = await tx.execute(this.client);
    await response.getReceipt(this.client);
  }
}
