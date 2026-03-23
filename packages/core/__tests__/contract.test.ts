import { describe, it, expect, vi, beforeEach } from "vitest";
import { SmartContractService } from "../src/contract";

// Mock @hashgraph/sdk
vi.mock("@hashgraph/sdk", () => {
  const mockContractReceipt = {
    contractId: { toString: () => "0.0.5001" },
  };
  const mockFunctionResult = {
    getString: vi.fn(() => "hello"),
    getInt256: vi.fn(() => 42),
    gasUsed: 25000,
  };
  const mockRecord = {
    contractFunctionResult: mockFunctionResult,
  };
  const mockResponse = {
    getReceipt: vi.fn().mockResolvedValue(mockContractReceipt),
    getRecord: vi.fn().mockResolvedValue(mockRecord),
  };

  return {
    Client: { forTestnet: vi.fn(() => ({})) },
    ContractId: { fromString: vi.fn((id: string) => ({ toString: () => id })) },
    ContractCreateFlow: vi.fn(() => ({
      setBytecode: vi.fn().mockReturnThis(),
      setGas: vi.fn().mockReturnThis(),
      setConstructorParameters: vi.fn().mockReturnThis(),
      setAdminKey: vi.fn().mockReturnThis(),
      setInitialBalance: vi.fn().mockReturnThis(),
      setContractMemo: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockResponse),
    })),
    ContractExecuteTransaction: vi.fn(() => ({
      setContractId: vi.fn().mockReturnThis(),
      setGas: vi.fn().mockReturnThis(),
      setFunction: vi.fn().mockReturnThis(),
      setPayableAmount: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockResponse),
    })),
    ContractCallQuery: vi.fn(() => ({
      setContractId: vi.fn().mockReturnThis(),
      setGas: vi.fn().mockReturnThis(),
      setFunction: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockFunctionResult),
    })),
    ContractInfoQuery: vi.fn(() => ({
      setContractId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({
        contractId: { toString: () => "0.0.5001" },
        accountId: { toString: () => "0.0.5001" },
        adminKey: { toString: () => "mock-admin-key" },
        balance: { toString: () => "0 ℏ" },
        isDeleted: false,
        contractMemo: "test contract",
        storage: 256,
        autoRenewPeriod: 7776000,
      }),
    })),
    ContractDeleteTransaction: vi.fn(() => ({
      setContractId: vi.fn().mockReturnThis(),
      setTransferAccountId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockResponse),
    })),
    ContractFunctionParameters: vi.fn(() => ({})),
    Hbar: class {
      constructor(public amount: number) {}
      toString() { return `${this.amount} ℏ`; }
    },
  };
});

describe("SmartContractService", () => {
  let service: SmartContractService;

  beforeEach(() => {
    const { Client } = require("@hashgraph/sdk");
    service = new SmartContractService(Client.forTestnet());
  });

  describe("deploy", () => {
    it("should deploy a contract and return contract ID", async () => {
      const contractId = await service.deploy({
        bytecode: "0x608060405234801561001057600080fd5b50",
        gas: 100_000,
      });

      expect(contractId).toBe("0.0.5001");
    });

    it("should deploy with memo", async () => {
      const contractId = await service.deploy({
        bytecode: "0x608060",
        gas: 100_000,
        memo: "my contract",
      });

      expect(contractId).toBe("0.0.5001");
    });
  });

  describe("execute", () => {
    it("should execute a contract function and return result", async () => {
      const result = await service.execute({
        contractId: "0.0.5001",
        functionName: "setMessage",
        gas: 50_000,
      });

      expect(result).toBeDefined();
      expect(result.gasUsed).toBe(25000);
    });
  });

  describe("call", () => {
    it("should call a read-only function", async () => {
      const result = await service.call({
        contractId: "0.0.5001",
        functionName: "getMessage",
        gas: 30_000,
      });

      expect(result).toBeDefined();
      expect(result.getString(0)).toBe("hello");
    });
  });

  describe("getInfo", () => {
    it("should return contract information", async () => {
      const info = await service.getInfo("0.0.5001");

      expect(info.contractId).toBe("0.0.5001");
      expect(info.isDeleted).toBe(false);
      expect(info.memo).toBe("test contract");
      expect(info.storage).toBe(256);
    });
  });

  describe("deleteContract", () => {
    it("should delete a contract", async () => {
      await expect(
        service.deleteContract("0.0.5001", "0.0.12345")
      ).resolves.toBeUndefined();
    });
  });
});
