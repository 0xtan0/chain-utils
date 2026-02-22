/**
 * Result for one call in a read batch.
 *
 * On success, `result` contains the decoded return value.
 * On failure, `error` contains the per-call failure.
 */
export type MulticallItemResult<T> =
    | { readonly status: "success"; readonly result: T }
    | { readonly status: "failure"; readonly error: Error };

/**
 * Result container for batched reads executed on one chain.
 *
 * @property {number} chainId Chain where the calls were executed.
 * @property {ReadonlyArray<MulticallItemResult<T>>} results Per-call success or failure outcomes.
 */
export interface BatchResult<T> {
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<T>>;
}

/**
 * Aggregated output for reads executed across multiple chains.
 *
 * @property {ReadonlyMap<number, T>} resultsByChain Successful results keyed by chain ID.
 * @property {ReadonlyArray<{ chainId: number; error: Error }>} failedChains Chains that failed with their error.
 */
export interface CrossChainBatchResult<T> {
    readonly resultsByChain: ReadonlyMap<number, T>;
    readonly failedChains: ReadonlyArray<{
        readonly chainId: number;
        readonly error: Error;
    }>;
}
