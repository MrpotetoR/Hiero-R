import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountService } from "../src/account";

// Create mock objects
function createMockClient() {
  return {
    operatorAccountId: { toString: () => "0.0.12345" },
  } as any;
}

// Mock @hashgraph/sdk
vi.mock("@hashgraph/sdk", () => {
  const mockHbar = {
    toString: () => "10 ℏ",
    negated: () => ({ toString: () => "-10 ℏ" }),
  };

  const mockBalance = {
    hbars: mockHbar,
    tokens: {
      _map: new Map([
        [{ toString: () => "0.0.100001" }, 500n],
      ]),
    },
  };

  const mockAccountInfo = {
    accountId: { toString: () => "0.0.100" },
    balance: mockHbar,
    isDeleted: false,
    key: { toString: () => "302a300506032b6570032100" },
    accountMemo: "test account",
    autoRenewPeriod: 7776000n,
  };

  return {
    AccountId: {
      fromString: vi.fn((id: string) => ({ toString: () => id })),
    },
    AccountBalanceQuery: vi.fn().mockImplementation(() => ({
      setAccountId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockBalance),
    })),
    AccountInfoQuery: vi.fn().mockImplementation(() => ({
      setAccountId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockAccountInfo),
    })),
    AccountCreateTransaction: vi.fn().mockImplementation(() => ({
      setKey: vi.fn().mockReturnThis(),
      setInitialBalance: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({
        getReceipt: vi.fn().mockResolvedValue({
          accountId: { toString: () => "0.0.99999" },
        }),
      }),
    })),
    TransferTransaction: vi.fn().mockImplementation(() => ({
      addHbarTransfer: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({
        getReceipt: vi.fn().mockResolvedValue({
          status: { toString: () => "SUCCESS" },
        }),
      }),
    })),
    Hbar: class {
      constructor(public amount: number) {}
      toString() { return `${this.amount} ℏ`; }
      negated() { return new (this.constructor as any)(-this.amount); }
    },
    PrivateKey: {
      generateED25519: vi.fn(() => ({
        publicKey: { toString: () => "publickey" },
      })),
      fromStringDer: vi.fn((k: string) => ({ toString: () => k })),
    },
    Status: {
      Success: { toString: () => "SUCCESS" },
    },
  };
});

describe("AccountService", () => {
  let service: AccountService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockClient();
    service = new AccountService(mockClient);
  });

  describe("getBalance", () => {
    it("should return HBAR and token balances", async () => {
      const result = await service.getBalance("0.0.100");

      expect(result.hbars).toBeDefined();
      expect(result.hbars.toString()).toBe("10 ℏ");
      expect(result.tokens).toBeInstanceOf(Map);
      expect(result.tokens.size).toBe(1);
    });
  });

  describe("getInfo", () => {
    it("should return simplified account info", async () => {
      const result = await service.getInfo("0.0.100");

      expect(result.accountId).toBe("0.0.100");
      expect(result.isDeleted).toBe(false);
      expect(result.memo).toBe("test account");
      expect(result.key).toBeTruthy();
    });
  });

  describe("createAccount", () => {
    it("should create a new account and return the ID", async () => {
      const newId = await service.createAccount();

      expect(newId).toBe("0.0.99999");
    });
  });
});
