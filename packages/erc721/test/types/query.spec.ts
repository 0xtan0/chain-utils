import type {
    ApprovalQuery,
    BalanceQuery,
    BatchApprovalResult,
    BatchBalanceResult,
    BatchFailure,
    BatchInterfaceSupportResult,
    BatchOperatorApprovalResult,
    BatchOwnerResult,
    BatchTokenByIndexResult,
    BatchTokenOfOwnerByIndexResult,
    BatchTokenURIResult,
    BatchTotalSupplyResult,
    InterfaceSupportQuery,
    OperatorApprovalQuery,
    OwnerQuery,
    TokenByIndexQuery,
    TokenOfOwnerByIndexQuery,
    TokenURIQuery,
    TotalSupplyQuery,
} from "@/types/query.js";
import type { TokenURIResult } from "@/types/token.js";
import type { MulticallItemResult } from "@0xtan0/chain-utils-core";
import type { Address, Hex } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("Query data types", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;
    const interfaceId = "0x80ac58cd" as Hex;

    it("OwnerQuery has collection and tokenId", () => {
        const query: OwnerQuery = { collection: address, tokenId: 1n };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.tokenId).toEqualTypeOf<bigint>();
    });

    it("TokenURIQuery has collection and tokenId", () => {
        const query: TokenURIQuery = { collection: address, tokenId: 2n };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.tokenId).toEqualTypeOf<bigint>();
    });

    it("ApprovalQuery has collection and tokenId", () => {
        const query: ApprovalQuery = { collection: address, tokenId: 3n };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.tokenId).toEqualTypeOf<bigint>();
    });

    it("BalanceQuery has collection and owner", () => {
        const query: BalanceQuery = { collection: address, owner: address };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.owner).toEqualTypeOf<Address>();
    });

    it("OperatorApprovalQuery has collection, owner, operator", () => {
        const query: OperatorApprovalQuery = {
            collection: address,
            owner: address,
            operator: address,
        };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.owner).toEqualTypeOf<Address>();
        expectTypeOf(query.operator).toEqualTypeOf<Address>();
    });

    it("InterfaceSupportQuery has collection and interfaceId", () => {
        const query: InterfaceSupportQuery = { collection: address, interfaceId };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.interfaceId).toEqualTypeOf<Hex>();
    });

    it("TotalSupplyQuery has collection", () => {
        const query: TotalSupplyQuery = { collection: address };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
    });

    it("TokenByIndexQuery has collection and index", () => {
        const query: TokenByIndexQuery = { collection: address, index: 1n };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.index).toEqualTypeOf<bigint>();
    });

    it("TokenOfOwnerByIndexQuery has collection, owner, index", () => {
        const query: TokenOfOwnerByIndexQuery = {
            collection: address,
            owner: address,
            index: 2n,
        };
        expectTypeOf(query.collection).toEqualTypeOf<Address>();
        expectTypeOf(query.owner).toEqualTypeOf<Address>();
        expectTypeOf(query.index).toEqualTypeOf<bigint>();
    });

    it("BatchOwnerResult references MulticallItemResult<Address>", () => {
        const result: BatchOwnerResult = {
            chainId: 1,
            results: [{ status: "success", result: address }],
            queries: [{ collection: address, tokenId: 1n }],
            failures: [],
        };
        expectTypeOf(result.chainId).toEqualTypeOf<number>();
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<Address>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<OwnerQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<ReadonlyArray<BatchFailure<OwnerQuery>>>();
    });

    it("BatchTokenURIResult references TokenURIResult", () => {
        const result: BatchTokenURIResult = {
            chainId: 1,
            results: [
                {
                    status: "success",
                    data: {
                        nft: {
                            collection: { address, chainId: 1 },
                            tokenId: 1n,
                        },
                        tokenURI: "ipfs://token",
                    },
                },
            ],
            queries: [{ collection: address, tokenId: 1n }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<TokenURIResult>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<TokenURIQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<ReadonlyArray<BatchFailure<TokenURIQuery>>>();
    });

    it("BatchApprovalResult references MulticallItemResult<Address>", () => {
        const result: BatchApprovalResult = {
            chainId: 1,
            results: [{ status: "success", result: address }],
            queries: [{ collection: address, tokenId: 1n }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<Address>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<ApprovalQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<ReadonlyArray<BatchFailure<ApprovalQuery>>>();
    });

    it("BatchBalanceResult references MulticallItemResult<bigint>", () => {
        const result: BatchBalanceResult = {
            chainId: 1,
            results: [{ status: "success", result: 5n }],
            queries: [{ collection: address, owner: address }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<bigint>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<BalanceQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<ReadonlyArray<BatchFailure<BalanceQuery>>>();
    });

    it("BatchOperatorApprovalResult references MulticallItemResult<boolean>", () => {
        const result: BatchOperatorApprovalResult = {
            chainId: 1,
            results: [{ status: "success", result: true }],
            queries: [{ collection: address, owner: address, operator: address }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<boolean>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<OperatorApprovalQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<
            ReadonlyArray<BatchFailure<OperatorApprovalQuery>>
        >();
    });

    it("BatchInterfaceSupportResult references MulticallItemResult<boolean>", () => {
        const result: BatchInterfaceSupportResult = {
            chainId: 1,
            results: [{ status: "success", result: true }],
            queries: [{ collection: address, interfaceId }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<boolean>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<InterfaceSupportQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<
            ReadonlyArray<BatchFailure<InterfaceSupportQuery>>
        >();
    });

    it("BatchTotalSupplyResult references MulticallItemResult<bigint>", () => {
        const result: BatchTotalSupplyResult = {
            chainId: 1,
            results: [{ status: "success", result: 10n }],
            queries: [{ collection: address }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<bigint>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<TotalSupplyQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<
            ReadonlyArray<BatchFailure<TotalSupplyQuery>>
        >();
    });

    it("BatchTokenByIndexResult references MulticallItemResult<bigint>", () => {
        const result: BatchTokenByIndexResult = {
            chainId: 1,
            results: [{ status: "success", result: 12n }],
            queries: [{ collection: address, index: 2n }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<bigint>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<TokenByIndexQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<
            ReadonlyArray<BatchFailure<TokenByIndexQuery>>
        >();
    });

    it("BatchTokenOfOwnerByIndexResult references MulticallItemResult<bigint>", () => {
        const result: BatchTokenOfOwnerByIndexResult = {
            chainId: 1,
            results: [{ status: "success", result: 99n }],
            queries: [{ collection: address, owner: address, index: 0n }],
            failures: [],
        };
        expectTypeOf(result.results).toEqualTypeOf<ReadonlyArray<MulticallItemResult<bigint>>>();
        expectTypeOf(result.queries).toEqualTypeOf<ReadonlyArray<TokenOfOwnerByIndexQuery>>();
        expectTypeOf(result.failures).toEqualTypeOf<
            ReadonlyArray<BatchFailure<TokenOfOwnerByIndexQuery>>
        >();
    });
});
