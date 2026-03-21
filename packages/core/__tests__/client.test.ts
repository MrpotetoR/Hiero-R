import { describe, it, expect, vi } from "vitest";
import { createHieroClient, getMirrorUrl } from "../src/client";
import { Client } from "@hashgraph/sdk";

// Mock the entire @hashgraph/sdk module
vi.mock("@hashgraph/sdk", () => {
  const mockClient = {
    setOperator: vi.fn(),
  };

  return {
    Client: {
      forMainnet: vi.fn(() => ({ ...mockClient })),
      forTestnet: vi.fn(() => ({ ...mockClient })),
      forPreviewnet: vi.fn(() => ({ ...mockClient })),
    },
    AccountId: {
      fromString: vi.fn((id: string) => ({ toString: () => id })),
    },
    PrivateKey: {
      fromStringDer: vi.fn((key: string) => ({ toString: () => key })),
    },
  };
});

describe("createHieroClient", () => {
  it("should create a testnet client", () => {
    const client = createHieroClient({
      network: "testnet",
      operatorId: "0.0.12345",
      operatorKey: "302e020100300506032b6570042204200000",
    });

    expect(vi.mocked(Client.forTestnet)).toHaveBeenCalled();
    expect(client.setOperator).toHaveBeenCalled();
  });

  it("should create a mainnet client", () => {
    createHieroClient({
      network: "mainnet",
      operatorId: "0.0.12345",
      operatorKey: "302e020100300506032b6570042204200000",
    });

    expect(vi.mocked(Client.forMainnet)).toHaveBeenCalled();
  });

  it("should create a previewnet client", () => {
    createHieroClient({
      network: "previewnet",
      operatorId: "0.0.12345",
      operatorKey: "302e020100300506032b6570042204200000",
    });

    expect(vi.mocked(Client.forPreviewnet)).toHaveBeenCalled();
  });

  it("should throw for unsupported network", () => {
    expect(() =>
      createHieroClient({
        network: "invalid" as any,
        operatorId: "0.0.12345",
        operatorKey: "302e020100300506032b6570042204200000",
      })
    ).toThrow("Unsupported network");
  });
});

describe("getMirrorUrl", () => {
  it("should return testnet mirror URL", () => {
    const url = getMirrorUrl("testnet");
    expect(url).toBe("https://testnet.mirrornode.hedera.com");
  });

  it("should return mainnet mirror URL", () => {
    const url = getMirrorUrl("mainnet");
    expect(url).toBe("https://mainnet.mirrornode.hedera.com");
  });

  it("should return previewnet mirror URL", () => {
    const url = getMirrorUrl("previewnet");
    expect(url).toBe("https://previewnet.mirrornode.hedera.com");
  });

  it("should throw for invalid network", () => {
    expect(() => getMirrorUrl("invalid" as any)).toThrow("No Mirror Node URL");
  });
});
