import type {
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils-core";
import type { Address, Hash, Hex, TransactionReceipt } from "viem";

import type {
    ERC721CollectionWriterOptions,
    IERC721CollectionWriter,
    IERC721WriteClient,
} from "../types/index.js";
import { ERC721WriteClient } from "../client/erc721WriteClient.js";
import { ERC721CollectionReader } from "./erc721CollectionReader.js";

type WriterInput =
    | ERC721CollectionWriterOptions
    | {
          readonly collection: Address;
          readonly writeClient: IERC721WriteClient;
      };

/**
 * Collection-bound ERC721 writer.
 *
 * Extends `ERC721CollectionReader` and delegates write operations to an
 * underlying `IERC721WriteClient`.
 *
 * @example
 * ```ts
 * const writer = createERC721CollectionWriter({ client: publicClient, walletClient, collection });
 * const hash = await writer.approve(to, tokenId);
 * ```
 */
export class ERC721CollectionWriter
    extends ERC721CollectionReader
    implements IERC721CollectionWriter
{
    readonly writeClient: IERC721WriteClient;

    /**
     * @param {WriterInput} options Writer input with either a pre-built write client or options to create one.
     * @returns {ERC721CollectionWriter} Collection-bound writer.
     * @throws {InvalidAddress} Thrown when `options.collection` is invalid.
     */
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

    /**
     * Creates a collection writer from an existing chain write client.
     *
     * @param {IERC721WriteClient} writeClient Existing ERC721 write client.
     * @param {Address} collection Collection address to bind.
     * @returns {IERC721CollectionWriter} Collection-bound writer interface.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     */
    static override fromClient(
        writeClient: IERC721WriteClient,
        collection: Address,
    ): IERC721CollectionWriter {
        return new ERC721CollectionWriter({ collection, writeClient });
    }

    /**
     * Prepares an `approve` transaction for the bound collection.
     *
     * @param {Address} to Approved address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {Error} Propagates the same errors thrown by `writeClient.prepareApprove`.
     */
    async prepareApprove(to: Address, tokenId: bigint): Promise<PreparedTransaction> {
        return this.writeClient.prepareApprove(this.collection, to, tokenId);
    }

    /**
     * Prepares a `setApprovalForAll` transaction for the bound collection.
     *
     * @param {Address} operator Operator address.
     * @param {boolean} approved Approval value.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {Error} Propagates the same errors thrown by `writeClient.prepareSetApprovalForAll`.
     */
    async prepareSetApprovalForAll(
        operator: Address,
        approved: boolean,
    ): Promise<PreparedTransaction> {
        return this.writeClient.prepareSetApprovalForAll(this.collection, operator, approved);
    }

    /**
     * Prepares a `transferFrom` transaction for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {Error} Propagates the same errors thrown by `writeClient.prepareTransferFrom`.
     */
    async prepareTransferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
    ): Promise<PreparedTransaction> {
        return this.writeClient.prepareTransferFrom(this.collection, from, to, tokenId);
    }

    /**
     * Prepares a `safeTransferFrom` transaction for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {Hex} [data] Optional transfer data payload.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {Error} Propagates the same errors thrown by `writeClient.prepareSafeTransferFrom`.
     */
    async prepareSafeTransferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
    ): Promise<PreparedTransaction> {
        return this.writeClient.prepareSafeTransferFrom(this.collection, from, to, tokenId, data);
    }

    /**
     * Signs a prepared transaction.
     *
     * @param {PreparedTransaction} prepared Prepared payload.
     * @returns {Promise<SignedTransaction>} Signed transaction payload.
     * @throws {Error} Propagates the same errors thrown by `writeClient.signTransaction`.
     */
    async signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction> {
        return this.writeClient.signTransaction(prepared);
    }

    /**
     * Broadcasts a signed transaction.
     *
     * @param {SignedTransaction} signed Signed payload.
     * @returns {Promise<Hash>} Transaction hash.
     * @throws {Error} Propagates the same errors thrown by `writeClient.sendTransaction`.
     */
    async sendTransaction(signed: SignedTransaction): Promise<Hash> {
        return this.writeClient.sendTransaction(signed);
    }

    /**
     * Waits for transaction inclusion.
     *
     * @param {Hash} hash Transaction hash.
     * @returns {Promise<TransactionReceipt>} Final transaction receipt.
     * @throws {Error} Propagates the same errors thrown by `writeClient.waitForReceipt`.
     */
    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.writeClient.waitForReceipt(hash);
    }

    /**
     * Executes `approve` for the bound collection.
     *
     * @param {Address} to Approved address.
     * @param {bigint} tokenId Token ID.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {Error} Propagates the same errors thrown by `writeClient.approve`.
     */
    async approve(
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        return this.writeClient.approve(this.collection, to, tokenId, options);
    }

    /**
     * Executes `setApprovalForAll` for the bound collection.
     *
     * @param {Address} operator Operator address.
     * @param {boolean} approved Approval value.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {Error} Propagates the same errors thrown by `writeClient.setApprovalForAll`.
     */
    async setApprovalForAll(
        operator: Address,
        approved: boolean,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        return this.writeClient.setApprovalForAll(this.collection, operator, approved, options);
    }

    /**
     * Executes `transferFrom` for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {Error} Propagates the same errors thrown by `writeClient.transferFrom`.
     */
    async transferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        return this.writeClient.transferFrom(this.collection, from, to, tokenId, options);
    }

    /**
     * Executes `safeTransferFrom` for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {Hex} [data] Optional transfer data payload.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {Error} Propagates the same errors thrown by `writeClient.safeTransferFrom`.
     */
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

/**
 * Factory helper for creating a collection-bound ERC721 writer.
 *
 * @param {ERC721CollectionWriterOptions} options Collection writer options.
 * @returns {IERC721CollectionWriter} Collection-bound writer interface implementation.
 */
export function createERC721CollectionWriter(
    options: ERC721CollectionWriterOptions,
): IERC721CollectionWriter {
    return new ERC721CollectionWriter(options);
}
