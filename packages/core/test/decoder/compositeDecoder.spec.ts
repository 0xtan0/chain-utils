import type { ErrorDecoder } from "@/decoder/errorDecoder.js";
import type { Hex } from "viem";
import { CompositeErrorDecoder } from "@/decoder/compositeDecoder.js";
import { ChainUtilsFault } from "@/errors/base.js";
import { ContractReverted } from "@/errors/revert.js";
import { describe, expect, it } from "vitest";

function mockDecoder(fn: (rawData: Hex) => ChainUtilsFault | null): ErrorDecoder {
    return { decode: fn };
}

describe("CompositeErrorDecoder", () => {
    const rawData: Hex = "0x08c379a0";

    it("should return result from a single matching decoder", () => {
        const expected = new ContractReverted({ decodedMessage: "matched" });
        const decoder = new CompositeErrorDecoder([mockDecoder(() => expected)]);

        const result = decoder.decode(rawData);

        expect(result).toBe(expected);
    });

    it("should return the first non-null result (first-match-wins)", () => {
        const first = new ContractReverted({ decodedMessage: "first" });
        const second = new ContractReverted({ decodedMessage: "second" });

        const decoder = new CompositeErrorDecoder([
            mockDecoder(() => first),
            mockDecoder(() => second),
        ]);

        const result = decoder.decode(rawData);

        expect(result).toBe(first);
    });

    it("should skip decoders that return null", () => {
        const expected = new ContractReverted({ decodedMessage: "third" });

        const decoder = new CompositeErrorDecoder([
            mockDecoder(() => null),
            mockDecoder(() => null),
            mockDecoder(() => expected),
        ]);

        const result = decoder.decode(rawData);

        expect(result).toBe(expected);
    });

    it("should fall back to ContractReverted when all decoders return null", () => {
        const decoder = new CompositeErrorDecoder([
            mockDecoder(() => null),
            mockDecoder(() => null),
        ]);

        const result = decoder.decode(rawData);

        expect(result).toBeInstanceOf(ContractReverted);
        expect((result as ContractReverted).rawData).toBe(rawData);
    });

    it("should fall back to ContractReverted with empty decoder list", () => {
        const decoder = new CompositeErrorDecoder([]);

        const result = decoder.decode(rawData);

        expect(result).toBeInstanceOf(ContractReverted);
        expect((result as ContractReverted).rawData).toBe(rawData);
    });

    it("should return a ChainUtilsFault from the fallback", () => {
        const decoder = new CompositeErrorDecoder([]);

        const result = decoder.decode(rawData);

        expect(result).toBeInstanceOf(ChainUtilsFault);
    });

    it("should pass rawData to each decoder", () => {
        const receivedData: Hex[] = [];
        const decoder = new CompositeErrorDecoder([
            mockDecoder((data) => {
                receivedData.push(data);
                return null;
            }),
            mockDecoder((data) => {
                receivedData.push(data);
                return null;
            }),
        ]);

        decoder.decode(rawData);

        expect(receivedData).toEqual([rawData, rawData]);
    });

    it("should not call subsequent decoders after a match", () => {
        let secondCalled = false;
        const expected = new ContractReverted({ decodedMessage: "hit" });

        const decoder = new CompositeErrorDecoder([
            mockDecoder(() => expected),
            mockDecoder(() => {
                secondCalled = true;
                return null;
            }),
        ]);

        decoder.decode(rawData);

        expect(secondCalled).toBe(false);
    });

    it("should implement ErrorDecoder interface", () => {
        const composite: ErrorDecoder = new CompositeErrorDecoder([]);

        expect(typeof composite.decode).toBe("function");
    });
});
