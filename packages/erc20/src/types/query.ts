import type { MulticallItemResult } from "@0xtan0/chain-utils/core";
import type { Address } from "viem";

/**
 * One balance query.
 *
 * @property {Address} token ERC20 token address.
 * @property {Address} holder Address whose balance should be read.
 */
export interface BalanceQuery {
    readonly token: Address;
    readonly holder: Address;
}

/**
 * One allowance query.
 *
 * @property {Address} token ERC20 token address.
 * @property {Address} owner Token owner address.
 * @property {Address} spender Address approved to spend.
 */
export interface AllowanceQuery {
    readonly token: Address;
    readonly owner: Address;
    readonly spender: Address;
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
 * Batch balance response for one chain.
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
 * Batch allowance response for one chain.
 *
 * @property {number} chainId Chain where the batch was executed.
 * @property {ReadonlyArray<MulticallItemResult<bigint>>} results Per-query raw results.
 * @property {ReadonlyArray<AllowanceQuery>} queries Input queries in execution order.
 * @property {ReadonlyArray<BatchFailure<AllowanceQuery>>} failures Failed query entries.
 */
export interface BatchAllowanceResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<AllowanceQuery>;
    readonly failures: ReadonlyArray<BatchFailure<AllowanceQuery>>;
}
