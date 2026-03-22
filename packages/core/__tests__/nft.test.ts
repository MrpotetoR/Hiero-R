import { describe, it, expect, vi, beforeEach } from "vitest";
import { NftService } from "../src/nft";

function createMockClient() {
  return {
    operatorAccountId: { toString: () => "0.0.12345" },
  } as any;
}

vi.mock("@hashgraph/sdk", () => {
  const mockReceipt = {
    tokenId: { toString: () => "0.0.777777" },
    serials: [1n, 2n, 3n],
  };

  const mockResponse = {
    getReceipt: vi.fn().mockResolvedValue(mockReceipt),
  };

  const mockFrozenTx = {
    sign: vi.fn().mockResolvedValue({
      execute: vi.fn().mockResolvedValue(mockResponse),
    }),
    execute: vi.fn().mockResolvedValue(mockResponse),
  };

  return {
    TokenId: {
      fromString: vi.fn((id: string) => ({ toString: () => id })),
    },
    AccountId: {
      fromString: vi.fn((id: string) => ({ toString: () => id })),
    },
    NftId: vi.fn().mockImplementation((tokenId, serial) => ({
      tokenId,
      serial,
    })),
    TokenCreateTransaction: vi.fn().mockImplementation(() => ({
      setTokenName: vi.fn().mockReturnThis(),
      setTokenSymbol: vi.fn().mockReturnThis(),
      setTokenType: vi.fn().mockReturnThis(),
      setSupplyType: vi.fn().mockReturnThis(),
      setSupplyKey: vi.fn().mockReturnThis(),
      setTreasuryAccountId: vi.fn().mockReturnThis(),
      setDecimals: vi.fn().mockReturnThis(),
      setInitialSupply: vi.fn().mockReturnThis(),
      setMaxSupply: vi.fn().mockReturnThis(),
      setTokenMemo: vi.fn().mockReturnThis(),
      freezeWith: vi.fn().mockReturnValue(mockFrozenTx),
    })),
    TokenMintTransaction: vi.fn().mockImplementation(() => ({
      setTokenId: vi.fn().mockReturnThis(),
      setMetadata: vi.fn().mockReturnThis(),
      freezeWith: vi.fn().mockReturnValue({
        sign: vi.fn().mockResolvedValue({
          execute: vi.fn().mockResolvedValue(mockResponse),
        }),
      }),
    })),
    TransferTransaction: vi.fn().mockImplementation(() => ({
      addNftTransfer: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({
        getReceipt: vi.fn().mockResolvedValue({ status: "SUCCESS" }),
      }),
    })),
    TokenType: {
      NonFungibleUnique: "NON_FUNGIBLE_UNIQUE",
    },
    TokenSupplyType: {
      Finite: "FINITE",
      Infinite: "INFINITE",
    },
    PrivateKey: {
      generateED25519: vi.fn(() => ({
        toString: () => "generated-key",
        publicKey: { toString: () => "publickey" },
      })),
      fromStringDer: vi.fn((k: string) => ({ toString: () => k })),
    },
  };
});

describe("NftService", () => {
  let service: NftService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockClient();
    service = new NftService(mockClient);
  });

  describe("createCollection", () => {
    it("should create an NFT collection and return tokenId", async () => {
      const tokenId = await service.createCollection({
        name: "My NFTs",
        symbol: "MNFT",
        treasuryAccountId: "0.0.12345",
      });

      expect(tokenId).toBe("0.0.777777");
    });

    it("should create collection with custom maxSupply and memo", async () => {
      const tokenId = await service.createCollection({
        name: "Limited NFTs",
        symbol: "LNFT",
        treasuryAccountId: "0.0.12345",
        maxSupply: 100,
        memo: "Limited edition collection",
      });

      expect(tokenId).toBe("0.0.777777");
    });

    it("should handle missing tokenId in receipt", async () => {
      const { TokenCreateTransaction } = await import("@hashgraph/sdk");
      vi.mocked(TokenCreateTransaction).mockImplementationOnce(() => ({
        setTokenName: vi.fn().mockReturnThis(),
        setTokenSymbol: vi.fn().mockReturnThis(),
        setTokenType: vi.fn().mockReturnThis(),
        setSupplyType: vi.fn().mockReturnThis(),
        setSupplyKey: vi.fn().mockReturnThis(),
        setTreasuryAccountId: vi.fn().mockReturnThis(),
        setDecimals: vi.fn().mockReturnThis(),
        setInitialSupply: vi.fn().mockReturnThis(),
        freezeWith: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue({
            getReceipt: vi.fn().mockResolvedValue({ tokenId: null }),
          }),
        }),
      }) as any);

      await expect(
        service.createCollection({
          name: "Fail",
          symbol: "F",
          treasuryAccountId: "0.0.12345",
        })
      ).rejects.toThrow("NFT collection creation failed: no token ID in receipt");
    });
  });

  describe("mint", () => {
    it("should mint NFTs and return serial numbers", async () => {
      const { PrivateKey } = await import("@hashgraph/sdk");
      const supplyKey = PrivateKey.fromStringDer("supply-key");

      const metadata = [
        new TextEncoder().encode("NFT #1"),
        new TextEncoder().encode("NFT #2"),
        new TextEncoder().encode("NFT #3"),
      ];

      const serials = await service.mint("0.0.777777", metadata, supplyKey as any);

      expect(serials).toEqual([1, 2, 3]);
      expect(serials).toHaveLength(3);
    });

    it("should mint a single NFT", async () => {
      const { PrivateKey } = await import("@hashgraph/sdk");
      const supplyKey = PrivateKey.fromStringDer("supply-key");

      const metadata = [new TextEncoder().encode("Single NFT")];
      const serials = await service.mint("0.0.777777", metadata, supplyKey as any);

      expect(serials.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("transfer", () => {
    it("should transfer an NFT between accounts", async () => {
      await expect(
        service.transfer("0.0.777777", 1, "0.0.11111", "0.0.22222")
      ).resolves.toBeUndefined();
    });
  });
});
