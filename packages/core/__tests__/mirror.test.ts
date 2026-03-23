import { describe, it, expect, vi, beforeEach } from "vitest";
import { MirrorNodeClient } from "../src/mirror";

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("MirrorNodeClient", () => {
  let client: MirrorNodeClient;

  beforeEach(() => {
    client = new MirrorNodeClient("https://testnet.mirrornode.hedera.com");
    mockFetch.mockReset();
  });

  describe("getAccount", () => {
    it("should fetch account details", async () => {
      const mockAccount = {
        account: "0.0.100",
        balance: { balance: 1000000000, timestamp: "1234567890.000", tokens: [] },
        created_timestamp: "1234567890.000",
        memo: "",
        alias: null,
        evm_address: null,
        key: null,
        auto_renew_period: null,
        deleted: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccount,
      });

      const result = await client.getAccount("0.0.100");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.100",
        expect.objectContaining({ headers: { Accept: "application/json" } })
      );
      expect(result.account).toBe("0.0.100");
      expect(result.balance.balance).toBe(1000000000);
    });

    it("should throw on HTTP error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(client.getAccount("0.0.999999999")).rejects.toThrow(
        "Mirror Node request failed: 404 Not Found"
      );
    });
  });

  describe("getAccountTokens", () => {
    it("should fetch paginated token balances", async () => {
      const mockResponse = {
        tokens: [
          { token_id: "0.0.100001", balance: 500 },
          { token_id: "0.0.100002", balance: 1000 },
        ],
        links: { next: "/api/v1/accounts/0.0.100/tokens?limit=25&token.id=gt:0.0.100002" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getAccountTokens("0.0.100");

      expect(result.data).toHaveLength(2);
      expect(result.data[0].token_id).toBe("0.0.100001");
      expect(result.nextLink).toBeTruthy();
      expect(typeof result.fetchNext).toBe("function");
    });

    it("should handle empty token list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tokens: [], links: { next: null } }),
      });

      const result = await client.getAccountTokens("0.0.100");

      expect(result.data).toHaveLength(0);
      expect(result.nextLink).toBeNull();
    });

    it("should apply query options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tokens: [], links: { next: null } }),
      });

      await client.getAccountTokens("0.0.100", { limit: 10, order: "desc" });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("limit=10");
      expect(calledUrl).toContain("order=desc");
    });
  });

  describe("getAccountNfts", () => {
    it("should fetch paginated NFTs", async () => {
      const mockResponse = {
        nfts: [
          { token_id: "0.0.200001", serial_number: 1, account_id: "0.0.100", metadata: "aGVsbG8=", created_timestamp: "123", modified_timestamp: "123", deleted: false },
        ],
        links: { next: null },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getAccountNfts("0.0.100");

      expect(result.data).toHaveLength(1);
      expect(result.data[0].serial_number).toBe(1);
      expect(result.hasNextPage).toBeFalsy;
    });
  });

  describe("getToken", () => {
    it("should fetch token details", async () => {
      const mockToken = {
        token_id: "0.0.456789",
        symbol: "TKN",
        name: "Test Token",
        decimals: "2",
        total_supply: "1000000",
        type: "FUNGIBLE_COMMON",
        treasury_account_id: "0.0.12345",
        created_timestamp: "123456.000",
        memo: "test",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      });

      const result = await client.getToken("0.0.456789");

      expect(result.token_id).toBe("0.0.456789");
      expect(result.symbol).toBe("TKN");
      expect(result.type).toBe("FUNGIBLE_COMMON");
    });
  });

  describe("pagination", () => {
    it("should support fetchNext for paginated results", async () => {
      // First page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tokens: [{ token_id: "0.0.1", balance: 100 }],
          links: { next: "/api/v1/accounts/0.0.100/tokens?token.id=gt:0.0.1" },
        }),
      });

      const page1 = await client.getAccountTokens("0.0.100");
      expect(page1.data).toHaveLength(1);
      expect(page1.nextLink).toBeTruthy();

      // Second page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tokens: [{ token_id: "0.0.2", balance: 200 }],
          links: { next: null },
        }),
      });

      const page2 = await page1.fetchNext();
      expect(page2).not.toBeNull();
      expect(page2!.data).toHaveLength(1);
      expect(page2!.data[0].token_id).toBe("0.0.2");
      expect(page2!.nextLink).toBeNull();

      // No more pages
      const page3 = await page2!.fetchNext();
      expect(page3).toBeNull();
    });
  });

  describe("queryPaginated (generic)", () => {
    it("should support generic paginated queries", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactions: [{ transaction_id: "0.0.100-1234-000" }],
          links: { next: null },
        }),
      });

      const result = await client.queryPaginated<{ transaction_id: string }>(
        "/api/v1/transactions?account.id=0.0.100",
        "transactions"
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].transaction_id).toBe("0.0.100-1234-000");
    });
  });

  describe("constructor", () => {
    it("should strip trailing slash from base URL", async () => {
      const c = new MirrorNodeClient("https://example.com/");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ account: "0.0.1" }),
      });

      await c.getAccount("0.0.1");

      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://example.com/api/v1/accounts/0.0.1"
      );
    });
  });
});
