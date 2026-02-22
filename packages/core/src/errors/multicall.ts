import type { MulticallItemResult } from "../types/multicall.js";
import { ChainUtilsFault } from "./base.js";

/**
 * Error representing a multicall batch where one or more individual calls failed.
 */
export class MulticallPartialFailure extends ChainUtilsFault {
    override readonly name = "MulticallPartialFailure";
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<unknown>>;
    readonly failedCount: number;
    readonly totalCount: number;

    /**
     * @param {number} chainId Chain identifier where the batch ran.
     * @param {ReadonlyArray<MulticallItemResult<unknown>>} results Per-call multicall outcomes.
     * @returns {MulticallPartialFailure} A partial multicall failure summary.
     */
    constructor(chainId: number, results: ReadonlyArray<MulticallItemResult<unknown>>) {
        const totalCount = results.length;
        const failedCount = results.filter((r) => r.status === "failure").length;

        super(`Multicall on chain ${chainId} had ${failedCount}/${totalCount} failures`, {
            metaMessages: [`Chain ID: ${chainId}`, `Failed: ${failedCount}/${totalCount}`],
        });

        this.chainId = chainId;
        this.results = results;
        this.failedCount = failedCount;
        this.totalCount = totalCount;
    }
}

/**
 * Error thrown when the full multicall RPC request fails before per-call results are produced.
 */
export class MulticallBatchFailure extends ChainUtilsFault {
    override readonly name = "MulticallBatchFailure";
    readonly chainId: number;
    readonly batchSize: number;

    /**
     * @param {number} chainId Chain identifier where batch execution failed.
     * @param {number} batchSize Number of calls attempted in the batch.
     * @param {{ cause?: Error }} [options] Optional underlying RPC or transport error.
     * @returns {MulticallBatchFailure} A structured whole-batch multicall failure.
     */
    constructor(chainId: number, batchSize: number, options?: { cause?: Error }) {
        super(`Multicall batch of ${batchSize} calls failed on chain ${chainId}`, {
            cause: options?.cause,
            metaMessages: [`Chain ID: ${chainId}`, `Batch size: ${batchSize}`],
        });

        this.chainId = chainId;
        this.batchSize = batchSize;
    }
}
