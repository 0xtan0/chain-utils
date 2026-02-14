import type { MulticallItemResult } from "@0xtan0/chain-utils/core";
import type { Address, Hex } from "viem";

import type { TokenURIResult } from "./token.js";

/** A single owner query in a batch. */
export interface OwnerQuery {
    readonly collection: Address;
    readonly tokenId: bigint;
}

/** A single token URI query in a batch. */
export interface TokenURIQuery {
    readonly collection: Address;
    readonly tokenId: bigint;
}

/** A single approval query in a batch. */
export interface ApprovalQuery {
    readonly collection: Address;
    readonly tokenId: bigint;
}

/** A single balance query in a batch. */
export interface BalanceQuery {
    readonly collection: Address;
    readonly owner: Address;
}

/** A single operator approval query in a batch. */
export interface OperatorApprovalQuery {
    readonly collection: Address;
    readonly owner: Address;
    readonly operator: Address;
}

/** A single ERC165 interface support query in a batch. */
export interface InterfaceSupportQuery {
    readonly collection: Address;
    readonly interfaceId: Hex;
}

/** A single total supply query in a batch. */
export interface TotalSupplyQuery {
    readonly collection: Address;
}

/** A single tokenByIndex query in a batch. */
export interface TokenByIndexQuery {
    readonly collection: Address;
    readonly index: bigint;
}

/** A single tokenOfOwnerByIndex query in a batch. */
export interface TokenOfOwnerByIndexQuery {
    readonly collection: Address;
    readonly owner: Address;
    readonly index: bigint;
}

/** A failed query paired with its error. */
export interface BatchFailure<TQuery> {
    readonly query: TQuery;
    readonly error: Error;
}

/** Typed batch owner result. */
export interface BatchOwnerResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<Address>>;
    readonly queries: ReadonlyArray<OwnerQuery>;
    readonly failures: ReadonlyArray<BatchFailure<OwnerQuery>>;
}

/** Typed batch token URI result. */
export interface BatchTokenURIResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<TokenURIResult>;
    readonly queries: ReadonlyArray<TokenURIQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TokenURIQuery>>;
}

/** Typed batch approval result. */
export interface BatchApprovalResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<Address>>;
    readonly queries: ReadonlyArray<ApprovalQuery>;
    readonly failures: ReadonlyArray<BatchFailure<ApprovalQuery>>;
}

/** Typed batch balance result. */
export interface BatchBalanceResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<BalanceQuery>;
    readonly failures: ReadonlyArray<BatchFailure<BalanceQuery>>;
}

/** Typed batch operator approval result. */
export interface BatchOperatorApprovalResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<boolean>>;
    readonly queries: ReadonlyArray<OperatorApprovalQuery>;
    readonly failures: ReadonlyArray<BatchFailure<OperatorApprovalQuery>>;
}

/** Typed batch interface support result. */
export interface BatchInterfaceSupportResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<boolean>>;
    readonly queries: ReadonlyArray<InterfaceSupportQuery>;
    readonly failures: ReadonlyArray<BatchFailure<InterfaceSupportQuery>>;
}

/** Typed batch total supply result. */
export interface BatchTotalSupplyResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<TotalSupplyQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TotalSupplyQuery>>;
}

/** Typed batch tokenByIndex result. */
export interface BatchTokenByIndexResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<TokenByIndexQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TokenByIndexQuery>>;
}

/** Typed batch tokenOfOwnerByIndex result. */
export interface BatchTokenOfOwnerByIndexResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<TokenOfOwnerByIndexQuery>;
    readonly failures: ReadonlyArray<BatchFailure<TokenOfOwnerByIndexQuery>>;
}
