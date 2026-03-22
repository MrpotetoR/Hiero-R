import {
  Client,
  AccountId,
  AccountBalanceQuery,
  AccountInfoQuery,
  AccountCreateTransaction,
  TransferTransaction,
  Hbar,
  TransactionReceipt,
  Status,
} from "@hashgraph/sdk";

/** Account balance result */
export interface AccountBalance {
  /** HBAR balance */
  hbars: Hbar;
  /** Map of token ID to balance */
  tokens: Map<string, number>;
}

/** Simplified account info */
export interface AccountInfo {
  accountId: string;
  balance: Hbar;
  isDeleted: boolean;
  key: string | null;
  memo: string;
  autoRenewPeriod: number | null;
  createdTimestamp: string | null;
}

/**
 * Service for interacting with Hiero accounts.
 *
 * Equivalent to `AccountClient` in hiero-enterprise-java.
 * Provides synchronous-style methods (returning Promises) for
 * common account operations.
 *
 * @example
 * ```ts
 * const service = new AccountService(client);
 * const balance = await service.getBalance("0.0.100");
 * console.log(`Balance: ${balance.hbars.toString()}`);
 * ```
 */
export class AccountService {
  constructor(private readonly client: Client) {}

  /**
   * Queries the HBAR and token balance of an account.
   *
   * @param accountId - The account ID to query (e.g., "0.0.100")
   * @returns The account balance including HBAR and tokens
   */
  async getBalance(accountId: string): Promise<AccountBalance> {
    const id = AccountId.fromString(accountId);
    const response = await new AccountBalanceQuery()
      .setAccountId(id)
      .execute(this.client);

    const tokens = new Map<string, number>();
    // TokenBalanceMap exposes _map as its only iteration API (no public iterator)
    if (response.tokens && (response.tokens as any)._map) {
      for (const [tokenId, amount] of (response.tokens as any)._map) {
        tokens.set(tokenId.toString(), Number(amount));
      }
    }

    return {
      hbars: response.hbars,
      tokens,
    };
  }

  /**
   * Queries detailed information about an account.
   *
   * @param accountId - The account ID to query
   * @returns Simplified account information
   */
  async getInfo(accountId: string): Promise<AccountInfo> {
    const id = AccountId.fromString(accountId);
    const info = await new AccountInfoQuery()
      .setAccountId(id)
      .execute(this.client);

    return {
      accountId: info.accountId.toString(),
      balance: info.balance,
      isDeleted: info.isDeleted,
      key: info.key?.toString() ?? null,
      memo: info.accountMemo,
      autoRenewPeriod: info.autoRenewPeriod
        ? Number(info.autoRenewPeriod)
        : null,
      createdTimestamp: null,
    };
  }

  /**
   * Creates a new account on the Hiero network.
   *
   * @param initialBalance - Optional initial HBAR balance (defaults to 0)
   * @returns The new account ID as a string
   */
  async createAccount(initialBalance?: Hbar): Promise<string> {
    const { PrivateKey } = await import("@hashgraph/sdk");
    const newKey = PrivateKey.generateED25519();

    const tx = new AccountCreateTransaction()
      .setKey(newKey.publicKey)
      .setInitialBalance(initialBalance ?? new Hbar(0));

    const response = await tx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    if (!receipt.accountId) {
      throw new Error("Account creation failed: no account ID in receipt");
    }

    return receipt.accountId.toString();
  }

  /**
   * Transfers HBAR from the operator account to a recipient.
   *
   * @param toAccountId - The recipient account ID
   * @param amount - The amount of HBAR to transfer
   * @returns The transaction receipt
   */
  async transferHbar(
    toAccountId: string,
    amount: Hbar
  ): Promise<TransactionReceipt> {
    const operatorId = this.client.operatorAccountId;
    if (!operatorId) {
      throw new Error("Client has no operator account configured");
    }

    const tx = new TransferTransaction()
      .addHbarTransfer(operatorId, amount.negated())
      .addHbarTransfer(AccountId.fromString(toAccountId), amount);

    const response = await tx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    if (receipt.status !== Status.Success) {
      throw new Error(`Transfer failed with status: ${receipt.status.toString()}`);
    }

    return receipt;
  }
}
