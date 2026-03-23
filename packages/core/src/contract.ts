import {
  Client,
  ContractId,
  ContractCreateFlow,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractInfoQuery,
  ContractDeleteTransaction,
  ContractFunctionParameters,
  ContractFunctionResult,
  Hbar,
} from "@hashgraph/sdk";

/** Simplified contract information */
export interface ContractInfo {
  contractId: string;
  accountId: string;
  adminKey: string | null;
  balance: Hbar;
  isDeleted: boolean;
  memo: string;
  storage: number;
  autoRenewPeriod: number | null;
}

/** Parameters for deploying a smart contract */
export interface DeployContractParams {
  bytecode: string | Uint8Array;
  gas: number;
  constructorParameters?: ContractFunctionParameters;
  adminKey?: import("@hashgraph/sdk").PrivateKey;
  initialBalance?: Hbar;
  memo?: string;
}

/** Parameters for executing a contract function (state-changing) */
export interface ExecuteContractParams {
  contractId: string;
  functionName: string;
  parameters?: ContractFunctionParameters;
  gas: number;
  payableAmount?: Hbar;
}

/** Parameters for calling a contract function (read-only) */
export interface CallContractParams {
  contractId: string;
  functionName: string;
  parameters?: ContractFunctionParameters;
  gas: number;
}

/**
 * Service for interacting with smart contracts on the Hiero network.
 *
 * Equivalent to `SmartContractClient` in hiero-enterprise-java.
 * Supports deploying, executing, querying, and deleting contracts.
 *
 * @example
 * ```ts
 * const service = new SmartContractService(client);
 *
 * // Deploy a contract
 * const contractId = await service.deploy({
 *   bytecode: "0x608060...",
 *   gas: 100_000,
 * });
 *
 * // Call a read-only function
 * const result = await service.call({
 *   contractId,
 *   functionName: "getMessage",
 *   gas: 30_000,
 * });
 * ```
 */
export class SmartContractService {
  constructor(private readonly client: Client) {}

  /**
   * Deploys a new smart contract to the Hiero network.
   *
   * Uses ContractCreateFlow which handles file creation automatically.
   *
   * @param params - Contract deployment parameters
   * @returns The new contract ID as a string
   */
  async deploy(params: DeployContractParams): Promise<string> {
    const tx = new ContractCreateFlow()
      .setBytecode(params.bytecode)
      .setGas(params.gas);

    if (params.constructorParameters) {
      tx.setConstructorParameters(params.constructorParameters);
    }
    if (params.adminKey) {
      tx.setAdminKey(params.adminKey);
    }
    if (params.initialBalance) {
      tx.setInitialBalance(params.initialBalance);
    }
    if (params.memo) {
      tx.setContractMemo(params.memo);
    }

    const response = await tx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    if (!receipt.contractId) {
      throw new Error("Contract deployment failed: no contract ID in receipt");
    }

    return receipt.contractId.toString();
  }

  /**
   * Executes a state-changing function on a smart contract.
   *
   * @param params - Execution parameters
   * @returns The function result
   */
  async execute(params: ExecuteContractParams): Promise<ContractFunctionResult> {
    const tx = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(params.contractId))
      .setGas(params.gas)
      .setFunction(
        params.functionName,
        params.parameters ?? new ContractFunctionParameters()
      );

    if (params.payableAmount) {
      tx.setPayableAmount(params.payableAmount);
    }

    const response = await tx.execute(this.client);
    const record = await response.getRecord(this.client);

    if (!record.contractFunctionResult) {
      throw new Error("Contract execution returned no result");
    }

    return record.contractFunctionResult;
  }

  /**
   * Calls a read-only function on a smart contract (no state change, no fee).
   *
   * @param params - Call parameters
   * @returns The function result
   */
  async call(params: CallContractParams): Promise<ContractFunctionResult> {
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(params.contractId))
      .setGas(params.gas)
      .setFunction(
        params.functionName,
        params.parameters ?? new ContractFunctionParameters()
      );

    return query.execute(this.client);
  }

  /**
   * Queries information about a deployed contract.
   *
   * @param contractId - The contract ID to query
   * @returns Simplified contract information
   */
  async getInfo(contractId: string): Promise<ContractInfo> {
    const info = await new ContractInfoQuery()
      .setContractId(ContractId.fromString(contractId))
      .execute(this.client);

    return {
      contractId: info.contractId.toString(),
      accountId: info.accountId.toString(),
      adminKey: info.adminKey?.toString() ?? null,
      balance: info.balance,
      isDeleted: info.isDeleted,
      memo: info.contractMemo,
      storage: Number(info.storage),
      autoRenewPeriod: info.autoRenewPeriod
        ? Number(info.autoRenewPeriod)
        : null,
    };
  }

  /**
   * Deletes a smart contract from the network.
   *
   * @param contractId - The contract ID to delete
   * @param transferAccountId - Account to transfer remaining balance to
   */
  async deleteContract(
    contractId: string,
    transferAccountId: string
  ): Promise<void> {
    const tx = new ContractDeleteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setTransferAccountId(transferAccountId);

    const response = await tx.execute(this.client);
    await response.getReceipt(this.client);
  }
}
