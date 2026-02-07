/**
 * Discriminated union for a single result within a multicall batch.
 * Mirrors viem's MulticallResponse pattern.
 */
export type MulticallItemResult<T> =
    | { readonly status: "success"; readonly result: T }
    | { readonly status: "failure"; readonly error: Error };

/**
 * Results of a batch operation on a single chain.
 */
export interface BatchResult<T> {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<T>>;
}

/**
 * Aggregated result from a cross-chain batch operation.
 */
export interface CrossChainBatchResult<T> {
    readonly resultsByChain: ReadonlyMap<number, T>;
    readonly failedChains: ReadonlyArray<{
        readonly chainId: number;
        readonly error: Error;
    }>;
}
