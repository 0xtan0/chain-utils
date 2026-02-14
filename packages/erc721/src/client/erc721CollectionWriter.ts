import type {
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils/core";
import type { Address, Hash, Hex, TransactionReceipt } from "viem";

import type {
    ERC721CollectionWriterOptions,
    IERC721CollectionWriter,
    IERC721WriteClient,
} from "../types/index.js";
import { ERC721CollectionReader } from "./erc721CollectionReader.js";
import { ERC721WriteClient } from "./erc721WriteClient.js";

type WriterInput =
    | ERC721CollectionWriterOptions
    | {
          readonly collection: Address;
          readonly writeClient: IERC721WriteClient;
      };

export class ERC721CollectionWriter
    extends ERC721CollectionReader
    implements IERC721CollectionWriter
{
    readonly writeClient: IERC721WriteClient;

    constructor(options: WriterInput) {
        if ("writeClient" in options) {
            super({ collection: options.collection, readClient: options.writeClient });
            this.writeClient = options.writeClient;
            return;
        }

        const writeClient = new ERC721WriteClient(options);
        super({ collection: options.collection, readClient: writeClient });
        this.writeClient = writeClient;
    }

    static override fromClient(
        writeClient: IERC721WriteClient,
        collection: Address,
    ): IERC721CollectionWriter {
        return new ERC721CollectionWriter({ collection, writeClient });
    }

    async prepareApprove(to: Address, tokenId: bigint): Promise<PreparedTransaction> {
        return this.writeClient.prepareApprove(this.collection, to, tokenId);
    }

    async prepareSetApprovalForAll(
        operator: Address,
        approved: boolean,
    ): Promise<PreparedTransaction> {
        return this.writeClient.prepareSetApprovalForAll(this.collection, operator, approved);
    }

    async prepareTransferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
    ): Promise<PreparedTransaction> {
        return this.writeClient.prepareTransferFrom(this.collection, from, to, tokenId);
    }

    async prepareSafeTransferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
    ): Promise<PreparedTransaction> {
        return this.writeClient.prepareSafeTransferFrom(this.collection, from, to, tokenId, data);
    }

    async signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction> {
        return this.writeClient.signTransaction(prepared);
    }

    async sendTransaction(signed: SignedTransaction): Promise<Hash> {
        return this.writeClient.sendTransaction(signed);
    }

    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.writeClient.waitForReceipt(hash);
    }

    async approve(
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        return this.writeClient.approve(this.collection, to, tokenId, options);
    }

    async setApprovalForAll(
        operator: Address,
        approved: boolean,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        return this.writeClient.setApprovalForAll(this.collection, operator, approved, options);
    }

    async transferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        return this.writeClient.transferFrom(this.collection, from, to, tokenId, options);
    }

    async safeTransferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        return this.writeClient.safeTransferFrom(this.collection, from, to, tokenId, data, options);
    }
}

export function createERC721CollectionWriter(
    options: ERC721CollectionWriterOptions,
): IERC721CollectionWriter {
    return new ERC721CollectionWriter(options);
}
