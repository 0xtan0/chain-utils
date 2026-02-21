import type { Address } from "viem";
import { resolveChainFromConfig } from "@/utils/chain.js";
import { http } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { mockChainWithoutMulticall } from "../mocks/publicClient.js";

describe("resolveChainFromConfig", () => {
    it("returns the original chain when multicallAddress is not provided", () => {
        const chain = mockChainWithoutMulticall(11155111);

        const resolved = resolveChainFromConfig({
            chain,
            transport: http(),
        });

        expect(resolved).toBe(chain);
    });

    it("adds multicall3 address when the input chain has no multicall config", () => {
        const chain = mockChainWithoutMulticall(11155111);
        const multicallAddress: Address = "0xcA11bde05977b3631167028862bE2a173976CA11";

        const resolved = resolveChainFromConfig({
            chain,
            transport: http(),
            multicallAddress,
        });

        expect(resolved).not.toBe(chain);
        expect(resolved.contracts?.multicall3?.address).toBe(multicallAddress);
    });

    it("overrides multicall3 address without mutating the original chain", () => {
        const multicallAddress: Address = "0x1111111111111111111111111111111111111111";
        const originalMulticallAddress = mainnet.contracts?.multicall3?.address;
        const originalResolverAddress = mainnet.contracts?.ensUniversalResolver?.address;

        const resolved = resolveChainFromConfig({
            chain: mainnet,
            transport: http(),
            multicallAddress,
        });

        expect(resolved.contracts?.multicall3?.address).toBe(multicallAddress);
        expect(resolved.contracts?.ensUniversalResolver?.address).toBe(originalResolverAddress);
        expect(mainnet.contracts?.multicall3?.address).toBe(originalMulticallAddress);
    });
});
