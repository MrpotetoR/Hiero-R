import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileService } from "../src/file";

// Mock @hashgraph/sdk
vi.mock("@hashgraph/sdk", () => {
  const mockReceipt = { fileId: { toString: () => "0.0.150" } };
  const mockResponse = { getReceipt: vi.fn().mockResolvedValue(mockReceipt) };

  return {
    Client: { forTestnet: vi.fn(() => ({})) },
    FileId: { fromString: vi.fn((id: string) => ({ toString: () => id })) },
    FileCreateTransaction: vi.fn(() => ({
      setContents: vi.fn().mockReturnThis(),
      setKeys: vi.fn().mockReturnThis(),
      setFileMemo: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockResponse),
    })),
    FileContentsQuery: vi.fn(() => ({
      setFileId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(new Uint8Array([72, 101, 108, 108, 111])),
    })),
    FileInfoQuery: vi.fn(() => ({
      setFileId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({
        fileId: { toString: () => "0.0.150" },
        size: { valueOf: () => 1024 },
        isDeleted: false,
        expirationTime: { toDate: () => new Date("2026-12-31") },
        fileMemo: "test file",
      }),
    })),
    FileAppendTransaction: vi.fn(() => ({
      setFileId: vi.fn().mockReturnThis(),
      setContents: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockResponse),
    })),
    FileUpdateTransaction: vi.fn(() => ({
      setFileId: vi.fn().mockReturnThis(),
      setContents: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockResponse),
    })),
    FileDeleteTransaction: vi.fn(() => ({
      setFileId: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(mockResponse),
    })),
    PrivateKey: {
      generateED25519: vi.fn(() => ({
        publicKey: { toString: () => "mock-pub-key" },
      })),
    },
  };
});

describe("FileService", () => {
  let service: FileService;

  beforeEach(() => {
    const { Client } = require("@hashgraph/sdk");
    service = new FileService(Client.forTestnet());
  });

  describe("createFile", () => {
    it("should create a file and return file ID", async () => {
      const fileId = await service.createFile({
        contents: "Hello Hiero!",
      });

      expect(fileId).toBe("0.0.150");
    });

    it("should create a file with memo", async () => {
      const fileId = await service.createFile({
        contents: "test",
        memo: "my file",
      });

      expect(fileId).toBe("0.0.150");
    });
  });

  describe("getContents", () => {
    it("should return file contents as Uint8Array", async () => {
      const contents = await service.getContents("0.0.150");

      expect(contents).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(contents)).toBe("Hello");
    });
  });

  describe("getInfo", () => {
    it("should return file information", async () => {
      const info = await service.getInfo("0.0.150");

      expect(info.fileId).toBe("0.0.150");
      expect(info.isDeleted).toBe(false);
      expect(info.memo).toBe("test file");
    });
  });

  describe("appendContents", () => {
    it("should append contents to a file", async () => {
      await expect(
        service.appendContents("0.0.150", " World!")
      ).resolves.toBeUndefined();
    });
  });

  describe("updateContents", () => {
    it("should update file contents", async () => {
      await expect(
        service.updateContents("0.0.150", "new content")
      ).resolves.toBeUndefined();
    });
  });

  describe("deleteFile", () => {
    it("should delete a file", async () => {
      await expect(
        service.deleteFile("0.0.150")
      ).resolves.toBeUndefined();
    });
  });
});
