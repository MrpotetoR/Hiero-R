import type { HieroConfig } from "@i-coders/hiero-core";

/**
 * Loads the Hiero configuration from environment variables.
 *
 * Set these in your .env.local file:
 *   NEXT_PUBLIC_HEDERA_NETWORK=testnet
 *   NEXT_PUBLIC_HEDERA_ACCOUNT_ID=0.0.12345
 *   NEXT_PUBLIC_HEDERA_PRIVATE_KEY=302e020100...
 *
 * ⚠️ WARNING: In production, NEVER expose private keys on the client.
 * This is for demo/hackathon purposes only. Use a backend signer
 * or wallet integration (HashPack, Blade) for production apps.
 */
export function getHieroConfig(): HieroConfig {
  const network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK ?? "testnet") as HieroConfig["network"];
  const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID ?? "";
  const operatorKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY ?? "";

  if (!operatorId || !operatorKey) {
    console.warn(
      "[hiero-sample-app] Missing NEXT_PUBLIC_HEDERA_ACCOUNT_ID or NEXT_PUBLIC_HEDERA_PRIVATE_KEY. " +
      "Create a .env.local file. See README for details."
    );
  }

  return { network, operatorId, operatorKey };
}
