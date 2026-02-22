import type {
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils-core";
import type { Address, Hash, Hex, TransactionReceipt } from "viem";

import type { IERC721CollectionWriter, IERC721WriteClient } from "../types/client.js";
import type { ERC721WriteClientOptions } from "../types/options.js";
import { ERC721CollectionWriter } from "../collections/erc721CollectionWriter.js";
import { validateAddress } from "../helpers/validateAddress.js";
import { ERC721ReadClient } from "./erc721ReadClient.js";

/**
 * Single-chain ERC721 write client.
 *
 * Extends `ERC721ReadClient` with prepare/sign/send helpers and
 * convenience write methods for approvals and transfers.
 *
 * @example
 * ```ts
 * const write = createERC721WriteClient({ client: publicClient, walletClient });
 * const receipt = await write.safeTransferFrom(collection, from, to, tokenId, undefined, {
 *   waitForReceipt: true,
 * });
 * ```
 */
export class ERC721WriteClient extends ERC721ReadClient implements IERC721WriteClient {
    /**
     * @param {ERC721WriteClientOptions} options Write client options including wallet client.
     * @returns {ERC721WriteClient} A chain-bound ERC721 write client.
     */
    constructor(options: ERC721WriteClientOptions) {
        super(options);
    }

    /**
     * Prepares an `approve` transaction.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} to Approved address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `collection` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
    async prepareApprove(
        collection: Address,
        to: Address,
        tokenId: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(collection);
        validateAddress(to);
        return this.contract.prepare(collection, "approve", [to, tokenId]);
    }

    /**
     * Prepares a `setApprovalForAll` transaction.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} operator Operator address.
     * @param {boolean} approved Approval value.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `collection` or `operator` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
    async prepareSetApprovalForAll(
        collection: Address,
        operator: Address,
        approved: boolean,
    ): Promise<PreparedTransaction> {
        validateAddress(collection);
        validateAddress(operator);
        return this.contract.prepare(collection, "setApprovalForAll", [operator, approved]);
    }

    /**
     * Prepares a `transferFrom` transaction.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
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

    /**
     * Prepares a `safeTransferFrom` transaction.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {Hex} [data] Optional transfer data payload.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
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

    /**
     * Signs a prepared transaction.
     *
     * @param {PreparedTransaction} prepared Prepared payload.
     * @returns {Promise<SignedTransaction>} Signed transaction payload.
     * @throws {ChainUtilsFault} Thrown for chain mismatches or missing wallet/account.
     * @throws {Error} Propagates signer failures.
     */
    async signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction> {
        return this.contract.sign(prepared);
    }

    /**
     * Broadcasts a signed transaction.
     *
     * @param {SignedTransaction} signed Signed payload.
     * @returns {Promise<Hash>} Transaction hash.
     * @throws {ChainUtilsFault} Thrown when signed payload chain ID mismatches the client chain.
     * @throws {Error} Propagates broadcast failures.
     */
    async sendTransaction(signed: SignedTransaction): Promise<Hash> {
        return this.contract.send(signed);
    }

    /**
     * Waits for transaction inclusion.
     *
     * @param {Hash} hash Transaction hash.
     * @returns {Promise<TransactionReceipt>} Final transaction receipt.
     * @throws {Error} Propagates receipt polling failures.
     */
    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.contract.waitForReceipt(hash);
    }

    /**
     * Executes `approve` end-to-end.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} to Approved address.
     * @param {bigint} tokenId Token ID.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `collection` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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

    /**
     * Executes `setApprovalForAll` end-to-end.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} operator Operator address.
     * @param {boolean} approved Approval value.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `collection` or `operator` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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

    /**
     * Executes `transferFrom` end-to-end.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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

    /**
     * Executes `safeTransferFrom` end-to-end.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {Hex} [data] Optional transfer data payload.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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

    /**
     * Creates a collection-bound writer facade.
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {IERC721CollectionWriter} Collection-scoped writer.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     */
    override forCollection(collection: Address): IERC721CollectionWriter {
        return ERC721CollectionWriter.fromClient(this, collection);
    }
}

/**
 * Factory helper for creating an ERC721 write client.
 *
 * @param {ERC721WriteClientOptions} options Write client options.
 * @returns {IERC721WriteClient} ERC721 write client interface implementation.
 */
export function createERC721WriteClient(options: ERC721WriteClientOptions): IERC721WriteClient {
    return new ERC721WriteClient(options);
}
