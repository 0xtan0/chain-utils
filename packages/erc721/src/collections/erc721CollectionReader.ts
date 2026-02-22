import type { Address, Hex } from "viem";

import type {
    BatchApprovalResult,
    BatchBalanceResult,
    BatchInterfaceSupportResult,
    BatchOperatorApprovalResult,
    BatchOwnerResult,
    BatchTokenByIndexResult,
    BatchTokenOfOwnerByIndexResult,
    BatchTokenURIResult,
    BatchTotalSupplyResult,
    CollectionMetadata,
    CollectionOperatorApprovalQuery,
    CollectionTokenOfOwnerByIndexQuery,
    ERC721CollectionReaderOptions,
    IERC721CollectionReader,
    IERC721Read,
    OperatorApproval,
    TokenApproval,
    TokenOwner,
    TokenURI,
} from "../types/index.js";
import { ERC721ReadClient } from "../client/erc721ReadClient.js";
import { validateAddress } from "../helpers/validateAddress.js";

type ReaderInput =
    | ERC721CollectionReaderOptions
    | {
          readonly collection: Address;
          readonly readClient: IERC721Read;
      };

/**
 * Collection-bound ERC721 reader.
 *
 * Provides collection-scoped wrappers around `IERC721Read` methods so callers
 * do not need to pass the collection address repeatedly.
 *
 * @example
 * ```ts
 * const reader = createERC721CollectionReader({ client: publicClient, collection });
 * const owner = await reader.getOwnerOf(1n);
 * ```
 */
export class ERC721CollectionReader implements IERC721CollectionReader {
    readonly collection: Address;
    readonly chainId: number;
    readonly supportsMulticall: boolean;
    readonly readClient: IERC721Read;

    /**
     * @param {ReaderInput} options Reader input with either a pre-built read client or options to create one.
     * @returns {ERC721CollectionReader} Collection-bound reader.
     * @throws {InvalidAddress} Thrown when `options.collection` is invalid.
     */
    constructor(options: ReaderInput) {
        validateAddress(options.collection);
        this.collection = options.collection;

        if ("readClient" in options) {
            this.readClient = options.readClient;
        } else {
            this.readClient = new ERC721ReadClient(options);
        }

        this.chainId = this.readClient.chainId;
        this.supportsMulticall = this.readClient.supportsMulticall;
    }

    /**
     * Creates a collection reader from an existing chain read client.
     *
     * @param {IERC721Read} readClient Existing ERC721 read client.
     * @param {Address} collection Collection address to bind.
     * @returns {IERC721CollectionReader} Collection-bound reader interface.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     */
    static fromClient(readClient: IERC721Read, collection: Address): IERC721CollectionReader {
        return new ERC721CollectionReader({ readClient, collection });
    }

    /**
     * Checks ERC165 interface support on the bound collection.
     *
     * @param {Hex} interfaceId ERC165 interface ID (`bytes4`).
     * @returns {Promise<boolean>} `true` when interface is supported.
     * @throws {Error} Propagates the same errors thrown by `readClient.supportsInterface`.
     */
    async supportsInterface(interfaceId: Hex): Promise<boolean> {
        return this.readClient.supportsInterface(this.collection, interfaceId);
    }

    /**
     * Reads metadata for the bound collection.
     *
     * @returns {Promise<CollectionMetadata>} Collection metadata.
     * @throws {Error} Propagates the same errors thrown by `readClient.getCollectionMetadata`.
     */
    async getCollectionMetadata(): Promise<CollectionMetadata> {
        return this.readClient.getCollectionMetadata(this.collection);
    }

    /**
     * Reads token owner in the bound collection.
     *
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenOwner>} Owner result.
     * @throws {Error} Propagates the same errors thrown by `readClient.getOwnerOf`.
     */
    async getOwnerOf(tokenId: bigint): Promise<TokenOwner> {
        return this.readClient.getOwnerOf(this.collection, tokenId);
    }

    /**
     * Reads owner balance in the bound collection.
     *
     * @param {Address} owner Owner address.
     * @returns {Promise<bigint>} Owner token balance.
     * @throws {Error} Propagates the same errors thrown by `readClient.getBalance`.
     */
    async getBalance(owner: Address): Promise<bigint> {
        return this.readClient.getBalance(this.collection, owner);
    }

    /**
     * Reads token approval in the bound collection.
     *
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenApproval>} Approval result.
     * @throws {Error} Propagates the same errors thrown by `readClient.getApproved`.
     */
    async getApproved(tokenId: bigint): Promise<TokenApproval> {
        return this.readClient.getApproved(this.collection, tokenId);
    }

    /**
     * Reads operator approval in the bound collection.
     *
     * @param {Address} owner Owner address.
     * @param {Address} operator Operator address.
     * @returns {Promise<OperatorApproval>} Operator approval result.
     * @throws {Error} Propagates the same errors thrown by `readClient.isApprovedForAll`.
     */
    async isApprovedForAll(owner: Address, operator: Address): Promise<OperatorApproval> {
        return this.readClient.isApprovedForAll(this.collection, owner, operator);
    }

    /**
     * Reads token URI in the bound collection.
     *
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenURI>} Token URI result.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTokenURI`.
     */
    async getTokenURI(tokenId: bigint): Promise<TokenURI> {
        return this.readClient.getTokenURI(this.collection, tokenId);
    }

    /**
     * Reads total supply in the bound collection.
     *
     * @returns {Promise<bigint>} Total supply.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTotalSupply`.
     */
    async getTotalSupply(): Promise<bigint> {
        return this.readClient.getTotalSupply(this.collection);
    }

    /**
     * Reads token ID by global index in the bound collection.
     *
     * @param {bigint} index Global token index.
     * @returns {Promise<bigint>} Token ID.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTokenByIndex`.
     */
    async getTokenByIndex(index: bigint): Promise<bigint> {
        return this.readClient.getTokenByIndex(this.collection, index);
    }

    /**
     * Reads token ID by owner index in the bound collection.
     *
     * @param {Address} owner Owner address.
     * @param {bigint} index Owner token index.
     * @returns {Promise<bigint>} Token ID.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTokenOfOwnerByIndex`.
     */
    async getTokenOfOwnerByIndex(owner: Address, index: bigint): Promise<bigint> {
        return this.readClient.getTokenOfOwnerByIndex(this.collection, owner, index);
    }

    /**
     * Reads owners for multiple token IDs in the bound collection.
     *
     * @param {ReadonlyArray<bigint>} tokenIds Token IDs.
     * @returns {Promise<BatchOwnerResult>} Batch owner response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getOwners`.
     */
    async getOwners(tokenIds: ReadonlyArray<bigint>): Promise<BatchOwnerResult> {
        return this.readClient.getOwners(
            tokenIds.map((tokenId) => ({ collection: this.collection, tokenId })),
        );
    }

    /**
     * Reads token URIs for multiple token IDs in the bound collection.
     *
     * @param {ReadonlyArray<bigint>} tokenIds Token IDs.
     * @returns {Promise<BatchTokenURIResult>} Batch token URI response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTokenURIs`.
     */
    async getTokenURIs(tokenIds: ReadonlyArray<bigint>): Promise<BatchTokenURIResult> {
        return this.readClient.getTokenURIs(
            tokenIds.map((tokenId) => ({ collection: this.collection, tokenId })),
        );
    }

    /**
     * Reads approvals for multiple token IDs in the bound collection.
     *
     * @param {ReadonlyArray<bigint>} tokenIds Token IDs.
     * @returns {Promise<BatchApprovalResult>} Batch approval response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getApprovals`.
     */
    async getApprovals(tokenIds: ReadonlyArray<bigint>): Promise<BatchApprovalResult> {
        return this.readClient.getApprovals(
            tokenIds.map((tokenId) => ({ collection: this.collection, tokenId })),
        );
    }

    /**
     * Reads balances for multiple owners in the bound collection.
     *
     * @param {ReadonlyArray<Address>} owners Owner addresses.
     * @returns {Promise<BatchBalanceResult>} Batch balance response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getBalances`.
     */
    async getBalances(owners: ReadonlyArray<Address>): Promise<BatchBalanceResult> {
        return this.readClient.getBalances(
            owners.map((owner) => ({ collection: this.collection, owner })),
        );
    }

    /**
     * Reads operator approvals for owner/operator pairs in the bound collection.
     *
     * @param {ReadonlyArray<CollectionOperatorApprovalQuery>} queries Owner/operator queries.
     * @returns {Promise<BatchOperatorApprovalResult>} Batch operator approval response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getOperatorApprovals`.
     */
    async getOperatorApprovals(
        queries: ReadonlyArray<CollectionOperatorApprovalQuery>,
    ): Promise<BatchOperatorApprovalResult> {
        return this.readClient.getOperatorApprovals(
            queries.map((query) => ({
                collection: this.collection,
                owner: query.owner,
                operator: query.operator,
            })),
        );
    }

    /**
     * Reads ERC165 support for multiple interface IDs in the bound collection.
     *
     * @param {ReadonlyArray<Hex>} interfaceIds ERC165 interface IDs.
     * @returns {Promise<BatchInterfaceSupportResult>} Batch interface support response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getInterfaceSupports`.
     */
    async getInterfaceSupports(
        interfaceIds: ReadonlyArray<Hex>,
    ): Promise<BatchInterfaceSupportResult> {
        return this.readClient.getInterfaceSupports(
            interfaceIds.map((interfaceId) => ({
                collection: this.collection,
                interfaceId,
            })),
        );
    }

    /**
     * Reads total supply for the bound collection as a batch.
     *
     * @returns {Promise<BatchTotalSupplyResult>} Batch total supply response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTotalSupplies`.
     */
    async getTotalSupplies(): Promise<BatchTotalSupplyResult> {
        return this.readClient.getTotalSupplies([{ collection: this.collection }]);
    }

    /**
     * Reads token IDs by index for the bound collection.
     *
     * @param {ReadonlyArray<bigint>} indexes Global token indexes.
     * @returns {Promise<BatchTokenByIndexResult>} Batch token-by-index response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTokenByIndexes`.
     */
    async getTokenByIndexes(indexes: ReadonlyArray<bigint>): Promise<BatchTokenByIndexResult> {
        return this.readClient.getTokenByIndexes(
            indexes.map((index) => ({ collection: this.collection, index })),
        );
    }

    /**
     * Reads token IDs by owner index for the bound collection.
     *
     * @param {ReadonlyArray<CollectionTokenOfOwnerByIndexQuery>} queries Owner/index queries.
     * @returns {Promise<BatchTokenOfOwnerByIndexResult>} Batch token-of-owner-by-index response.
     * @throws {Error} Propagates the same errors thrown by `readClient.getTokenOfOwnerByIndexes`.
     */
    async getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<CollectionTokenOfOwnerByIndexQuery>,
    ): Promise<BatchTokenOfOwnerByIndexResult> {
        return this.readClient.getTokenOfOwnerByIndexes(
            queries.map((query) => ({
                collection: this.collection,
                owner: query.owner,
                index: query.index,
            })),
        );
    }
}

/**
 * Factory helper for creating a collection-bound ERC721 reader.
 *
 * @param {ERC721CollectionReaderOptions} options Collection reader options.
 * @returns {IERC721CollectionReader} Collection-bound reader interface implementation.
 */
export function createERC721CollectionReader(
    options: ERC721CollectionReaderOptions,
): IERC721CollectionReader {
    return new ERC721CollectionReader(options);
}
