/** Result of a contract verification check */
export interface VerificationResult {
  contractId: string;
  verified: boolean;
  contractName: string | null;
  compilerVersion: string | null;
  sourceCode: string | null;
  abi: string | null;
}

/**
 * Client for verifying smart contracts on the Hiero network
 * via the Sourcify-compatible verification API.
 *
 * Equivalent to `ContractVerificationClient` in hiero-enterprise-java.
 *
 * @example
 * ```ts
 * const verifier = new ContractVerificationClient("testnet");
 *
 * // Check if a contract is verified
 * const result = await verifier.checkVerification("0.0.123456");
 *
 * // Verify a contract with source code
 * await verifier.verify({
 *   contractId: "0.0.123456",
 *   sourceCode: "pragma solidity ^0.8.0; ...",
 *   contractName: "MyContract",
 *   compilerVersion: "v0.8.24",
 * });
 * ```
 */
export class ContractVerificationClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(network: "mainnet" | "testnet" | "previewnet", options?: { timeout?: number }) {
    const urls: Record<string, string> = {
      mainnet: "https://server-verify.hashscan.io",
      testnet: "https://server-verify.hashscan.io",
      previewnet: "https://server-verify.hashscan.io",
    };
    this.baseUrl = urls[network];
    this.timeout = options?.timeout ?? 15_000;
  }

  /**
   * Checks if a contract has been verified.
   *
   * @param contractId - The contract ID to check (e.g., "0.0.123456")
   * @returns Verification result with source code if verified
   */
  async checkVerification(contractId: string): Promise<VerificationResult> {
    const evmAddress = await this.contractIdToEvmAddress(contractId);

    try {
      const response = await globalThis.fetch(
        `${this.baseUrl}/files/any/${evmAddress}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        return {
          contractId,
          verified: false,
          contractName: null,
          compilerVersion: null,
          sourceCode: null,
          abi: null,
        };
      }

      const data = (await response.json()) as any[];
      const metadata = data.find((f: any) => f.name === "metadata.json");

      return {
        contractId,
        verified: true,
        contractName: metadata?.content?.settings?.compilationTarget
          ? Object.values(metadata.content.settings.compilationTarget)[0] as string
          : null,
        compilerVersion: metadata?.content?.compiler?.version ?? null,
        sourceCode: data.find((f: any) => f.name?.endsWith(".sol"))?.content ?? null,
        abi: metadata?.content?.output?.abi
          ? JSON.stringify(metadata.content.output.abi)
          : null,
      };
    } catch {
      return {
        contractId,
        verified: false,
        contractName: null,
        compilerVersion: null,
        sourceCode: null,
        abi: null,
      };
    }
  }

  /**
   * Verifies a contract by submitting its source code.
   *
   * @param params - Verification parameters
   * @returns Whether verification succeeded
   */
  async verify(params: {
    contractId: string;
    sourceCode: string;
    contractName: string;
    compilerVersion: string;
    optimizationUsed?: boolean;
    runs?: number;
  }): Promise<boolean> {
    const evmAddress = await this.contractIdToEvmAddress(params.contractId);

    const body = {
      address: evmAddress,
      chain: "296", // Hedera testnet chain ID
      files: {
        [`${params.contractName}.sol`]: params.sourceCode,
      },
      compilerVersion: params.compilerVersion,
      name: params.contractName,
    };

    const response = await globalThis.fetch(`${this.baseUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    return response.ok;
  }

  /**
   * Converts a Hedera contract ID (0.0.X) to an EVM address.
   * This is a simplified conversion — the contract ID number is
   * zero-padded to a 20-byte hex address.
   */
  private async contractIdToEvmAddress(contractId: string): Promise<string> {
    const parts = contractId.split(".");
    const num = parseInt(parts[parts.length - 1]);
    return "0x" + num.toString(16).padStart(40, "0");
  }
}
