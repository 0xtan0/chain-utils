import type {
    BatchResult,
    ChainInput,
    ChainTransportConfig,
    ContractClientOptions,
    CrossChainBatchResult,
    ErrorDecoder,
    MulticallItemResult,
    MultichainContractOptions,
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@/external.js";
import {
    ChainUtilsFault,
    CompositeErrorDecoder,
    ContractClient,
    ContractReverted,
    createContractClient,
    createMultichainClient,
    createMultichainContract,
    formatDecodedErrorArgs,
    MulticallBatchFailure,
    MulticallNotSupported,
    MulticallPartialFailure,
    MultichainClient,
    MultichainContract,
    RpcFailure,
    UnsupportedChain,
} from "@/external.js";
import { describe, expect, it } from "vitest";

describe("public API smoke test", () => {
    it("exports all error classes", () => {
        expect(ChainUtilsFault).toBeDefined();
        expect(UnsupportedChain).toBeDefined();
        expect(RpcFailure).toBeDefined();
        expect(MulticallNotSupported).toBeDefined();
        expect(MulticallPartialFailure).toBeDefined();
        expect(MulticallBatchFailure).toBeDefined();
        expect(ContractReverted).toBeDefined();
    });

    it("exports decoder classes", () => {
        expect(CompositeErrorDecoder).toBeDefined();
    });

    it("exports utility helpers", () => {
        expect(formatDecodedErrorArgs).toBeDefined();
    });

    it("exports client classes and factories", () => {
        expect(MultichainClient).toBeDefined();
        expect(createMultichainClient).toBeDefined();
        expect(ContractClient).toBeDefined();
        expect(createContractClient).toBeDefined();
        expect(MultichainContract).toBeDefined();
        expect(createMultichainContract).toBeDefined();
    });

    it("type-only exports compile without runtime values", () => {
        // These are pure type exports — this test verifies they compile.
        // If any type is missing from external.ts, this file will fail to typecheck.
        const _types: [
            ChainTransportConfig?,
            ChainInput?,
            PreparedTransaction?,
            SignedTransaction?,
            WriteOptions?,
            MulticallItemResult<unknown>?,
            BatchResult<unknown>?,
            CrossChainBatchResult<unknown>?,
            ErrorDecoder?,
            ContractClientOptions<never>?,
            MultichainContractOptions<never>?,
        ] = [];
        expect(_types).toBeDefined();
    });
});
