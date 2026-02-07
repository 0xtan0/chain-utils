import type { ChainInput, ChainTransportConfig } from "@/types/config.js";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("ChainTransportConfig", () => {
    it("should accept chain and transport", () => {
        const config: ChainTransportConfig = {
            chain: mainnet,
            transport: http(),
        };

        expect(config.chain.id).toBe(1);
    });

    it("should accept optional multicallAddress", () => {
        const config: ChainTransportConfig = {
            chain: mainnet,
            transport: http(),
            multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
        };

        expect(config.multicallAddress).toBe("0xcA11bde05977b3631167028862bE2a173976CA11");
    });
});

describe("ChainInput", () => {
    it("should accept a PublicClient", () => {
        const client = createPublicClient({
            chain: mainnet,
            transport: http(),
        });

        const input: ChainInput = client;
        expectTypeOf(input).toMatchTypeOf<ChainInput>();
    });

    it("should accept a ChainTransportConfig", () => {
        const config: ChainTransportConfig = {
            chain: mainnet,
            transport: http(),
        };

        const input: ChainInput = config;
        expectTypeOf(input).toMatchTypeOf<ChainInput>();
    });
});
