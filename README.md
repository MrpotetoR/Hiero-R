# hiero-enterprise-react

React / Next.js integration kit for [Hiero](https://hiero.org) networks.

This project provides React hooks and a context provider to interact with Hiero-based networks (including [Hedera](https://hedera.com)) in React and Next.js applications. It is the **TypeScript/React equivalent** of [hiero-enterprise-java](https://github.com/hiero-ledger/hiero-enterprise-java), which provides Spring Boot and Microprofile integrations.

Built for the [Hedera Hello Future Apex Hackathon 2026](https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026) — Hiero Bounty.

## Features

- **`HieroProvider`** — React context provider (equivalent to `@EnableHiero` in Spring)
- **`useBalance`** — Query HBAR and token balances reactively
- **`useTransfer`** — Transfer HBAR with status tracking
- **`useTokenInfo`** — Query token details
- **`useAccountInfo`** — Query account information
- **`useMirrorQuery`** — Generic paginated Mirror Node REST API queries
- **`useHieroClient`** — Direct access to the Hedera SDK Client
- **`MirrorNodeClient`** — Fully typed REST client with automatic pagination
- **Core services** — `AccountService`, `TokenService`, `NftService`

## Quick Start

### 1. Install

```bash
npm install @i-coders/hiero-core @i-coders/hiero-react @hashgraph/sdk
# or
pnpm add @i-coders/hiero-core @i-coders/hiero-react @hashgraph/sdk
```

### 2. Wrap your app with HieroProvider

```tsx
import { HieroProvider } from "@i-coders/hiero-react";

function App() {
  return (
    <HieroProvider
      config={{
        network: "testnet",
        operatorId: "0.0.YOUR_ACCOUNT_ID",
        operatorKey: "YOUR_DER_PRIVATE_KEY",
      }}
    >
      <MyApp />
    </HieroProvider>
  );
}
```

### 3. Use hooks in your components

```tsx
import { useBalance, useTransfer } from "@i-coders/hiero-react";
import { Hbar } from "@hashgraph/sdk";

function Dashboard() {
  const { balance, loading, error } = useBalance("0.0.100");
  const { send, status } = useTransfer();

  if (loading) return <p>Loading balance...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <p>Balance: {balance?.hbars.toString()}</p>
      <button
        onClick={() => send("0.0.67890", new Hbar(1))}
        disabled={status === "pending"}
      >
        Send 1 HBAR
      </button>
    </div>
  );
}
```

## Architecture

This library mirrors the modular architecture of [hiero-enterprise-java](https://github.com/hiero-ledger/hiero-enterprise-java):

| Java Module | TypeScript Package | Purpose |
|---|---|---|
| `hiero-enterprise-base` | `@i-coders/hiero-core` | Core services, client factory, Mirror Node client |
| `hiero-enterprise-spring` | `@i-coders/hiero-react` | Framework integration (hooks, provider) |
| `hiero-enterprise-test` | `packages/core/__tests__` | Unit tests |
| `spring-sample` | `packages/sample-app` | Demo application |

### Core Services

| Service | Equivalent Java Class | Methods |
|---|---|---|
| `AccountService` | `AccountClient` | `getBalance`, `getInfo`, `createAccount`, `transferHbar` |
| `TokenService` | `FungibleTokenClient` | `getInfo`, `createToken`, `associateToken` |
| `NftService` | `NftClient` | `createCollection`, `mint`, `transfer` |
| `MirrorNodeClient` | `MirrorNodeClient` + Repositories | `getAccount`, `getAccountTokens`, `getToken`, etc. |

### React Hooks

| Hook | Description |
|---|---|
| `useBalance(accountId)` | Reactive HBAR + token balance query |
| `useTransfer()` | HBAR transfer with `idle → pending → success/error` status |
| `useTokenInfo(tokenId)` | Reactive token information query |
| `useAccountInfo(accountId)` | Reactive account information query |
| `useMirrorQuery(path, key)` | Generic paginated Mirror Node query |
| `useHieroClient()` | Direct SDK Client access |

## API Reference

### HieroProvider

```tsx
<HieroProvider config={HieroConfig}>
  {children}
</HieroProvider>
```

**HieroConfig:**

| Property | Type | Description |
|---|---|---|
| `network` | `"mainnet" \| "testnet" \| "previewnet"` | Target Hiero network |
| `operatorId` | `string` | Operator account ID (e.g., `"0.0.12345"`) |
| `operatorKey` | `string` | DER-encoded ECDSA private key |

### useMirrorQuery (advanced)

```tsx
const { data, loading, hasNextPage, fetchNextPage, refetch } = useMirrorQuery<T>(
  path,     // API path, e.g. "/api/v1/accounts/0.0.100/tokens"
  dataKey,  // JSON key for data array, e.g. "tokens"
  options?  // { enabled?: boolean }
);
```

Supports automatic pagination — call `fetchNextPage()` to append the next page of results.

### MirrorNodeClient (standalone)

```ts
import { MirrorNodeClient } from "@i-coders/hiero-core";

const mirror = new MirrorNodeClient("https://testnet.mirrornode.hedera.com");

// Typed queries
const account = await mirror.getAccount("0.0.100");
const tokens = await mirror.getAccountTokens("0.0.100", { limit: 10 });
const nfts = await mirror.getAccountNfts("0.0.100");

// Automatic pagination
let page = await mirror.getAccountTransactions("0.0.100");
while (page) {
  page.data.forEach(tx => console.log(tx.transaction_id));
  page = await page.fetchNext();
}
```

## Development

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- A Hedera testnet account from [portal.hedera.com](https://portal.hedera.com/)

### Setup

```bash
git clone https://github.com/i-coders-uttecam/hiero-enterprise-react.git
cd hiero-enterprise-react
pnpm install
```

### Commands

```bash
pnpm build       # Build all packages
pnpm test        # Run all tests
pnpm typecheck   # Type checking
pnpm clean       # Clean build outputs
```

### Commit convention

All commits must be DCO signed and GPG signed (Hiero requirement):

```bash
git commit --signoff -S -m "feat: add useBalance hook"
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

## Project Structure

```
hiero-enterprise-react/
├── packages/
│   ├── core/              # Base services (HieroClient, AccountService, MirrorNodeClient)
│   │   ├── src/
│   │   └── __tests__/
│   ├── react/             # React hooks and HieroProvider
│   │   ├── src/
│   │   └── __tests__/
│   └── sample-app/        # Next.js demo application
├── .github/workflows/     # CI pipeline
├── CONTRIBUTING.md         # Contribution guidelines (DCO, GPG)
├── LICENSE                 # Apache 2.0
└── README.md
```

## Team

**I-CODERS** — Universidad Tecnológica de Tecamachalco (UTTecam)

- **Ehime** — Core services, MirrorNodeClient, CI
- **Emmanuel** — TokenService, HieroProvider, hooks, docs
- **Rafiz** — useTransfer, useMirrorQuery, sample app

## License

Licensed under the [Apache License 2.0](./LICENSE).

## Acknowledgements

- [hiero-enterprise-java](https://github.com/hiero-ledger/hiero-enterprise-java) — The reference architecture this project is based on
- [Hiero](https://hiero.org) — Open-source DLT by Linux Foundation Decentralized Trust
- [Hedera](https://hedera.com) — Public ledger built on Hiero
- [Hedera Hello Future Apex Hackathon 2026](https://hellofuturehackathon.dev/) — Hosted by AngelHack & Hashgraph
