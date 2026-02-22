import type {
    ERC20ClientOptions,
    ERC20MultichainClientOptions,
    ERC20WriteClientOptions,
} from "@/types/options.js";
import type { ErrorDecoder } from "@0xtan0/chain-utils-core";
import type { Abi, Chain, PublicClient, Transport, WalletClient } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("ERC20ClientOptions", () => {
    it("requires client, optional errorDecoder/customErrorAbi/multicallBatchSize", () => {
        expectTypeOf<ERC20ClientOptions["client"]>().toEqualTypeOf<
            PublicClient<Transport, Chain>
        >();
        expectTypeOf<ERC20ClientOptions["errorDecoder"]>().toEqualTypeOf<
            ErrorDecoder | undefined
        >();
        expectTypeOf<ERC20ClientOptions["customErrorAbi"]>().toEqualTypeOf<Abi | undefined>();
        expectTypeOf<ERC20ClientOptions["multicallBatchSize"]>().toEqualTypeOf<
            number | undefined
        >();
    });
});

describe("ERC20WriteClientOptions", () => {
    it("extends ERC20ClientOptions", () => {
        expectTypeOf<ERC20WriteClientOptions>().toMatchTypeOf<ERC20ClientOptions>();
    });

    it("requires walletClient", () => {
        expectTypeOf<ERC20WriteClientOptions["walletClient"]>().toEqualTypeOf<WalletClient>();
    });
});

describe("ERC20MultichainClientOptions", () => {
    it("has optional errorDecoder, customErrorAbi, defaultMulticallBatchSize", () => {
        expectTypeOf<ERC20MultichainClientOptions["errorDecoder"]>().toEqualTypeOf<
            ErrorDecoder | undefined
        >();
        expectTypeOf<ERC20MultichainClientOptions["customErrorAbi"]>().toEqualTypeOf<
            Abi | undefined
        >();
        expectTypeOf<ERC20MultichainClientOptions["defaultMulticallBatchSize"]>().toEqualTypeOf<
            number | undefined
        >();
    });
});
