import type { ContractClient, MulticallItemResult } from "@0xtan0/chain-utils-core";
import type { Address, Hex, WalletClient } from "viem";
import { CompositeErrorDecoder, createContractClient } from "@0xtan0/chain-utils-core";

import type { ERC721Abi } from "../abi/index.js";
import type {
    ApprovalQuery,
    BalanceQuery,
    BatchApprovalResult,
    BatchBalanceResult,
    BatchFailure,
    BatchInterfaceSupportResult,
    BatchOperatorApprovalResult,
    BatchOwnerResult,
    BatchTokenByIndexResult,
    BatchTokenOfOwnerByIndexResult,
    BatchTokenURIResult,
    BatchTotalSupplyResult,
    CollectionMetadata,
    ERC721ClientOptions,
    IERC721CollectionReader,
    IERC721Read,
    InterfaceSupportQuery,
    NFTReference,
    OperatorApproval,
    OperatorApprovalQuery,
    OwnerQuery,
    TokenApproval,
    TokenByIndexQuery,
    TokenOfOwnerByIndexQuery,
    TokenOwner,
    TokenURI,
    TokenURIQuery,
    TokenURIResult,
    TotalSupplyQuery,
} from "../types/index.js";
import { erc721Abi } from "../abi/index.js";
import { ERC721CollectionReader } from "../collections/erc721CollectionReader.js";
import { ERC721ErrorDecoder } from "../decoder/index.js";
import { NotERC721Enumerable } from "../errors/index.js";
import { validateAddress } from "../helpers/index.js";

const ERC721_ENUMERABLE_INTERFACE_ID = "0x780e9d63" as Hex;

/**
 * Single-chain ERC721 read client.
 *
 * Wraps a generic `ContractClient<ERC721Abi>` with ERC721-specific read helpers.
 *
 * @example
 * ```ts
 * const read = new ERC721ReadClient({ client: publicClient });
 * const metadata = await read.getCollectionMetadata(collection);
 * ```
 */
export class ERC721ReadClient implements IERC721Read {
    readonly contract: ContractClient<ERC721Abi>;
    readonly chainId: number;
    readonly supportsMulticall: boolean;

    /**
     * @param {ERC721ClientOptions & { walletClient?: WalletClient }} options Read client options and optional wallet for shared contract client creation.
     * @returns {ERC721ReadClient} A chain-bound ERC721 read client.
     */
    constructor(options: ERC721ClientOptions & { walletClient?: WalletClient }) {
        const erc721Decoder = new ERC721ErrorDecoder(options.customErrorAbi);
        const errorDecoder = options.errorDecoder
            ? new CompositeErrorDecoder([erc721Decoder, options.errorDecoder])
            : erc721Decoder;

        this.contract = createContractClient({
            abi: erc721Abi,
            publicClient: options.client,
            walletClient: options.walletClient,
            errorDecoder,
            multicallBatchSize: options.multicallBatchSize,
        });
        this.chainId = this.contract.chainId;
        this.supportsMulticall = this.contract.supportsMulticall;
    }

    /**
     * Checks ERC165 interface support for a collection.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Hex} interfaceId ERC165 interface identifier (`bytes4`).
     * @returns {Promise<boolean>} `true` when interface is supported.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {ContractReverted} Thrown when the lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async supportsInterface(collection: Address, interfaceId: Hex): Promise<boolean> {
        validateAddress(collection);
        return this.contract.read(collection, "supportsInterface", [interfaceId]);
    }

    /**
     * Reads collection metadata (`name`, `symbol`).
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {Promise<CollectionMetadata>} Collection metadata scoped to this chain.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {ContractReverted} Thrown when metadata lookups revert.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getCollectionMetadata(collection: Address): Promise<CollectionMetadata> {
        validateAddress(collection);

        const [name, symbol] = await Promise.all([
            this.contract.read(collection, "name"),
            this.contract.read(collection, "symbol"),
        ]);

        return { address: collection, chainId: this.chainId, name, symbol };
    }

    /**
     * Reads token owner by token ID.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenOwner>} Owner result with NFT context.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when owner lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getOwnerOf(collection: Address, tokenId: bigint): Promise<TokenOwner> {
        validateAddress(collection);

        const owner = await this.contract.read(collection, "ownerOf", [tokenId]);

        return {
            nft: this.createNftReference(collection, tokenId),
            owner,
        };
    }

    /**
     * Reads owner balance for a collection.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} owner Owner address.
     * @returns {Promise<bigint>} Owner token balance.
     * @throws {InvalidAddress} Thrown when `collection` or `owner` is invalid.
     * @throws {InvalidOwner} Thrown when owner is invalid and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when balance lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getBalance(collection: Address, owner: Address): Promise<bigint> {
        validateAddress(collection);
        validateAddress(owner);

        return this.contract.read(collection, "balanceOf", [owner]);
    }

    /**
     * Reads token-level approval.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenApproval>} Approval result with NFT context.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when approval lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getApproved(collection: Address, tokenId: bigint): Promise<TokenApproval> {
        validateAddress(collection);

        const approved = await this.contract.read(collection, "getApproved", [tokenId]);

        return {
            nft: this.createNftReference(collection, tokenId),
            approved,
        };
    }

    /**
     * Reads operator approval for all owner tokens.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} owner Owner address.
     * @param {Address} operator Operator address.
     * @returns {Promise<OperatorApproval>} Operator approval result.
     * @throws {InvalidAddress} Thrown when `collection`, `owner`, or `operator` is invalid.
     * @throws {ContractReverted} Thrown when approval lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async isApprovedForAll(
        collection: Address,
        owner: Address,
        operator: Address,
    ): Promise<OperatorApproval> {
        validateAddress(collection);
        validateAddress(owner);
        validateAddress(operator);

        const approved = await this.contract.read(collection, "isApprovedForAll", [
            owner,
            operator,
        ]);

        return {
            collection: { address: collection, chainId: this.chainId },
            owner,
            operator,
            approved,
        };
    }

    /**
     * Reads token URI.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenURI>} Token URI result with NFT context.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when token URI lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getTokenURI(collection: Address, tokenId: bigint): Promise<TokenURI> {
        validateAddress(collection);

        const tokenURI = await this.contract.read(collection, "tokenURI", [tokenId]);

        return {
            nft: this.createNftReference(collection, tokenId),
            tokenURI,
        };
    }

    /**
     * Reads total supply for an enumerable collection.
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {Promise<bigint>} Total supply.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when total supply lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getTotalSupply(collection: Address): Promise<bigint> {
        await this.assertEnumerable(collection);
        return this.contract.read(collection, "totalSupply");
    }

    /**
     * Reads token ID by global index for an enumerable collection.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {bigint} index Global token index.
     * @returns {Promise<bigint>} Token ID at index.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getTokenByIndex(collection: Address, index: bigint): Promise<bigint> {
        await this.assertEnumerable(collection);
        return this.contract.read(collection, "tokenByIndex", [index]);
    }

    /**
     * Reads token ID by owner-scoped index for an enumerable collection.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} owner Owner address.
     * @param {bigint} index Owner token index.
     * @returns {Promise<bigint>} Token ID at owner index.
     * @throws {InvalidAddress} Thrown when `collection` or `owner` is invalid.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getTokenOfOwnerByIndex(
        collection: Address,
        owner: Address,
        index: bigint,
    ): Promise<bigint> {
        validateAddress(owner);
        await this.assertEnumerable(collection);
        return this.contract.read(collection, "tokenOfOwnerByIndex", [owner, index]);
    }

    /**
     * Reads owners for multiple tokens.
     *
     * @param {ReadonlyArray<OwnerQuery>} queries Owner queries.
     * @returns {Promise<BatchOwnerResult>} Batch owner response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    async getOwners(queries: ReadonlyArray<OwnerQuery>): Promise<BatchOwnerResult> {
        const calls = queries.map((q) => {
            validateAddress(q.collection);
            return {
                address: q.collection,
                functionName: "ownerOf",
                args: [q.tokenId],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<Address, OwnerQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads token URIs for multiple tokens.
     *
     * @param {ReadonlyArray<TokenURIQuery>} queries Token URI queries.
     * @returns {Promise<BatchTokenURIResult>} Batch token URI response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    async getTokenURIs(queries: ReadonlyArray<TokenURIQuery>): Promise<BatchTokenURIResult> {
        const calls = queries.map((q) => {
            validateAddress(q.collection);
            return {
                address: q.collection,
                functionName: "tokenURI",
                args: [q.tokenId],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toTokenURIResults(batch.results, queries);

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads token approvals for multiple tokens.
     *
     * @param {ReadonlyArray<ApprovalQuery>} queries Approval queries.
     * @returns {Promise<BatchApprovalResult>} Batch approval response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    async getApprovals(queries: ReadonlyArray<ApprovalQuery>): Promise<BatchApprovalResult> {
        const calls = queries.map((q) => {
            validateAddress(q.collection);
            return {
                address: q.collection,
                functionName: "getApproved",
                args: [q.tokenId],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<Address, ApprovalQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads balances for multiple collection/owner pairs.
     *
     * @param {ReadonlyArray<BalanceQuery>} queries Balance queries.
     * @returns {Promise<BatchBalanceResult>} Batch balance response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    async getBalances(queries: ReadonlyArray<BalanceQuery>): Promise<BatchBalanceResult> {
        const calls = queries.map((q) => {
            validateAddress(q.collection);
            validateAddress(q.owner);
            return {
                address: q.collection,
                functionName: "balanceOf",
                args: [q.owner],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<bigint, BalanceQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads operator approvals for multiple tuples.
     *
     * @param {ReadonlyArray<OperatorApprovalQuery>} queries Operator approval queries.
     * @returns {Promise<BatchOperatorApprovalResult>} Batch operator approval response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    async getOperatorApprovals(
        queries: ReadonlyArray<OperatorApprovalQuery>,
    ): Promise<BatchOperatorApprovalResult> {
        const calls = queries.map((q) => {
            validateAddress(q.collection);
            validateAddress(q.owner);
            validateAddress(q.operator);
            return {
                address: q.collection,
                functionName: "isApprovedForAll",
                args: [q.owner, q.operator],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<boolean, OperatorApprovalQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads ERC165 interface support for multiple queries.
     *
     * @param {ReadonlyArray<InterfaceSupportQuery>} queries Interface support queries.
     * @returns {Promise<BatchInterfaceSupportResult>} Batch interface support response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    async getInterfaceSupports(
        queries: ReadonlyArray<InterfaceSupportQuery>,
    ): Promise<BatchInterfaceSupportResult> {
        const calls = queries.map((q) => {
            validateAddress(q.collection);
            return {
                address: q.collection,
                functionName: "supportsInterface",
                args: [q.interfaceId],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<boolean, InterfaceSupportQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads total supplies for multiple collections.
     *
     * For non-enumerable collections, a `NotERC721Enumerable` error is returned
     * in the per-query result instead of rejecting the whole batch.
     *
     * @param {ReadonlyArray<TotalSupplyQuery>} queries Total supply queries.
     * @returns {Promise<BatchTotalSupplyResult>} Batch total supply response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    async getTotalSupplies(
        queries: ReadonlyArray<TotalSupplyQuery>,
    ): Promise<BatchTotalSupplyResult> {
        for (const query of queries) {
            validateAddress(query.collection);
        }

        const batch = await this.readEnumerableBatch(queries, (query) => ({
            address: query.collection,
            functionName: "totalSupply",
        }));
        const { results, failures } = this.toBatchResults<bigint, TotalSupplyQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads token-by-index values for multiple collections.
     *
     * For non-enumerable collections, a `NotERC721Enumerable` error is returned
     * in the per-query result instead of rejecting the whole batch.
     *
     * @param {ReadonlyArray<TokenByIndexQuery>} queries Token-by-index queries.
     * @returns {Promise<BatchTokenByIndexResult>} Batch token-by-index response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    async getTokenByIndexes(
        queries: ReadonlyArray<TokenByIndexQuery>,
    ): Promise<BatchTokenByIndexResult> {
        for (const query of queries) {
            validateAddress(query.collection);
        }

        const batch = await this.readEnumerableBatch(queries, (q) => ({
            address: q.collection,
            functionName: "tokenByIndex",
            args: [q.index],
        }));
        const { results, failures } = this.toBatchResults<bigint, TokenByIndexQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads token-of-owner-by-index values for multiple collections.
     *
     * For non-enumerable collections, a `NotERC721Enumerable` error is returned
     * in the per-query result instead of rejecting the whole batch.
     *
     * @param {ReadonlyArray<TokenOfOwnerByIndexQuery>} queries Token-of-owner-by-index queries.
     * @returns {Promise<BatchTokenOfOwnerByIndexResult>} Batch token-of-owner-by-index response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    async getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<TokenOfOwnerByIndexQuery>,
    ): Promise<BatchTokenOfOwnerByIndexResult> {
        for (const query of queries) {
            validateAddress(query.collection);
            validateAddress(query.owner);
        }

        const batch = await this.readEnumerableBatch(queries, (q) => ({
            address: q.collection,
            functionName: "tokenOfOwnerByIndex",
            args: [q.owner, q.index],
        }));
        const { results, failures } = this.toBatchResults<bigint, TokenOfOwnerByIndexQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Creates a collection-bound read facade.
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {IERC721CollectionReader} Collection-scoped reader.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     */
    forCollection(collection: Address): IERC721CollectionReader {
        return ERC721CollectionReader.fromClient(this, collection);
    }

    private createNftReference(collection: Address, tokenId: bigint): NFTReference {
        return {
            collection: { address: collection, chainId: this.chainId },
            tokenId,
        };
    }

    private async assertEnumerable(collection: Address): Promise<void> {
        validateAddress(collection);
        const supported = await this.contract.read(collection, "supportsInterface", [
            ERC721_ENUMERABLE_INTERFACE_ID,
        ]);
        if (!supported) {
            throw new NotERC721Enumerable(collection, this.chainId);
        }
    }

    private async getEnumerableSupportMap(
        collections: ReadonlyArray<Address>,
    ): Promise<ReadonlyMap<Address, boolean>> {
        const uniqueCollections = Array.from(new Set(collections));
        const supportEntries = await Promise.all(
            uniqueCollections.map(async (collection) => {
                const supported = await this.contract.read(collection, "supportsInterface", [
                    ERC721_ENUMERABLE_INTERFACE_ID,
                ]);

                return [collection, supported] as const;
            }),
        );

        return new Map(supportEntries);
    }

    private async readEnumerableBatch<TQuery extends { readonly collection: Address }>(
        queries: ReadonlyArray<TQuery>,
        toCall: (query: TQuery) => {
            address: Address;
            functionName: string;
            args?: ReadonlyArray<unknown>;
        },
    ): Promise<{
        chainId: number;
        results: ReadonlyArray<MulticallItemResult<unknown>>;
    }> {
        const supportMap = await this.getEnumerableSupportMap(
            queries.map((query) => query.collection),
        );

        const calls = queries
            .filter((query) => supportMap.get(query.collection) === true)
            .map((query) => toCall(query));

        const supportedBatch =
            calls.length > 0
                ? await this.contract.readBatch(calls)
                : {
                      chainId: this.chainId,
                      results: [] as ReadonlyArray<MulticallItemResult<unknown>>,
                  };

        const results: MulticallItemResult<unknown>[] = [];
        let supportedIndex = 0;

        for (const query of queries) {
            if (supportMap.get(query.collection) !== true) {
                results.push({
                    status: "failure",
                    error: new NotERC721Enumerable(query.collection, this.chainId),
                });
                continue;
            }

            results.push(supportedBatch.results[supportedIndex]!);
            supportedIndex += 1;
        }

        return { chainId: supportedBatch.chainId, results };
    }

    private toBatchResults<T, TQuery>(
        raw: ReadonlyArray<MulticallItemResult<unknown>>,
        queries: ReadonlyArray<TQuery>,
    ): {
        results: ReadonlyArray<MulticallItemResult<T>>;
        failures: ReadonlyArray<BatchFailure<TQuery>>;
    } {
        const results: MulticallItemResult<T>[] = [];
        const failures: BatchFailure<TQuery>[] = [];

        for (let i = 0; i < raw.length; i++) {
            const r = raw[i]!;
            if (r.status === "success") {
                results.push({ status: "success", result: r.result as T });
            } else {
                results.push({ status: "failure", error: r.error });
                failures.push({ query: queries[i]!, error: r.error });
            }
        }

        return { results, failures };
    }

    private toTokenURIResults(
        raw: ReadonlyArray<MulticallItemResult<unknown>>,
        queries: ReadonlyArray<TokenURIQuery>,
    ): {
        results: ReadonlyArray<TokenURIResult>;
        failures: ReadonlyArray<BatchFailure<TokenURIQuery>>;
    } {
        const results: TokenURIResult[] = [];
        const failures: BatchFailure<TokenURIQuery>[] = [];

        for (let i = 0; i < raw.length; i++) {
            const r = raw[i]!;
            const query = queries[i]!;
            const nft = this.createNftReference(query.collection, query.tokenId);

            if (r.status === "success") {
                results.push({
                    status: "success",
                    data: {
                        nft,
                        tokenURI: r.result as string,
                    },
                });
            } else {
                results.push({
                    status: "failure",
                    nft,
                    errors: [r.error],
                });
                failures.push({ query, error: r.error });
            }
        }

        return { results, failures };
    }
}

/**
 * Factory helper for creating an ERC721 read client.
 *
 * @param {ERC721ClientOptions} options Read client options.
 * @returns {IERC721Read} ERC721 read client interface implementation.
 */
export function createERC721Client(options: ERC721ClientOptions): IERC721Read {
    return new ERC721ReadClient(options);
}
