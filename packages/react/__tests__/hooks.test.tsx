import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderHook } from "@testing-library/react";
import { useHieroContext, HieroProvider } from "../src/HieroProvider";
import { useBalance } from "../src/useBalance";
import { useTransfer } from "../src/useTransfer";
import { useTokenInfo } from "../src/useTokenInfo";
import { useAccountInfo } from "../src/useAccountInfo";
import { useMirrorQuery } from "../src/useMirrorQuery";

// ─── Mocks ───

const mockBalance = {
  hbars: { toString: () => "10 ℏ" },
  tokens: new Map(),
};

const mockAccountInfo = {
  accountId: "0.0.100",
  balance: { toString: () => "10 ℏ" },
  isDeleted: false,
  key: null,
  memo: "test",
  autoRenewPeriod: null,
  createdTimestamp: null,
};

const mockTokenInfo = {
  tokenId: "0.0.456",
  name: "Test Token",
  symbol: "TKN",
  decimals: 2,
  totalSupply: "1000000",
  treasuryAccountId: "0.0.12345",
  type: "FUNGIBLE_COMMON",
  supplyType: "INFINITE",
  maxSupply: "0",
  memo: "",
  isDeleted: false,
};

const mockAccountService = {
  getBalance: vi.fn().mockResolvedValue(mockBalance),
  getInfo: vi.fn().mockResolvedValue(mockAccountInfo),
  transferHbar: vi.fn().mockResolvedValue({}),
  createAccount: vi.fn().mockResolvedValue("0.0.99999"),
};

const mockTokenService = {
  getInfo: vi.fn().mockResolvedValue(mockTokenInfo),
  createToken: vi.fn(),
  associateToken: vi.fn(),
};

const mockNftService = {
  createCollection: vi.fn(),
  mint: vi.fn(),
  transfer: vi.fn(),
};

const mockFileService = {
  createFile: vi.fn(),
  getContents: vi.fn(),
  getInfo: vi.fn(),
  appendContents: vi.fn(),
  updateContents: vi.fn(),
  deleteFile: vi.fn(),
};

const mockContractService = {
  deploy: vi.fn(),
  execute: vi.fn(),
  call: vi.fn(),
  getInfo: vi.fn(),
  deleteContract: vi.fn(),
};

const mockMirrorClient = {
  getAccount: vi.fn(),
  getAccountTokens: vi.fn(),
  getAccountNfts: vi.fn(),
  getAccountTransactions: vi.fn(),
  getToken: vi.fn(),
  getTokenNfts: vi.fn(),
  query: vi.fn(),
  queryPaginated: vi.fn().mockResolvedValue({
    data: [{ token_id: "0.0.1", balance: 100 }],
    nextLink: null,
    fetchNext: async () => null,
  }),
};

// Mock the core module
vi.mock("@i-coders/hiero-core", () => ({
  createHieroClient: vi.fn(() => ({})),
  getMirrorUrl: vi.fn(() => "https://testnet.mirrornode.hedera.com"),
  AccountService: vi.fn(() => mockAccountService),
  TokenService: vi.fn(() => mockTokenService),
  NftService: vi.fn(() => mockNftService),
  FileService: vi.fn(() => mockFileService),
  SmartContractService: vi.fn(() => mockContractService),
  MirrorNodeClient: vi.fn(() => mockMirrorClient),
}));

vi.mock("@hashgraph/sdk", () => ({
  Client: {
    forTestnet: vi.fn(() => ({})),
    forMainnet: vi.fn(() => ({})),
    forPreviewnet: vi.fn(() => ({})),
  },
  Hbar: class {
    constructor(public amount: number) {}
    toString() { return `${this.amount} ℏ`; }
  },
}));

// ─── Helper ───

const testConfig = {
  network: "testnet" as const,
  operatorId: "0.0.12345",
  operatorKey: "302e020100300506032b6570042204200000",
};

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <HieroProvider config={testConfig}>{children}</HieroProvider>
  );
}

// ─── Tests ───

describe("HieroProvider", () => {
  it("should provide context to children", () => {
    const { result } = renderHook(() => useHieroContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.config).toEqual(testConfig);
    expect(result.current.accountService).toBeDefined();
    expect(result.current.tokenService).toBeDefined();
    expect(result.current.nftService).toBeDefined();
    expect(result.current.mirrorClient).toBeDefined();
  });

  it("should throw when used outside provider", () => {
    expect(() => {
      renderHook(() => useHieroContext());
    }).toThrow("useHieroContext must be used within a <HieroProvider>");
  });
});

describe("useBalance", () => {
  it("should fetch balance on mount", async () => {
    const { result } = renderHook(() => useBalance("0.0.100"), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for the async fetch
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balance).toBeDefined();
    expect(result.current.error).toBeNull();
    expect(mockAccountService.getBalance).toHaveBeenCalledWith("0.0.100");
  });

  it("should handle null accountId", async () => {
    const { result } = renderHook(() => useBalance(null), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balance).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should handle errors", async () => {
    mockAccountService.getBalance.mockRejectedValueOnce(
      new Error("Account not found")
    );

    const { result } = renderHook(() => useBalance("0.0.invalid"), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Account not found");
    expect(result.current.balance).toBeNull();
  });
});

describe("useTransfer", () => {
  it("should start in idle state", () => {
    const { result } = renderHook(() => useTransfer(), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("should provide send and reset functions", () => {
    const { result } = renderHook(() => useTransfer(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.send).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });
});

describe("useTokenInfo", () => {
  it("should fetch token info on mount", async () => {
    const { result } = renderHook(() => useTokenInfo("0.0.456"), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.token).toBeDefined();
    expect(result.current.token?.name).toBe("Test Token");
    expect(result.current.token?.symbol).toBe("TKN");
    expect(result.current.error).toBeNull();
  });

  it("should handle null tokenId", async () => {
    const { result } = renderHook(() => useTokenInfo(null), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.token).toBeNull();
  });
});

describe("useAccountInfo", () => {
  it("should fetch account info on mount", async () => {
    const { result } = renderHook(() => useAccountInfo("0.0.100"), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.account).toBeDefined();
    expect(result.current.account?.accountId).toBe("0.0.100");
    expect(result.current.error).toBeNull();
  });
});

describe("useMirrorQuery", () => {
  it("should fetch paginated data on mount", async () => {
    const { result } = renderHook(
      () => useMirrorQuery("/api/v1/accounts/0.0.100/tokens", "tokens"),
      { wrapper: createWrapper() }
    );

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toEqual({ token_id: "0.0.1", balance: 100 });
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should skip query when path is null", async () => {
    const { result } = renderHook(
      () => useMirrorQuery(null, "tokens"),
      { wrapper: createWrapper() }
    );

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(0);
  });

  it("should skip query when disabled", async () => {
    const { result } = renderHook(
      () =>
        useMirrorQuery("/api/v1/tokens", "tokens", { enabled: false }),
      { wrapper: createWrapper() }
    );

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(0);
  });
});
