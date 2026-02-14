import type {
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils/core";
import type { Address, Hash, Hex, TransactionReceipt } from "viem";

import type { IERC721CollectionWriter, IERC721WriteClient } from "../types/client.js";
import type { ERC721WriteClientOptions } from "../types/options.js";
import { ERC721CollectionWriter } from "../collections/erc721CollectionWriter.js";
import { validateAddress } from "../helpers/validateAddress.js";
import { ERC721ReadClient } from "./erc721ReadClient.js";

export class ERC721WriteClient extends ERC721ReadClient implements IERC721WriteClient {
    constructor(options: ERC721WriteClientOptions) {
        super(options);
    }

    async prepareApprove(
        collection: Address,
        to: Address,
        tokenId: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(collection);
        validateAddress(to);
        return this.contract.prepare(collection, "approve", [to, tokenId]);
    }

    async prepareSetApprovalForAll(
        collection: Address,
        operator: Address,
        approved: boolean,
    ): Promise<PreparedTransaction> {
        validateAddress(collection);
        validateAddress(operator);
        return this.contract.prepare(collection, "setApprovalForAll", [operator, approved]);
    }

    async prepareTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(collection);
        validateAddress(from);
        validateAddress(to);
        return this.contract.prepare(collection, "transferFrom", [from, to, tokenId]);
    }

    async prepareSafeTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
    ): Promise<PreparedTransaction> {
        validateAddress(collection);
        validateAddress(from);
        validateAddress(to);
        const args = data === undefined ? [from, to, tokenId] : [from, to, tokenId, data];
        return this.contract.prepare(collection, "safeTransferFrom", args);
    }

    async signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction> {
        return this.contract.sign(prepared);
    }

    async sendTransaction(signed: SignedTransaction): Promise<Hash> {
        return this.contract.send(signed);
    }

    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.contract.waitForReceipt(hash);
    }

    async approve(
        collection: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        validateAddress(collection);
        validateAddress(to);
        return this.contract.execute(collection, "approve", [to, tokenId], options);
    }

    async setApprovalForAll(
        collection: Address,
        operator: Address,
        approved: boolean,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        validateAddress(collection);
        validateAddress(operator);
        return this.contract.execute(
            collection,
            "setApprovalForAll",
            [operator, approved],
            options,
        );
    }

    async transferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        validateAddress(collection);
        validateAddress(from);
        validateAddress(to);
        return this.contract.execute(collection, "transferFrom", [from, to, tokenId], options);
    }

    async safeTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        validateAddress(collection);
        validateAddress(from);
        validateAddress(to);
        const args = data === undefined ? [from, to, tokenId] : [from, to, tokenId, data];
        return this.contract.execute(collection, "safeTransferFrom", args, options);
    }

    override forCollection(collection: Address): IERC721CollectionWriter {
        return ERC721CollectionWriter.fromClient(this, collection);
    }
}

export function createERC721WriteClient(options: ERC721WriteClientOptions): IERC721WriteClient {
    return new ERC721WriteClient(options);
}
