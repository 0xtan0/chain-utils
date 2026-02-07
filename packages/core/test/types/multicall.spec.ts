import type { BatchResult, CrossChainBatchResult, MulticallItemResult } from "@/types/multicall.js";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("MulticallItemResult", () => {
    it("should narrow on success status", () => {
        const result: MulticallItemResult<bigint> = {
            status: "success",
            result: 100n,
        };

        if (result.status === "success") {
            expect(result.result).toBe(100n);
            expectTypeOf(result.result).toEqualTypeOf<bigint>();
        }
    });

    it("should narrow on failure status", () => {
        const error = new Error("call failed");
        const result: MulticallItemResult<bigint> = {
            status: "failure",
            error,
        };

        if (result.status === "failure") {
            expect(result.error.message).toBe("call failed");
            expectTypeOf(result.error).toEqualTypeOf<Error>();
        }
    });

    it("should work with different generic types", () => {
        const stringResult: MulticallItemResult<string> = {
            status: "success",
            result: "hello",
        };

        if (stringResult.status === "success") {
            expectTypeOf(stringResult.result).toBeString();
        }
    });
});

describe("BatchResult", () => {
    it("should have chainId and results array", () => {
        const batch: BatchResult<bigint> = {
            chainId: 1,
            results: [
                { status: "success", result: 100n },
                { status: "failure", error: new Error("failed") },
            ],
        };

        expect(batch.chainId).toBe(1);
        expect(batch.results).toHaveLength(2);
    });

    it("should use ReadonlyArray for results", () => {
        const batch: BatchResult<string> = {
            chainId: 10,
            results: [],
        };

        expectTypeOf(batch.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<string>>>();
    });
});

describe("CrossChainBatchResult", () => {
    it("should have resultsByChain as ReadonlyMap", () => {
        const result: CrossChainBatchResult<bigint> = {
            resultsByChain: new Map([
                [1, 100n],
                [10, 200n],
            ]),
            failedChains: [],
        };

        expect(result.resultsByChain.get(1)).toBe(100n);
        expect(result.resultsByChain.get(10)).toBe(200n);
        expectTypeOf(result.resultsByChain).toEqualTypeOf<ReadonlyMap<number, bigint>>();
    });

    it("should track failed chains", () => {
        const result: CrossChainBatchResult<bigint> = {
            resultsByChain: new Map([[1, 100n]]),
            failedChains: [{ chainId: 10, error: new Error("rpc down") }],
        };

        expect(result.failedChains).toHaveLength(1);
        expect(result.failedChains[0]?.chainId).toBe(10);
    });
});
