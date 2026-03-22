import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenService } from "../src/token";

function createMockClient() {
  return {
    operatorAccountId: { toString: () => "0.0.12345" },
  } as any;
}

vi.mock("@hashgraph/sdk", () => {
  const mockTokenInfo = {
    tokenId: { toString: () => "0.0.456789" },
    name: "TestToken",
    symbol: "TT",
    decimals: 2,
    totalSupply: { toString: () => "1000000" },
    treasuryAccountId: { toString: () => "0.0.12345" },
    tokenType: { toString: () => "FUNGIBLE_COMMON" },
    supplyType: { toString: () => "INFINITE" },
    maxSupply: { toString: () => "0" },
    tokenMemo: "A test token",
    isDeleted: false,
  };

  const mockReceipt = {
    tokenId: { toString: () => "0.0.456789" },
  };

  const mockResponse = {
    getReceipt: vi.fn().mockResolvedValue(mockReceipt),
  };

  return {
    TokenId: {
      fromString: vi.fn((id: string) => ({ toString: () => id })),
    },
    AccountId: {
      fromString: vi.fn((id: string) => ({ toString: () => id })),
    },
    TokenInfoQuery: vi.fn().mockImplementation(() => ({
      setTokenId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockTokenInfo),
    })),
    TokenCreateTransaction: vi.fn().mockImplementation(() => ({
      setTokenName: vi.fn().mockReturnThis(),
      setTokenSymbol: vi.fn().mockReturnThis(),
      setDecimals: vi.fn().mockReturnThis(),
      setInitialSupply: vi.fn().mockReturnThis(),
      setTreasuryAccountId: vi.fn().mockReturnThis(),
      setTokenType: vi.fn().mockReturnThis(),
      setSupplyType: vi.fn().mockReturnThis(),
      setMaxSupply: vi.fn().mockReturnThis(),
      setTokenMemo: vi.fn().mockReturnThis(),
      freezeWith: vi.fn().mockReturnValue({
        sign: vi.fn().mockResolvedValue({
          execute: vi.fn().mockResolvedValue(mockResponse),
        }),
        execute: vi.fn().mockResolvedValue(mockResponse),
      }),
    })),
    TokenAssociateTransaction: vi.fn().mockImplementation(() => ({
      setAccountId: vi.fn().mockReturnThis(),
      setTokenIds: vi.fn().mockReturnThis(),
      freezeWith: vi.fn().mockReturnValue({
        sign: vi.fn().mockResolvedValue({
          execute: vi.fn().mockResolvedValue({
            getReceipt: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
          }),
        }),
      }),
    })),
    TokenType: {
      FungibleCommon: "FUNGIBLE_COMMON",
    },
    TokenSupplyType: {
      Finite: "FINITE",
      Infinite: "INFINITE",
    },
    TokenMintTransaction: vi.fn(),
    Hbar: class {
      constructor(public amount: number) {}
      toString() { return `${this.amount} ℏ`; }
    },
    PrivateKey: {
      fromStringDer: vi.fn((k: string) => ({ toString: () => k })),
    },
  };
});

describe("TokenService", () => {
  let service: TokenService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockClient();
    service = new TokenService(mockClient);
  });

  describe("getInfo", () => {
    it("should return token info with correct fields", async () => {
      const info = await service.getInfo("0.0.456789");

      expect(info.tokenId).toBe("0.0.456789");
      expect(info.name).toBe("TestToken");
      expect(info.symbol).toBe("TT");
      expect(info.decimals).toBe(2);
      expect(info.totalSupply).toBe("1000000");
      expect(info.treasuryAccountId).toBe("0.0.12345");
      expect(info.type).toBe("FUNGIBLE_COMMON");
      expect(info.supplyType).toBe("INFINITE");
      expect(info.memo).toBe("A test token");
      expect(info.isDeleted).toBe(false);
    });

    it("should handle null treasuryAccountId gracefully", async () => {
      const { TokenInfoQuery } = await import("@hashgraph/sdk");
      vi.mocked(TokenInfoQuery).mockImplementationOnce(() => ({
        setTokenId: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({
          tokenId: { toString: () => "0.0.456789" },
          name: "NullTreasury",
          symbol: "NT",
          decimals: 0,
          totalSupply: { toString: () => "0" },
          treasuryAccountId: null,
          tokenType: null,
          supplyType: null,
          maxSupply: null,
          tokenMemo: "",
          isDeleted: false,
        }),
      }) as any);

      const info = await service.getInfo("0.0.456789");

      expect(info.treasuryAccountId).toBe("");
      expect(info.type).toBe("UNKNOWN");
      expect(info.supplyType).toBe("UNKNOWN");
      expect(info.maxSupply).toBe("0");
    });
  });

  describe("createToken", () => {
    it("should create a fungible token and return tokenId", async () => {
      const tokenId = await service.createToken({
        name: "MyToken",
        symbol: "MT",
        treasuryAccountId: "0.0.12345",
      });

      expect(tokenId).toBe("0.0.456789");
    });

    it("should create a token with custom parameters", async () => {
      const tokenId = await service.createToken({
        name: "CustomToken",
        symbol: "CT",
        decimals: 8,
        initialSupply: 1000,
        treasuryAccountId: "0.0.12345",
        maxSupply: 10000,
        memo: "Custom token memo",
      });

      expect(tokenId).toBe("0.0.456789");
    });

    it("should handle missing tokenId in receipt", async () => {
      const { TokenCreateTransaction } = await import("@hashgraph/sdk");
      vi.mocked(TokenCreateTransaction).mockImplementationOnce(() => ({
        setTokenName: vi.fn().mockReturnThis(),
        setTokenSymbol: vi.fn().mockReturnThis(),
        setDecimals: vi.fn().mockReturnThis(),
        setInitialSupply: vi.fn().mockReturnThis(),
        setTreasuryAccountId: vi.fn().mockReturnThis(),
        setTokenType: vi.fn().mockReturnThis(),
        setSupplyType: vi.fn().mockReturnThis(),
        freezeWith: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue({
            getReceipt: vi.fn().mockResolvedValue({ tokenId: null }),
          }),
        }),
      }) as any);

      await expect(
        service.createToken({
          name: "FailToken",
          symbol: "FT",
          treasuryAccountId: "0.0.12345",
        })
      ).rejects.toThrow("Token creation failed: no token ID in receipt");
    });
  });

  describe("associateToken", () => {
    it("should associate a token with an account", async () => {
      const { PrivateKey } = await import("@hashgraph/sdk");
      const mockKey = PrivateKey.fromStringDer("mock-key");

      await expect(
        service.associateToken("0.0.99999", "0.0.456789", mockKey as any)
      ).resolves.toBeUndefined();
    });
  });
});
