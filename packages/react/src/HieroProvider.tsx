import React, { createContext, useContext, useMemo, useRef } from "react";
import { Client } from "@hashgraph/sdk";
import {
  createHieroClient,
  getMirrorUrl,
  AccountService,
  TokenService,
  NftService,
  FileService,
  SmartContractService,
  MirrorNodeClient,
} from "@i-coders/hiero-core";
import type { HieroConfig } from "@i-coders/hiero-core";

/**
 * Context value provided by HieroProvider.
 * Contains all managed services, similar to Spring's dependency injection.
 */
export interface HieroContextValue {
  /** The raw Hedera SDK Client instance */
  client: Client;
  /** Account operations service */
  accountService: AccountService;
  /** Fungible token operations service */
  tokenService: TokenService;
  /** NFT operations service */
  nftService: NftService;
  /** File operations service */
  fileService: FileService;
  /** Smart contract operations service */
  contractService: SmartContractService;
  /** Mirror Node REST API client */
  mirrorClient: MirrorNodeClient;
  /** The active configuration */
  config: HieroConfig;
}

const HieroContext = createContext<HieroContextValue | null>(null);

/**
 * Props for the HieroProvider component.
 */
export interface HieroProviderProps {
  /** Network and operator configuration */
  config: HieroConfig;
  /** React children */
  children: React.ReactNode;
}

/**
 * React context provider for Hiero network services.
 *
 * This is the TypeScript/React equivalent of the `@EnableHiero` annotation
 * in hiero-enterprise-java's Spring module. Wrap your application (or a
 * subtree) with this provider to make all Hiero services available via hooks.
 *
 * @example
 * ```tsx
 * import { HieroProvider } from "@i-coders/hiero-react";
 *
 * function App() {
 *   return (
 *     <HieroProvider
 *       config={{
 *         network: "testnet",
 *         operatorId: "0.0.12345",
 *         operatorKey: "302e020100300506032b657004220420...",
 *       }}
 *     >
 *       <MyApp />
 *     </HieroProvider>
 *   );
 * }
 * ```
 */
export function HieroProvider({ config, children }: HieroProviderProps) {
  // Stabilize config reference to prevent infinite re-renders
  // when config is passed as an inline object literal
  const { network, operatorId, operatorKey } = config;
  const configRef = useRef(config);
  configRef.current = config;

  const value = useMemo<HieroContextValue>(() => {
    const stableConfig = { network, operatorId, operatorKey };
    const client = createHieroClient(stableConfig);
    const mirrorUrl = getMirrorUrl(network);

    return {
      client,
      accountService: new AccountService(client),
      tokenService: new TokenService(client),
      nftService: new NftService(client),
      fileService: new FileService(client),
      contractService: new SmartContractService(client),
      mirrorClient: new MirrorNodeClient(mirrorUrl),
      config: stableConfig,
    };
  }, [network, operatorId, operatorKey]);

  return (
    <HieroContext.Provider value={value}>{children}</HieroContext.Provider>
  );
}

/**
 * Internal hook to access the HieroContext. Throws if used outside a provider.
 */
export function useHieroContext(): HieroContextValue {
  const ctx = useContext(HieroContext);
  if (!ctx) {
    throw new Error(
      "useHieroContext must be used within a <HieroProvider>. " +
        "Wrap your component tree with <HieroProvider config={...}>."
    );
  }
  return ctx;
}
