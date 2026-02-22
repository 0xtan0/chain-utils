import type {
    ContractClient,
    CrossChainBatchResult,
    MultichainContract,
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils-core";
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
 * Collection-scoped operator approval query.
 *
 * @property {Address} owner Owner address.
 * @property {Address} operator Operator address.
 */
export interface CollectionOperatorApprovalQuery {
    readonly owner: Address;
    readonly operator: Address;
}

/**
 * Collection-scoped token-of-owner-by-index query.
 *
 * @property {Address} owner Owner address.
 * @property {bigint} index Owner token index.
 */
export interface CollectionTokenOfOwnerByIndexQuery {
    readonly owner: Address;
    readonly index: bigint;
}

/**
 * Single-chain ERC721 read client.
 *
 * Composes a ContractClient<ERC721Abi> and provides typed,
 * domain-specific read operations.
 *
 * @example
 * ```ts
 * const read = createERC721Client({ client: publicClient });
 * const owner = await read.getOwnerOf(collection, 1n);
 * ```
 */
export interface IERC721Read {
    /** The underlying generic contract client. */
    readonly contract: ContractClient<ERC721Abi>;

    /** The chain this client operates on. */
    readonly chainId: number;

    /** Whether this chain supports multicall3. */
    readonly supportsMulticall: boolean;

    // ---- Single reads ----

    /**
     * Checks ERC165 interface support for a collection.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Hex} interfaceId ERC165 interface identifier (`bytes4`).
     * @returns {Promise<boolean>} `true` when interface is supported.
     * @throws {InvalidAddress} Thrown when `collection` is not a valid EVM address.
     * @throws {ContractReverted} Thrown when the interface lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    supportsInterface(collection: Address, interfaceId: Hex): Promise<boolean>;

    /**
     * Reads collection metadata (`name`, `symbol`).
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {Promise<CollectionMetadata>} Collection metadata bound to this chain.
     * @throws {InvalidAddress} Thrown when `collection` is not a valid EVM address.
     * @throws {ContractReverted} Thrown when metadata reads revert.
     * @throws {Error} Propagates RPC/read failures.
     */
    getCollectionMetadata(collection: Address): Promise<CollectionMetadata>;

    /**
     * Reads token owner by token ID.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenOwner>} Owner result with NFT context.
     * @throws {InvalidAddress} Thrown when `collection` is not a valid EVM address.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when ownership lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getOwnerOf(collection: Address, tokenId: bigint): Promise<TokenOwner>;

    /**
     * Reads owner token balance for a collection.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} owner Owner address.
     * @returns {Promise<bigint>} Owner token balance.
     * @throws {InvalidAddress} Thrown when `collection` or `owner` is invalid.
     * @throws {InvalidOwner} Thrown when owner is invalid and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when balance lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getBalance(collection: Address, owner: Address): Promise<bigint>;

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
    getApproved(collection: Address, tokenId: bigint): Promise<TokenApproval>;

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
    isApprovedForAll(
        collection: Address,
        owner: Address,
        operator: Address,
    ): Promise<OperatorApproval>;

    /**
     * Reads token URI for one token.
     *
     * @param {Address} collection ERC721 collection address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenURI>} Token URI result with NFT context.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when token URI lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTokenURI(collection: Address, tokenId: bigint): Promise<TokenURI>;

    /**
     * Reads total collection supply (ERC721Enumerable).
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {Promise<bigint>} Total supply.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when total supply lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTotalSupply(collection: Address): Promise<bigint>;

    /**
     * Reads token ID by global enumerable index (ERC721Enumerable).
     *
     * @param {Address} collection ERC721 collection address.
     * @param {bigint} index Global token index.
     * @returns {Promise<bigint>} Token ID at the given index.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTokenByIndex(collection: Address, index: bigint): Promise<bigint>;

    /**
     * Reads token ID by owner-scoped enumerable index (ERC721Enumerable).
     *
     * @param {Address} collection ERC721 collection address.
     * @param {Address} owner Owner address.
     * @param {bigint} index Owner token index.
     * @returns {Promise<bigint>} Token ID at the owner index.
     * @throws {InvalidAddress} Thrown when `collection` or `owner` is invalid.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTokenOfOwnerByIndex(collection: Address, owner: Address, index: bigint): Promise<bigint>;

    // ---- Batch reads (multicall) ----

    /**
     * Reads owners for multiple tokens.
     *
     * @param {ReadonlyArray<OwnerQuery>} queries Owner queries.
     * @returns {Promise<BatchOwnerResult>} Batch owner response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getOwners(queries: ReadonlyArray<OwnerQuery>): Promise<BatchOwnerResult>;

    /**
     * Reads token URIs for multiple tokens.
     *
     * @param {ReadonlyArray<TokenURIQuery>} queries Token URI queries.
     * @returns {Promise<BatchTokenURIResult>} Batch token URI response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getTokenURIs(queries: ReadonlyArray<TokenURIQuery>): Promise<BatchTokenURIResult>;

    /**
     * Reads token-level approvals for multiple tokens.
     *
     * @param {ReadonlyArray<ApprovalQuery>} queries Approval queries.
     * @returns {Promise<BatchApprovalResult>} Batch approval response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getApprovals(queries: ReadonlyArray<ApprovalQuery>): Promise<BatchApprovalResult>;

    /**
     * Reads owner balances for multiple collection/owner pairs.
     *
     * @param {ReadonlyArray<BalanceQuery>} queries Balance queries.
     * @returns {Promise<BatchBalanceResult>} Batch balance response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getBalances(queries: ReadonlyArray<BalanceQuery>): Promise<BatchBalanceResult>;

    /**
     * Reads operator approvals for multiple collection/owner/operator tuples.
     *
     * @param {ReadonlyArray<OperatorApprovalQuery>} queries Operator approval queries.
     * @returns {Promise<BatchOperatorApprovalResult>} Batch operator approval response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getOperatorApprovals(
        queries: ReadonlyArray<OperatorApprovalQuery>,
    ): Promise<BatchOperatorApprovalResult>;

    /**
     * Reads ERC165 support for multiple collection/interface pairs.
     *
     * @param {ReadonlyArray<InterfaceSupportQuery>} queries Interface support queries.
     * @returns {Promise<BatchInterfaceSupportResult>} Batch interface support response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getInterfaceSupports(
        queries: ReadonlyArray<InterfaceSupportQuery>,
    ): Promise<BatchInterfaceSupportResult>;

    /**
     * Reads total supplies for multiple collections (ERC721Enumerable).
     *
     * @param {ReadonlyArray<TotalSupplyQuery>} queries Total supply queries.
     * @returns {Promise<BatchTotalSupplyResult>} Batch total supply response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {NotERC721Enumerable} Included as per-item failures for non-enumerable collections.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    getTotalSupplies(queries: ReadonlyArray<TotalSupplyQuery>): Promise<BatchTotalSupplyResult>;

    /**
     * Reads token-by-index for multiple collections (ERC721Enumerable).
     *
     * @param {ReadonlyArray<TokenByIndexQuery>} queries Token-by-index queries.
     * @returns {Promise<BatchTokenByIndexResult>} Batch token-by-index response.
     * @throws {InvalidAddress} Thrown when any query contains an invalid collection address.
     * @throws {NotERC721Enumerable} Included as per-item failures for non-enumerable collections.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    getTokenByIndexes(queries: ReadonlyArray<TokenByIndexQuery>): Promise<BatchTokenByIndexResult>;

    /**
     * Reads token-of-owner-by-index for multiple collections (ERC721Enumerable).
     *
     * @param {ReadonlyArray<TokenOfOwnerByIndexQuery>} queries Token-of-owner-by-index queries.
     * @returns {Promise<BatchTokenOfOwnerByIndexResult>} Batch token-of-owner-by-index response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {NotERC721Enumerable} Included as per-item failures for non-enumerable collections.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<TokenOfOwnerByIndexQuery>,
    ): Promise<BatchTokenOfOwnerByIndexResult>;

    // ---- Collection-bound reads ----

    /**
     * Creates a collection-bound reader facade.
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {IERC721CollectionReader} Collection-scoped reader.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     */
    forCollection(collection: Address): IERC721CollectionReader;
}

/**
 * Single-chain ERC721 write client.
 *
 * Extends IERC721Read. Adds full transaction lifecycle
 * for approvals and transfers.
 *
 * @example
 * ```ts
 * const write = createERC721WriteClient({ client: publicClient, walletClient });
 * const hash = await write.transferFrom(collection, from, to, tokenId);
 * ```
 */
export interface IERC721WriteClient extends IERC721Read {
    // ---- Prepare (simulate + gas estimate, no signing) ----

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
    prepareApprove(collection: Address, to: Address, tokenId: bigint): Promise<PreparedTransaction>;

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
    prepareSetApprovalForAll(
        collection: Address,
        operator: Address,
        approved: boolean,
    ): Promise<PreparedTransaction>;

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
    prepareTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
    ): Promise<PreparedTransaction>;

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
    prepareSafeTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
    ): Promise<PreparedTransaction>;

    // ---- Sign (returns signed bytes, no broadcast) ----

    /**
     * Signs a prepared transaction.
     *
     * @param {PreparedTransaction} prepared Prepared payload.
     * @returns {Promise<SignedTransaction>} Signed transaction payload.
     * @throws {ChainUtilsFault} Thrown for chain mismatches or missing wallet/account.
     * @throws {Error} Propagates signer failures.
     */
    signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction>;

    // ---- Send (broadcast signed tx) ----

    /**
     * Broadcasts a signed transaction.
     *
     * @param {SignedTransaction} signed Signed payload.
     * @returns {Promise<Hash>} Transaction hash.
     * @throws {ChainUtilsFault} Thrown when signed payload chain ID mismatches the client chain.
     * @throws {Error} Propagates broadcast failures.
     */
    sendTransaction(signed: SignedTransaction): Promise<Hash>;

    // ---- Wait (wait for tx to be mined) ----

    /**
     * Waits for transaction inclusion.
     *
     * @param {Hash} hash Transaction hash.
     * @returns {Promise<TransactionReceipt>} Final transaction receipt.
     * @throws {Error} Propagates receipt polling failures.
     */
    waitForReceipt(hash: Hash): Promise<TransactionReceipt>;

    // ---- Convenience methods (full pipeline) ----

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
    approve(
        collection: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

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
    setApprovalForAll(
        collection: Address,
        operator: Address,
        approved: boolean,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

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
    transferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

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
    safeTransferFrom(
        collection: Address,
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    /**
     * Creates a collection-bound writer facade.
     *
     * @param {Address} collection ERC721 collection address.
     * @returns {IERC721CollectionWriter} Collection-scoped writer.
     * @throws {InvalidAddress} Thrown when `collection` is invalid.
     */
    forCollection(collection: Address): IERC721CollectionWriter;
}

/**
 * Collection-bound ERC721 read interface.
 */
export interface IERC721CollectionReader {
    readonly collection: Address;
    readonly chainId: number;
    readonly supportsMulticall: boolean;
    readonly readClient: IERC721Read;

    /**
     * Checks ERC165 interface support for the bound collection.
     *
     * @param {Hex} interfaceId ERC165 interface identifier (`bytes4`).
     * @returns {Promise<boolean>} `true` when interface is supported.
     * @throws {ContractReverted} Thrown when the interface lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    supportsInterface(interfaceId: Hex): Promise<boolean>;

    /**
     * Reads metadata for the bound collection.
     *
     * @returns {Promise<CollectionMetadata>} Collection metadata.
     * @throws {ContractReverted} Thrown when metadata lookups revert.
     * @throws {Error} Propagates RPC/read failures.
     */
    getCollectionMetadata(): Promise<CollectionMetadata>;

    /**
     * Reads owner of a token in the bound collection.
     *
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenOwner>} Owner result.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when owner lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getOwnerOf(tokenId: bigint): Promise<TokenOwner>;

    /**
     * Reads owner balance in the bound collection.
     *
     * @param {Address} owner Owner address.
     * @returns {Promise<bigint>} Owner token balance.
     * @throws {InvalidAddress} Thrown when `owner` is invalid.
     * @throws {InvalidOwner} Thrown when owner is invalid and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when balance lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getBalance(owner: Address): Promise<bigint>;

    /**
     * Reads token-level approval in the bound collection.
     *
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenApproval>} Approval result.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when approval lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getApproved(tokenId: bigint): Promise<TokenApproval>;

    /**
     * Reads operator approval in the bound collection.
     *
     * @param {Address} owner Owner address.
     * @param {Address} operator Operator address.
     * @returns {Promise<OperatorApproval>} Operator approval result.
     * @throws {InvalidAddress} Thrown when `owner` or `operator` is invalid.
     * @throws {ContractReverted} Thrown when approval lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    isApprovedForAll(owner: Address, operator: Address): Promise<OperatorApproval>;

    /**
     * Reads token URI in the bound collection.
     *
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<TokenURI>} Token URI result.
     * @throws {NonexistentToken} Thrown when token does not exist and decoder recognizes the revert.
     * @throws {ContractReverted} Thrown when token URI lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTokenURI(tokenId: bigint): Promise<TokenURI>;

    /**
     * Reads total supply for the bound collection.
     *
     * @returns {Promise<bigint>} Total supply.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when total supply lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTotalSupply(): Promise<bigint>;

    /**
     * Reads token ID by global index for the bound collection.
     *
     * @param {bigint} index Global token index.
     * @returns {Promise<bigint>} Token ID.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTokenByIndex(index: bigint): Promise<bigint>;

    /**
     * Reads token ID by owner index for the bound collection.
     *
     * @param {Address} owner Owner address.
     * @param {bigint} index Owner token index.
     * @returns {Promise<bigint>} Token ID.
     * @throws {InvalidAddress} Thrown when `owner` is invalid.
     * @throws {NotERC721Enumerable} Thrown when collection does not support ERC721Enumerable.
     * @throws {ContractReverted} Thrown when lookup reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    getTokenOfOwnerByIndex(owner: Address, index: bigint): Promise<bigint>;

    /**
     * Reads owners for multiple token IDs in the bound collection.
     *
     * @param {ReadonlyArray<bigint>} tokenIds Token IDs.
     * @returns {Promise<BatchOwnerResult>} Batch owner response.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getOwners(tokenIds: ReadonlyArray<bigint>): Promise<BatchOwnerResult>;

    /**
     * Reads token URIs for multiple token IDs in the bound collection.
     *
     * @param {ReadonlyArray<bigint>} tokenIds Token IDs.
     * @returns {Promise<BatchTokenURIResult>} Batch token URI response.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getTokenURIs(tokenIds: ReadonlyArray<bigint>): Promise<BatchTokenURIResult>;

    /**
     * Reads token approvals for multiple token IDs in the bound collection.
     *
     * @param {ReadonlyArray<bigint>} tokenIds Token IDs.
     * @returns {Promise<BatchApprovalResult>} Batch approval response.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getApprovals(tokenIds: ReadonlyArray<bigint>): Promise<BatchApprovalResult>;

    /**
     * Reads balances for multiple owners in the bound collection.
     *
     * @param {ReadonlyArray<Address>} owners Owner addresses.
     * @returns {Promise<BatchBalanceResult>} Batch balance response.
     * @throws {InvalidAddress} Thrown when any `owners` entry is invalid.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getBalances(owners: ReadonlyArray<Address>): Promise<BatchBalanceResult>;

    /**
     * Reads operator approvals for owner/operator pairs in the bound collection.
     *
     * @param {ReadonlyArray<CollectionOperatorApprovalQuery>} queries Collection-scoped operator approval queries.
     * @returns {Promise<BatchOperatorApprovalResult>} Batch operator approval response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getOperatorApprovals(
        queries: ReadonlyArray<CollectionOperatorApprovalQuery>,
    ): Promise<BatchOperatorApprovalResult>;

    /**
     * Reads ERC165 support for multiple interface IDs in the bound collection.
     *
     * @param {ReadonlyArray<Hex>} interfaceIds ERC165 interface IDs.
     * @returns {Promise<BatchInterfaceSupportResult>} Batch interface support response.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getInterfaceSupports(interfaceIds: ReadonlyArray<Hex>): Promise<BatchInterfaceSupportResult>;

    /**
     * Reads total supply for the bound collection as a batch.
     *
     * @returns {Promise<BatchTotalSupplyResult>} Batch total supply response.
     * @throws {NotERC721Enumerable} Included as per-item failures for non-enumerable collections.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    getTotalSupplies(): Promise<BatchTotalSupplyResult>;

    /**
     * Reads token IDs by index for the bound collection as a batch.
     *
     * @param {ReadonlyArray<bigint>} indexes Global token indexes.
     * @returns {Promise<BatchTokenByIndexResult>} Batch token-by-index response.
     * @throws {NotERC721Enumerable} Included as per-item failures for non-enumerable collections.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    getTokenByIndexes(indexes: ReadonlyArray<bigint>): Promise<BatchTokenByIndexResult>;

    /**
     * Reads token IDs by owner index for the bound collection as a batch.
     *
     * @param {ReadonlyArray<CollectionTokenOfOwnerByIndexQuery>} queries Owner/index queries.
     * @returns {Promise<BatchTokenOfOwnerByIndexResult>} Batch token-of-owner-by-index response.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {NotERC721Enumerable} Included as per-item failures for non-enumerable collections.
     * @throws {MulticallBatchFailure} Thrown when the multicall request for enumerable collections fails as a whole.
     */
    getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<CollectionTokenOfOwnerByIndexQuery>,
    ): Promise<BatchTokenOfOwnerByIndexResult>;
}

/**
 * Collection-bound ERC721 write interface.
 */
export interface IERC721CollectionWriter extends IERC721CollectionReader {
    readonly writeClient: IERC721WriteClient;

    /**
     * Prepares `approve` for the bound collection.
     *
     * @param {Address} to Approved address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
    prepareApprove(to: Address, tokenId: bigint): Promise<PreparedTransaction>;

    /**
     * Prepares `setApprovalForAll` for the bound collection.
     *
     * @param {Address} operator Operator address.
     * @param {boolean} approved Approval value.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `operator` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
    prepareSetApprovalForAll(operator: Address, approved: boolean): Promise<PreparedTransaction>;

    /**
     * Prepares `transferFrom` for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `from` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
    prepareTransferFrom(from: Address, to: Address, tokenId: bigint): Promise<PreparedTransaction>;

    /**
     * Prepares `safeTransferFrom` for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {Hex} [data] Optional transfer data payload.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `from` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation/RPC failures.
     */
    prepareSafeTransferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
        data?: Hex,
    ): Promise<PreparedTransaction>;

    /**
     * Signs a prepared transaction.
     *
     * @param {PreparedTransaction} prepared Prepared payload.
     * @returns {Promise<SignedTransaction>} Signed transaction payload.
     * @throws {ChainUtilsFault} Thrown for chain mismatches or missing wallet/account.
     * @throws {Error} Propagates signer failures.
     */
    signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction>;

    /**
     * Broadcasts a signed transaction.
     *
     * @param {SignedTransaction} signed Signed payload.
     * @returns {Promise<Hash>} Transaction hash.
     * @throws {ChainUtilsFault} Thrown when signed payload chain ID mismatches the client chain.
     * @throws {Error} Propagates broadcast failures.
     */
    sendTransaction(signed: SignedTransaction): Promise<Hash>;

    /**
     * Waits for transaction inclusion.
     *
     * @param {Hash} hash Transaction hash.
     * @returns {Promise<TransactionReceipt>} Final transaction receipt.
     * @throws {Error} Propagates receipt polling failures.
     */
    waitForReceipt(hash: Hash): Promise<TransactionReceipt>;

    /**
     * Executes `approve` for the bound collection.
     *
     * @param {Address} to Approved address.
     * @param {bigint} tokenId Token ID.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
    approve(
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    /**
     * Executes `setApprovalForAll` for the bound collection.
     *
     * @param {Address} operator Operator address.
     * @param {boolean} approved Approval value.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `operator` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
    setApprovalForAll(
        operator: Address,
        approved: boolean,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    /**
     * Executes `transferFrom` for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `from` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
    transferFrom(
        from: Address,
        to: Address,
        tokenId: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    /**
     * Executes `safeTransferFrom` for the bound collection.
     *
     * @param {Address} from Sender address.
     * @param {Address} to Recipient address.
     * @param {bigint} tokenId Token ID.
     * @param {Hex} [data] Optional transfer data payload.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `from` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
    safeTransferFrom(
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
 *
 * @template TChainId Literal union of configured chain IDs.
 */
export interface IERC721MultichainClient<TChainId extends number> {
    /** The underlying generic multichain contract. */
    readonly multichain: MultichainContract<ERC721Abi, TChainId>;

    /** All configured chain IDs. */
    readonly chainIds: ReadonlyArray<TChainId>;

    /**
     * Returns the read client for a chain.
     *
     * @param {TChainId} chainId Chain ID to resolve.
     * @returns {IERC721Read} Chain-scoped ERC721 read client.
     * @throws {UnsupportedChain} Thrown when `chainId` is not configured.
     */
    getClient(chainId: TChainId): IERC721Read;

    /**
     * Checks whether a chain is configured.
     *
     * @param {number} chainId Chain ID to test.
     * @returns {boolean} `true` when chain exists in this client.
     * @throws {Error} Thrown on unexpected runtime failures.
     */
    hasChain(chainId: number): boolean;

    // ---- Cross-chain reads ----

    /**
     * Reads owners across chains.
     *
     * @param {ReadonlyArray<OwnerQuery & { chainId: TChainId }>} queries Owner queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchOwnerResult>>} Per-chain owner batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getOwners(
        queries: ReadonlyArray<OwnerQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchOwnerResult>>;

    /**
     * Reads token URIs across chains.
     *
     * @param {ReadonlyArray<TokenURIQuery & { chainId: TChainId }>} queries Token URI queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchTokenURIResult>>} Per-chain token URI batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getTokenURIs(
        queries: ReadonlyArray<TokenURIQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTokenURIResult>>;

    /**
     * Reads approvals across chains.
     *
     * @param {ReadonlyArray<ApprovalQuery & { chainId: TChainId }>} queries Approval queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchApprovalResult>>} Per-chain approval batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getApprovals(
        queries: ReadonlyArray<ApprovalQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchApprovalResult>>;

    /**
     * Reads balances across chains.
     *
     * @param {ReadonlyArray<BalanceQuery & { chainId: TChainId }>} queries Balance queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchBalanceResult>>} Per-chain balance batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getBalances(
        queries: ReadonlyArray<BalanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    /**
     * Reads operator approvals across chains.
     *
     * @param {ReadonlyArray<OperatorApprovalQuery & { chainId: TChainId }>} queries Operator approval queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchOperatorApprovalResult>>} Per-chain operator approval batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getOperatorApprovals(
        queries: ReadonlyArray<OperatorApprovalQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchOperatorApprovalResult>>;

    /**
     * Reads ERC165 support across chains.
     *
     * @param {ReadonlyArray<InterfaceSupportQuery & { chainId: TChainId }>} queries Interface support queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchInterfaceSupportResult>>} Per-chain interface support batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getInterfaceSupports(
        queries: ReadonlyArray<InterfaceSupportQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchInterfaceSupportResult>>;

    /**
     * Reads total supplies across chains.
     *
     * @param {ReadonlyArray<TotalSupplyQuery & { chainId: TChainId }>} queries Total supply queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchTotalSupplyResult>>} Per-chain total supply batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getTotalSupplies(
        queries: ReadonlyArray<TotalSupplyQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTotalSupplyResult>>;

    /**
     * Reads token-by-index values across chains.
     *
     * @param {ReadonlyArray<TokenByIndexQuery & { chainId: TChainId }>} queries Token-by-index queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchTokenByIndexResult>>} Per-chain token-by-index batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getTokenByIndexes(
        queries: ReadonlyArray<TokenByIndexQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTokenByIndexResult>>;

    /**
     * Reads token-of-owner-by-index values across chains.
     *
     * @param {ReadonlyArray<TokenOfOwnerByIndexQuery & { chainId: TChainId }>} queries Token-of-owner-by-index queries with chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchTokenOfOwnerByIndexResult>>} Per-chain token-of-owner-by-index batch results.
     * @throws {Error} Thrown only on unexpected orchestration failures.
     */
    getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<TokenOfOwnerByIndexQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchTokenOfOwnerByIndexResult>>;
}
