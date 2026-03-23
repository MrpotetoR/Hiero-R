import {
  Client,
  FileId,
  FileCreateTransaction,
  FileContentsQuery,
  FileInfoQuery,
  FileAppendTransaction,
  FileUpdateTransaction,
  FileDeleteTransaction,
  PrivateKey,
} from "@hashgraph/sdk";

/** Simplified file information */
export interface HieroFileInfo {
  fileId: string;
  size: number;
  isDeleted: boolean;
  expirationTime: string | null;
  memo: string;
}

/** Parameters for creating a file */
export interface CreateFileParams {
  contents: string | Uint8Array;
  keys?: PrivateKey[];
  memo?: string;
  expirationTime?: Date;
}

/**
 * Service for interacting with files on the Hiero network.
 *
 * Equivalent to `FileClient` in hiero-enterprise-java.
 * Supports creating, reading, updating, appending, and deleting files
 * stored on the Hiero distributed ledger.
 *
 * @example
 * ```ts
 * const service = new FileService(client);
 * const fileId = await service.createFile({ contents: "Hello Hiero!" });
 * const contents = await service.getContents(fileId);
 * ```
 */
export class FileService {
  constructor(private readonly client: Client) {}

  /**
   * Creates a new file on the Hiero network.
   *
   * @param params - File creation parameters
   * @returns The new file ID as a string
   */
  async createFile(params: CreateFileParams): Promise<string> {
    const tx = new FileCreateTransaction()
      .setContents(params.contents);

    if (params.keys && params.keys.length > 0) {
      tx.setKeys(params.keys.map((k) => k.publicKey));
    }
    if (params.memo) {
      tx.setFileMemo(params.memo);
    }
    if (params.expirationTime) {
      tx.setExpirationTime(params.expirationTime);
    }

    const response = await tx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    if (!receipt.fileId) {
      throw new Error("File creation failed: no file ID in receipt");
    }

    return receipt.fileId.toString();
  }

  /**
   * Reads the contents of a file.
   *
   * @param fileId - The file ID to read (e.g., "0.0.150")
   * @returns The file contents as a Uint8Array
   */
  async getContents(fileId: string): Promise<Uint8Array> {
    const contents = await new FileContentsQuery()
      .setFileId(FileId.fromString(fileId))
      .execute(this.client);

    return contents;
  }

  /**
   * Queries information about a file.
   *
   * @param fileId - The file ID to query
   * @returns Simplified file information
   */
  async getInfo(fileId: string): Promise<HieroFileInfo> {
    const info = await new FileInfoQuery()
      .setFileId(FileId.fromString(fileId))
      .execute(this.client);

    return {
      fileId: info.fileId.toString(),
      size: Number(info.size),
      isDeleted: info.isDeleted,
      expirationTime: info.expirationTime?.toDate().toISOString() ?? null,
      memo: info.fileMemo,
    };
  }

  /**
   * Appends content to an existing file.
   *
   * @param fileId - The file ID to append to
   * @param contents - The content to append
   */
  async appendContents(
    fileId: string,
    contents: string | Uint8Array
  ): Promise<void> {
    const tx = new FileAppendTransaction()
      .setFileId(FileId.fromString(fileId))
      .setContents(contents);

    const response = await tx.execute(this.client);
    await response.getReceipt(this.client);
  }

  /**
   * Updates the contents of an existing file.
   *
   * @param fileId - The file ID to update
   * @param contents - The new contents
   */
  async updateContents(
    fileId: string,
    contents: string | Uint8Array
  ): Promise<void> {
    const tx = new FileUpdateTransaction()
      .setFileId(FileId.fromString(fileId))
      .setContents(contents);

    const response = await tx.execute(this.client);
    await response.getReceipt(this.client);
  }

  /**
   * Deletes a file from the network.
   *
   * @param fileId - The file ID to delete
   */
  async deleteFile(fileId: string): Promise<void> {
    const tx = new FileDeleteTransaction()
      .setFileId(FileId.fromString(fileId));

    const response = await tx.execute(this.client);
    await response.getReceipt(this.client);
  }
}
