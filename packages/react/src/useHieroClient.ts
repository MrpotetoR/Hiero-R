import { Client } from "@hashgraph/sdk";
import { useHieroContext } from "./HieroProvider";

/**
 * Hook to access the raw Hedera SDK Client instance.
 *
 * Use this when you need direct access to the SDK for operations
 * not covered by the higher-level hooks.
 *
 * @returns The configured Hedera SDK Client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const client = useHieroClient();
 *   // Use client directly for custom SDK operations
 * }
 * ```
 */
export function useHieroClient(): Client {
  const { client } = useHieroContext();
  return client;
}
