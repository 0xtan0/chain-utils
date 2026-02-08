import type {
    AllowanceQuery,
    BalanceQuery,
    BatchAllowanceResult,
    BatchBalanceResult,
} from "@/types/query.js";
import type { MulticallItemResult } from "@0xtan0/chain-utils/core";
import type { Address } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("Query data types", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;

    it("BalanceQuery has token and holder", () => {
        const query: BalanceQuery = { token: address, holder: address };
        expectTypeOf(query.token).toEqualTypeOf<Address>();
        expectTypeOf(query.holder).toEqualTypeOf<Address>();
    });

    it("AllowanceQuery has token, owner, and spender", () => {
        const query: AllowanceQuery = {
            token: address,
            owner: address,
            spender: address,
        };
        expectTypeOf(query.token).toEqualTypeOf<Address>();
        expectTypeOf(query.owner).toEqualTypeOf<Address>();
        expectTypeOf(query.spender).toEqualTypeOf<Address>();
    });

    it("BatchBalanceResult references MulticallItemResult<bigint>", () => {
        const result: BatchBalanceResult = {
            chainId: 1,
            results: [{ status: "success", result: 1000n }],
            queries: [{ token: address, holder: address }],
        };
        expectTypeOf(result.chainId).toEqualTypeOf<number>();
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<bigint>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<BalanceQuery>>();
    });

    it("BatchAllowanceResult references MulticallItemResult<bigint>", () => {
        const result: BatchAllowanceResult = {
            chainId: 1,
            results: [{ status: "success", result: 500n }],
            queries: [{ token: address, owner: address, spender: address }],
        };
        expectTypeOf(result.chainId).toEqualTypeOf<number>();
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<bigint>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<AllowanceQuery>>();
    });
});
