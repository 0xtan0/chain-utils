import type {
    ERC721ClientOptions,
    ERC721CollectionReaderOptions,
    ERC721CollectionWriterOptions,
    ERC721MultichainClientOptions,
    ERC721WriteClientOptions,
} from "@/types/options.js";
import type { ErrorDecoder } from "@0xtan0/chain-utils/core";
import type { Abi, Address, Chain, PublicClient, Transport, WalletClient } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("ERC721ClientOptions", () => {
    it("requires client, optional errorDecoder/customErrorAbi/multicallBatchSize", () => {
        expectTypeOf<ERC721ClientOptions["client"]>().toEqualTypeOf<
            PublicClient<Transport, Chain>
        >();
        expectTypeOf<ERC721ClientOptions["errorDecoder"]>().toEqualTypeOf<
            ErrorDecoder | undefined
        >();
        expectTypeOf<ERC721ClientOptions["customErrorAbi"]>().toEqualTypeOf<Abi | undefined>();
        expectTypeOf<ERC721ClientOptions["multicallBatchSize"]>().toEqualTypeOf<
            number | undefined
        >();
    });
});

describe("ERC721WriteClientOptions", () => {
    it("extends ERC721ClientOptions", () => {
        expectTypeOf<ERC721WriteClientOptions>().toMatchTypeOf<ERC721ClientOptions>();
    });

    it("requires walletClient", () => {
        expectTypeOf<ERC721WriteClientOptions["walletClient"]>().toEqualTypeOf<WalletClient>();
    });
});

describe("ERC721CollectionReaderOptions", () => {
    it("extends ERC721ClientOptions with collection", () => {
        expectTypeOf<ERC721CollectionReaderOptions>().toMatchTypeOf<ERC721ClientOptions>();
        expectTypeOf<ERC721CollectionReaderOptions["collection"]>().toEqualTypeOf<Address>();
    });
});

describe("ERC721CollectionWriterOptions", () => {
    it("extends ERC721WriteClientOptions with collection", () => {
        expectTypeOf<ERC721CollectionWriterOptions>().toMatchTypeOf<ERC721WriteClientOptions>();
        expectTypeOf<ERC721CollectionWriterOptions["collection"]>().toEqualTypeOf<Address>();
    });
});

describe("ERC721MultichainClientOptions", () => {
    it("has optional errorDecoder, customErrorAbi, defaultMulticallBatchSize", () => {
        expectTypeOf<ERC721MultichainClientOptions["errorDecoder"]>().toEqualTypeOf<
            ErrorDecoder | undefined
        >();
        expectTypeOf<ERC721MultichainClientOptions["customErrorAbi"]>().toEqualTypeOf<
            Abi | undefined
        >();
        expectTypeOf<ERC721MultichainClientOptions["defaultMulticallBatchSize"]>().toEqualTypeOf<
            number | undefined
        >();
    });
});
