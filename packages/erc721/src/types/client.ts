import type {
    ContractClient,
    CrossChainBatchResult,
    MultichainContract,
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils/core";
import type { Address, Hash, Hex, TransactionReceipt } from "viem";

import type { ERC721Abi } from "../abi/erc721Abi.js";
import type {
    ApprovalQuery,
    BalanceQuery,
    BatchApprovalResult,
    BatchBalanceResult,
    BatchInterfaceSupportResult,
    BatchOperatorApprovalResult,
    BatchOwnerResult,
    BatchTokenByIndexResult,
    BatchTokenOfOwnerByIndexResult,
    BatchTokenURIResult,
    BatchTotalSupplyResult,
    InterfaceSupportQuery,
    OperatorApprovalQuery,
    OwnerQuery,
    TokenByIndexQuery,
    TokenOfOwnerByIndexQuery,
    TokenURIQuery,
    TotalSupplyQuery,
} from "./query.js";
import type {
    CollectionMetadata,
    OperatorApproval,
    TokenApproval,
    TokenOwner,
    TokenURI,
} from "./token.js";

/**
 * Single-chain ERC721 read client.
 *
 * Composes a ContractClient<ERC721Abi> and provides typed,
 * domain-specific read operations.
 */
export interface IERC721Read {
    /** The underlying generic contract client. */
    readonly contract: ContractClient<ERC721Abi>;

    /** The chain this client operates on. */
    readonly chainId: number;

    /** Whether this chain supports multicall3. */
    readonly supportsMulticall: boolean;

    // ---- Single reads ----

    supportsInterface(collection: Address, interfaceId: Hex): Promise<boolean>;

    getCollectionMetadata(collection: Address): Promise<CollectionMetadata>;
    getOwnerOf(collection: Address, tokenId: bigint): Promise<TokenOwner>;
    getBalance(collection: Address, owner: Address): Promise<bigint>;
    getApproved(collection: Address, tokenId: bigint): Promise<TokenApproval>;
    isApprovedForAll(
        collection: Address,
        owner: Address,
        operator: Address,
    ): Promise<OperatorApproval>;
    getTokenURI(collection: Address, tokenId: bigint): Promise<TokenURI>;
    getTotalSupply(collection: Address): Promise<bigint>;
    getTokenByIndex(collection: Address, index: bigint): Promise<bigint>;
    getTokenOfOwnerByIndex(collection: Address, owner: Address, index: bigint): Promise<bigint>;

    // ---- Batch reads (multicall) ----

    getOwners(queries: ReadonlyArray<OwnerQuery>): Promise<BatchOwnerResult>;
    getTokenURIs(queries: ReadonlyArray<TokenURIQuery>): Promise<BatchTokenURIResult>;
    getApprovals(queries: ReadonlyArray<ApprovalQuery>): Promise<BatchApprovalResult>;
    getBalances(queries: ReadonlyArray<BalanceQuery>): Promise<BatchBalanceResult>;
    getOperatorApprovals(
        queries: ReadonlyArray<OperatorApprovalQuery>,
    ): Promise<BatchOperatorApprovalResult>;
    getInterfaceSupports(
        queries: ReadonlyArray<InterfaceSupportQuery>,
    ): Promise<BatchInterfaceSupportResult>;
    getTotalSupplies(queries: ReadonlyArray<TotalSupplyQuery>): Promise<BatchTotalSupplyResult>;
    getTokenByIndexes(queries: ReadonlyArray<TokenByIndexQuery>): Promise<BatchTokenByIndexResult>;
    getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<TokenOfOwnerByIndexQuery>,
    ): Promise<BatchTokenOfOwnerByIndexResult>;
}

/**
 * Single-chain ERC721 write client.
 *
 * Extends IERC721Read. Adds full transaction lifecycle
 * for approvals and transfers.
 */
export interface IERC721WriteClient extends IERC721Read {
    // ---- Prepare (simulate + gas estimate, no signing) ----

    prepareApprove(collection: Address, to: Address, tokenId: bigint): Promise<PreparedTransaction>;

    prepareSetApprovalForAll(
        collection: Address,
        operator: Address,
        approved: boolean,
    ): Promise<PreparedTransaction>;

    prepareTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
    ): Promise<PreparedTransaction>;

    prepareSafeTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
    ): Promise<PreparedTransaction>;

    // ---- Sign (returns signed bytes, no broadcast) ----

    signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction>;

    // ---- Send (broadcast signed tx) ----

    sendTransaction(signed: SignedTransaction): Promise<Hash>;

    // ---- Wait (wait for tx to be mined) ----

    waitForReceipt(hash: Hash): Promise<TransactionReceipt>;

    // ---- Convenience methods (full pipeline) ----

    approve(
        collection: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    setApprovalForAll(
        collection: Address,
        operator: Address,
        approved: boolean,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    transferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    safeTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;
}

/**
 * Multi-chain ERC721 client.
 *
 * Composes a MultichainContract<ERC721Abi, TChainId>. Routes requests
 * to the correct single-chain IERC721Read based on chain ID.
 */
export interface IERC721MultichainClient<TChainId extends number> {
    /** The underlying generic multichain contract. */
    readonly multichain: MultichainContract<ERC721Abi, TChainId>;

    /** All configured chain IDs. */
    readonly chainIds: ReadonlyArray<TChainId>;

    /** Get the single-chain read client for a specific chain. */
    getClient(chainId: TChainId): IERC721Read;

    /** Check whether a chain is configured. */
    hasChain(chainId: number): boolean;

    // ---- Cross-chain reads ----

    getOwners(
        queries: ReadonlyArray<OwnerQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchOwnerResult>>;

    getTokenURIs(
        queries: ReadonlyArray<TokenURIQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTokenURIResult>>;

    getApprovals(
        queries: ReadonlyArray<ApprovalQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchApprovalResult>>;

    getBalances(
        queries: ReadonlyArray<BalanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    getOperatorApprovals(
        queries: ReadonlyArray<OperatorApprovalQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchOperatorApprovalResult>>;

    getInterfaceSupports(
        queries: ReadonlyArray<InterfaceSupportQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchInterfaceSupportResult>>;

    getTotalSupplies(
        queries: ReadonlyArray<TotalSupplyQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTotalSupplyResult>>;

    getTokenByIndexes(
        queries: ReadonlyArray<TokenByIndexQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTokenByIndexResult>>;

    getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<TokenOfOwnerByIndexQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTokenOfOwnerByIndexResult>>;
}
