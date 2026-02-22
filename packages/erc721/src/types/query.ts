import type { MulticallItemResult } from "@0xtan0/chain-utils/core";
import type { Address, Hex } from "viem";

import type { TokenURIResult } from "./token.js";

/**
 * Owner lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {bigint} tokenId Token ID to resolve owner for.
 */
export interface OwnerQuery {
    readonly collection: Address;
    readonly tokenId: bigint;
}

/**
 * Token URI lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {bigint} tokenId Token ID to resolve URI for.
 */
export interface TokenURIQuery {
    readonly collection: Address;
    readonly tokenId: bigint;
}

/**
 * Token approval lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {bigint} tokenId Token ID to resolve approval for.
 */
export interface ApprovalQuery {
    readonly collection: Address;
    readonly tokenId: bigint;
}

/**
 * Collection balance query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {Address} owner Owner address to resolve balance for.
 */
export interface BalanceQuery {
    readonly collection: Address;
    readonly owner: Address;
}

/**
 * Operator approval lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {Address} owner Owner address.
 * @property {Address} operator Operator address.
 */
export interface OperatorApprovalQuery {
    readonly collection: Address;
    readonly owner: Address;
    readonly operator: Address;
}

/**
 * ERC165 support lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {Hex} interfaceId ERC165 interface identifier (`bytes4`).
 */
export interface InterfaceSupportQuery {
    readonly collection: Address;
    readonly interfaceId: Hex;
}

/**
 * Total supply lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 */
export interface TotalSupplyQuery {
    readonly collection: Address;
}

/**
 * Enumerable token-by-index lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {bigint} index Global token index.
 */
export interface TokenByIndexQuery {
    readonly collection: Address;
    readonly index: bigint;
}

/**
 * Enumerable token-of-owner-by-index lookup query.
 *
 * @property {Address} collection ERC721 collection address.
 * @property {Address} owner Owner address.
 * @property {bigint} index Owner-scoped token index.
 */
export interface TokenOfOwnerByIndexQuery {
    readonly collection: Address;
    readonly owner: Address;
    readonly index: bigint;
}

/**
 * Failed query item with its error.
 *
 * @template TQuery Query payload type.
 * @property {TQuery} query Query input that failed.
 * @property {Error} error Failure returned for the query.
 */
export interface BatchFailure<TQuery> {
    readonly query: TQuery;
    readonly error: Error;
}

/**
 * Batch owner response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<Address>>} results Per-query raw results.
 * @property {ReadonlyArray<OwnerQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<OwnerQuery>>} failures Failed query entries.
 */
export interface BatchOwnerResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<Address>>;
    readonly queries: ReadonlyArray<OwnerQuery>;
    readonly failures: ReadonlyArray<BatchFailure<OwnerQuery>>;
}

/**
 * Batch token URI response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<TokenURIResult>} results Per-query token URI results.
 * @property {ReadonlyArray<TokenURIQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<TokenURIQuery>>} failures Failed query entries.
 */
export interface BatchTokenURIResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<TokenURIResult>;
    readonly queries: ReadonlyArray<TokenURIQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TokenURIQuery>>;
}

/**
 * Batch token approval response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<Address>>} results Per-query raw results.
 * @property {ReadonlyArray<ApprovalQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<ApprovalQuery>>} failures Failed query entries.
 */
export interface BatchApprovalResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<Address>>;
    readonly queries: ReadonlyArray<ApprovalQuery>;
    readonly failures: ReadonlyArray<BatchFailure<ApprovalQuery>>;
}

/**
 * Batch owner-balance response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<bigint>>} results Per-query raw results.
 * @property {ReadonlyArray<BalanceQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<BalanceQuery>>} failures Failed query entries.
 */
export interface BatchBalanceResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<BalanceQuery>;
    readonly failures: ReadonlyArray<BatchFailure<BalanceQuery>>;
}

/**
 * Batch operator-approval response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<boolean>>} results Per-query raw results.
 * @property {ReadonlyArray<OperatorApprovalQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<OperatorApprovalQuery>>} failures Failed query entries.
 */
export interface BatchOperatorApprovalResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<boolean>>;
    readonly queries: ReadonlyArray<OperatorApprovalQuery>;
    readonly failures: ReadonlyArray<BatchFailure<OperatorApprovalQuery>>;
}

/**
 * Batch ERC165 support response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<boolean>>} results Per-query raw results.
 * @property {ReadonlyArray<InterfaceSupportQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<InterfaceSupportQuery>>} failures Failed query entries.
 */
export interface BatchInterfaceSupportResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<boolean>>;
    readonly queries: ReadonlyArray<InterfaceSupportQuery>;
    readonly failures: ReadonlyArray<BatchFailure<InterfaceSupportQuery>>;
}

/**
 * Batch total-supply response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<bigint>>} results Per-query raw results.
 * @property {ReadonlyArray<TotalSupplyQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<TotalSupplyQuery>>} failures Failed query entries.
 */
export interface BatchTotalSupplyResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<TotalSupplyQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TotalSupplyQuery>>;
}

/**
 * Batch token-by-index response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<bigint>>} results Per-query raw results.
 * @property {ReadonlyArray<TokenByIndexQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<TokenByIndexQuery>>} failures Failed query entries.
 */
export interface BatchTokenByIndexResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<TokenByIndexQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TokenByIndexQuery>>;
}

/**
 * Batch token-of-owner-by-index response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<bigint>>} results Per-query raw results.
 * @property {ReadonlyArray<TokenOfOwnerByIndexQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<TokenOfOwnerByIndexQuery>>} failures Failed query entries.
 */
export interface BatchTokenOfOwnerByIndexResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<TokenOfOwnerByIndexQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TokenOfOwnerByIndexQuery>>;
}
