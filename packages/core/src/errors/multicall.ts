import type { MulticallItemResult } from "../types/multicall.js";
import { ChainUtilsFault } from "./base.js";

export class MulticallPartialFailure extends ChainUtilsFault {
    override readonly name = "MulticallPartialFailure";
    readonly chainId: number;
    readonly results: ReadonlyArray<MulticallItemResult<unknown>>;
    readonly failedCount: number;
    readonly totalCount: number;

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

export class MulticallBatchFailure extends ChainUtilsFault {
    override readonly name = "MulticallBatchFailure";
    readonly chainId: number;
    readonly batchSize: number;

    constructor(chainId: number, batchSize: number, options?: { cause?: Error }) {
        super(`Multicall batch of ${batchSize} calls failed on chain ${chainId}`, {
            cause: options?.cause,
            metaMessages: [`Chain ID: ${chainId}`, `Batch size: ${batchSize}`],
        });

        this.chainId = chainId;
        this.batchSize = batchSize;
    }
}
