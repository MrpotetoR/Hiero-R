import {
  Client,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";
import type { HieroConfig } from "./types";

/**
 * Mirror Node base URLs for each supported network.
 */
const MIRROR_URLS: Record<HieroConfig["network"], string> = {
  mainnet: "https://mainnet.mirrornode.hedera.com",
  testnet: "https://testnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
};

/**
 * Creates a configured Hedera SDK Client for the specified Hiero network.
 *
 * This is the TypeScript equivalent of the `HieroContext` managed bean
 * in hiero-enterprise-java's Spring module. It sets up the network
 * connection and operator account used for all subsequent transactions.
 *
 * @param config - Network and operator configuration
 * @returns A configured Hedera SDK Client instance
 *
 * @example
 * ```ts
 * const client = createHieroClient({
 *   network: "testnet",
 *   operatorId: "0.0.12345",
 *   operatorKey: "302e020100300506032b657004220420...",
 * });
 * ```
 */
export function createHieroClient(config: HieroConfig): Client {
  const { network, operatorId, operatorKey } = config;

  let client: Client;
  switch (network) {
    case "mainnet":
      client = Client.forMainnet();
      break;
    case "testnet":
      client = Client.forTestnet();
      break;
    case "previewnet":
      client = Client.forPreviewnet();
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringDer(operatorKey)
  );

  return client;
}

/**
 * Returns the Mirror Node REST API base URL for the given network.
 *
 * @param network - The target network
 * @returns The Mirror Node base URL (no trailing slash)
 */
export function getMirrorUrl(network: HieroConfig["network"]): string {
  const url = MIRROR_URLS[network];
  if (!url) {
    throw new Error(`No Mirror Node URL for network: ${network}`);
  }
  return url;
}
