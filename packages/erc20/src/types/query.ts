import type { MulticallItemResult } from "@0xtan0/chain-utils/core";
import type { Address } from "viem";

/** A single balance query in a multicall batch. */
export interface BalanceQuery {
    readonly token: Address;
    readonly holder: Address;
}

/** A single allowance query in a multicall batch. */
export interface AllowanceQuery {
    readonly token: Address;
    readonly owner: Address;
    readonly spender: Address;
}

/** Typed batch balance result. */
export interface BatchBalanceResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<BalanceQuery>;
}

/** Typed batch allowance result. */
export interface BatchAllowanceResult {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<bigint>>;
    readonly queries: ReadonlyArray<AllowanceQuery>;
}
