import type { ContractClient, MulticallItemResult } from "@0xtan0/chain-utils/core";
import type { Address, Hex, WalletClient } from "viem";
import { CompositeErrorDecoder, createContractClient } from "@0xtan0/chain-utils/core";

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
import { ERC721ErrorDecoder } from "../decoder/index.js";
import { NotERC721Enumerable } from "../errors/index.js";
import { validateAddress } from "../helpers/index.js";

const ERC721_ENUMERABLE_INTERFACE_ID = "0x780e9d63" as Hex;

export class ERC721ReadClient implements IERC721Read {
    readonly contract: ContractClient<ERC721Abi>;
    readonly chainId: number;
    readonly supportsMulticall: boolean;

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

    async supportsInterface(collection: Address, interfaceId: Hex): Promise<boolean> {
        validateAddress(collection);
        return this.contract.read(collection, "supportsInterface", [interfaceId]);
    }

    async getCollectionMetadata(collection: Address): Promise<CollectionMetadata> {
        validateAddress(collection);

        const [name, symbol] = await Promise.all([
            this.contract.read(collection, "name"),
            this.contract.read(collection, "symbol"),
        ]);

        return { address: collection, chainId: this.chainId, name, symbol };
    }

    async getOwnerOf(collection: Address, tokenId: bigint): Promise<TokenOwner> {
        validateAddress(collection);

        const owner = await this.contract.read(collection, "ownerOf", [tokenId]);

        return {
            nft: this.createNftReference(collection, tokenId),
            owner,
        };
    }

    async getBalance(collection: Address, owner: Address): Promise<bigint> {
        validateAddress(collection);
        validateAddress(owner);

        return this.contract.read(collection, "balanceOf", [owner]);
    }

    async getApproved(collection: Address, tokenId: bigint): Promise<TokenApproval> {
        validateAddress(collection);

        const approved = await this.contract.read(collection, "getApproved", [tokenId]);

        return {
            nft: this.createNftReference(collection, tokenId),
            approved,
        };
    }

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

    async getTokenURI(collection: Address, tokenId: bigint): Promise<TokenURI> {
        validateAddress(collection);

        const tokenURI = await this.contract.read(collection, "tokenURI", [tokenId]);

        return {
            nft: this.createNftReference(collection, tokenId),
            tokenURI,
        };
    }

    async getTotalSupply(collection: Address): Promise<bigint> {
        await this.assertEnumerable(collection);
        return this.contract.read(collection, "totalSupply");
    }

    async getTokenByIndex(collection: Address, index: bigint): Promise<bigint> {
        await this.assertEnumerable(collection);
        return this.contract.read(collection, "tokenByIndex", [index]);
    }

    async getTokenOfOwnerByIndex(
        collection: Address,
        owner: Address,
        index: bigint,
    ): Promise<bigint> {
        validateAddress(owner);
        await this.assertEnumerable(collection);
        return this.contract.read(collection, "tokenOfOwnerByIndex", [owner, index]);
    }

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

    async getTotalSupplies(
        queries: ReadonlyArray<TotalSupplyQuery>,
    ): Promise<BatchTotalSupplyResult> {
        for (const query of queries) {
            validateAddress(query.collection);
        }

        await this.assertEnumerableBatch(queries.map((q) => q.collection));

        const calls = queries.map((q) => ({
            address: q.collection,
            functionName: "totalSupply",
        }));

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<bigint, TotalSupplyQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    async getTokenByIndexes(
        queries: ReadonlyArray<TokenByIndexQuery>,
    ): Promise<BatchTokenByIndexResult> {
        for (const query of queries) {
            validateAddress(query.collection);
        }

        await this.assertEnumerableBatch(queries.map((q) => q.collection));

        const calls = queries.map((q) => ({
            address: q.collection,
            functionName: "tokenByIndex",
            args: [q.index],
        }));

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<bigint, TokenByIndexQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
    }

    async getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<TokenOfOwnerByIndexQuery>,
    ): Promise<BatchTokenOfOwnerByIndexResult> {
        for (const query of queries) {
            validateAddress(query.collection);
            validateAddress(query.owner);
        }

        await this.assertEnumerableBatch(queries.map((q) => q.collection));

        const calls = queries.map((q) => ({
            address: q.collection,
            functionName: "tokenOfOwnerByIndex",
            args: [q.owner, q.index],
        }));

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults<bigint, TokenOfOwnerByIndexQuery>(
            batch.results,
            queries,
        );

        return { chainId: batch.chainId, results, queries, failures };
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

    private async assertEnumerableBatch(collections: ReadonlyArray<Address>): Promise<void> {
        const uniqueCollections = Array.from(new Set(collections));
        await Promise.all(uniqueCollections.map((collection) => this.assertEnumerable(collection)));
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

export function createERC721Client(options: ERC721ClientOptions): IERC721Read {
    return new ERC721ReadClient(options);
}
