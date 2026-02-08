import type { MulticallItemResult } from "@/types/multicall.js";
import { ChainUtilsFault } from "@/errors/base.js";
import { MulticallBatchFailure, MulticallPartialFailure } from "@/errors/multicall.js";
import { describe, expect, it } from "vitest";

describe("MulticallPartialFailure", () => {
    const mixedResults: ReadonlyArray<MulticallItemResult<unknown>> = [
        { status: "success", result: 100n },
        { status: "failure", error: new Error("revert") },
        { status: "success", result: 200n },
        { status: "failure", error: new Error("out of gas") },
    ];

    it("should create with chainId and results", () => {
        const error = new MulticallPartialFailure(1, mixedResults);

        expect(error.chainId).toBe(1);
        expect(error.results).toBe(mixedResults);
        expect(error.name).toBe("MulticallPartialFailure");
    });

    it("should compute failedCount and totalCount from results", () => {
        const error = new MulticallPartialFailure(1, mixedResults);

        expect(error.failedCount).toBe(2);
        expect(error.totalCount).toBe(4);
    });

    it("should include counts in the message", () => {
        const error = new MulticallPartialFailure(42161, mixedResults);

        expect(error.shortMessage).toBe("Multicall on chain 42161 had 2/4 failures");
        expect(error.message).toContain("Chain ID: 42161");
        expect(error.message).toContain("Failed: 2/4");
    });

    it("should handle all-failure results", () => {
        const allFailed: ReadonlyArray<MulticallItemResult<unknown>> = [
            { status: "failure", error: new Error("a") },
            { status: "failure", error: new Error("b") },
        ];
        const error = new MulticallPartialFailure(10, allFailed);

        expect(error.failedCount).toBe(2);
        expect(error.totalCount).toBe(2);
    });

    it("should handle single-failure results", () => {
        const singleFail: ReadonlyArray<MulticallItemResult<unknown>> = [
            { status: "success", result: 1n },
            { status: "failure", error: new Error("x") },
            { status: "success", result: 2n },
        ];
        const error = new MulticallPartialFailure(1, singleFail);

        expect(error.failedCount).toBe(1);
        expect(error.totalCount).toBe(3);
    });

    it("should extend ChainUtilsFault", () => {
        const error = new MulticallPartialFailure(1, mixedResults);

        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("should be walkable from a parent ChainUtilsFault", () => {
        const cause = new MulticallPartialFailure(1, mixedResults);
        const parent = new ChainUtilsFault("wrapped", { cause });

        const found = parent.walk((err) => err instanceof MulticallPartialFailure);
        expect(found).toBe(cause);
    });
});

describe("MulticallBatchFailure", () => {
    it("should create with chainId and batchSize", () => {
        const error = new MulticallBatchFailure(1, 10);

        expect(error.chainId).toBe(1);
        expect(error.batchSize).toBe(10);
        expect(error.name).toBe("MulticallBatchFailure");
    });

    it("should include chain and batch info in message", () => {
        const error = new MulticallBatchFailure(42161, 5);

        expect(error.shortMessage).toBe("Multicall batch of 5 calls failed on chain 42161");
        expect(error.message).toContain("Chain ID: 42161");
        expect(error.message).toContain("Batch size: 5");
    });

    it("should store the original cause", () => {
        const cause = new Error("execution reverted");
        const error = new MulticallBatchFailure(1, 10, { cause });

        expect(error.cause).toBe(cause);
    });

    it("should work without cause", () => {
        const error = new MulticallBatchFailure(1, 10);

        expect(error.cause).toBeUndefined();
    });

    it("should extend ChainUtilsFault", () => {
        const error = new MulticallBatchFailure(1, 10);

        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("should be walkable from a parent ChainUtilsFault", () => {
        const cause = new MulticallBatchFailure(1, 10);
        const parent = new ChainUtilsFault("wrapped", { cause });

        const found = parent.walk((err) => err instanceof MulticallBatchFailure);
        expect(found).toBe(cause);
    });
});
