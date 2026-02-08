import type { PreparedTransaction, SignedTransaction, WriteOptions } from "@/types/transaction.js";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("PreparedTransaction", () => {
    it("has required fields", () => {
        const prepared: PreparedTransaction = {
            request: {},
            gasEstimate: 21000n,
            chainId: 1,
        };

        expect(prepared.gasEstimate).toBe(21000n);
        expect(prepared.chainId).toBe(1);
        expectTypeOf(prepared.request).toBeObject();
    });
});

describe("SignedTransaction", () => {
    it("has required fields", () => {
        const signed: SignedTransaction = {
            serialized: "0xabcdef",
            chainId: 1,
        };

        expect(signed.serialized).toBe("0xabcdef");
        expect(signed.chainId).toBe(1);
    });
});

describe("WriteOptions", () => {
    it("accepts empty options", () => {
        const options: WriteOptions = {};
        expectTypeOf(options).toMatchTypeOf<WriteOptions>();
    });

    it("accepts waitForReceipt", () => {
        const options: WriteOptions = { waitForReceipt: true };
        expect(options.waitForReceipt).toBe(true);
    });
});
