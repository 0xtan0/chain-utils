import type { ERC20Token } from "@/types/erc20Token.js";
import type { ITokenDefinition } from "@/types/tokenDefinition.js";
import type { Address, Chain, PublicClient, Transport } from "viem";
import { ERC20TokenBuilder } from "@/token/erc20TokenBuilder.js";
import { defineToken } from "@/token/tokenBuilder.js";
import { ChainUtilsFault, MultichainClient } from "@0xtan0/chain-utils/core";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

const USDC_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const USDC_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address;
const USDC_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address;

function mockChain(chainId: number): Chain {
    return {
        id: chainId,
        name: `Chain ${chainId}`,
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["http://localhost"] } },
        contracts: {
            multicall3: {
                address: "0xcA11bde05977b3631167028862bE2a173976CA11",
            },
        },
    } as Chain;
}

function mockPublicClient(chainId: number): PublicClient<Transport, Chain> {
    return {
        chain: mockChain(chainId),
        transport: {},
        request: () => {},
        readContract: vi.fn(),
        multicall: vi.fn(),
    } as unknown as PublicClient<Transport, Chain>;
}

function createMultichain<const TIds extends readonly number[]>(
    ...chainIds: TIds
): MultichainClient<TIds[number]> {
    const map = new Map<TIds[number], PublicClient<Transport, Chain>>();
    for (const id of chainIds) {
        map.set(id as TIds[number], mockPublicClient(id));
    }
    return new MultichainClient(map);
}

describe("ERC20TokenBuilder", () => {
    describe("construction", () => {
        it("creates a builder from a MultichainClient", () => {
            const client = createMultichain(1, 10);
            const builder = new ERC20TokenBuilder(client);
            expect(builder).toBeInstanceOf(ERC20TokenBuilder);
        });
    });

    describe(".onChain()", () => {
        it("adds a chain by numeric ID", () => {
            const client = createMultichain(1, 10);
            const token = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .build();

            expect(token.chainIds).toEqual([1]);
            expect(token.getAddress(1)).toBe(USDC_MAINNET);
        });

        it("adds multiple chains", () => {
            const client = createMultichain(1, 10);
            const token = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .onChain(10 as const, USDC_OPTIMISM)
                .build();

            expect(token.chainIds).toContain(1);
            expect(token.chainIds).toContain(10);
            expect(token.chainIds).toHaveLength(2);
        });

        it("accepts a viem Chain object", () => {
            const mainnet = mockChain(1);
            const client = createMultichain(1);
            const token = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", name: "USD Coin", decimals: 6 })
                .onChain(mainnet, USDC_MAINNET)
                .build();

            expect(token.getAddress(1 as never)).toBe(USDC_MAINNET);
        });

        it("throws when adding a chain not in the MultichainClient", () => {
            const client = createMultichain(1);
            const builder = new ERC20TokenBuilder(client);

            expect(() => builder.onChain(137 as never, USDC_MAINNET)).toThrow(ChainUtilsFault);
        });
    });

    describe(".metadata()", () => {
        it("sets name, symbol, and decimals", () => {
            const client = createMultichain(1);
            const token = new ERC20TokenBuilder(client)
                .metadata({ name: "USD Coin", symbol: "USDC", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .build();

            expect(token.symbol).toBe("USDC");
            expect(token.name).toBe("USD Coin");
            expect(token.decimals).toBe(6);
        });

        it("returns the same builder instance (this)", () => {
            const client = createMultichain(1);
            const builder = new ERC20TokenBuilder(client);
            const result = builder.metadata({ symbol: "USDC" });
            expect(result).toBe(builder);
        });
    });

    describe(".fromDefinition()", () => {
        it("imports all overlapping chains from a definition", () => {
            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .onChain(10 as const, USDC_OPTIMISM)
                .onChain(42161 as const, USDC_ARBITRUM)
                .build();

            const client = createMultichain(1, 10);
            const token = new ERC20TokenBuilder(client)
                .fromDefinition(definition as ITokenDefinition<1 | 10>)
                .build();

            expect(token.chainIds).toContain(1);
            expect(token.chainIds).toContain(10);
            expect(token.chainIds).toHaveLength(2);
            expect(token.symbol).toBe("USDC");
            expect(token.name).toBe("USD Coin");
            expect(token.decimals).toBe(6);
        });

        it("imports only chains present in the MultichainClient", () => {
            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .onChain(10 as const, USDC_OPTIMISM)
                .onChain(42161 as const, USDC_ARBITRUM)
                .build();

            const client = createMultichain(1);
            const token = new ERC20TokenBuilder(client)
                .fromDefinition(definition as ITokenDefinition<1>)
                .build();

            expect(token.chainIds).toEqual([1]);
        });

        it("imports symbol/name/decimals from definition", () => {
            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .build();

            const client = createMultichain(1);
            const token = new ERC20TokenBuilder(client).fromDefinition(definition).build();

            expect(token.symbol).toBe("USDC");
            expect(token.name).toBe("USD Coin");
            expect(token.decimals).toBe(6);
        });

        it("metadata() overrides definition metadata", () => {
            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .build();

            const client = createMultichain(1);
            const token = new ERC20TokenBuilder(client)
                .metadata({ name: "Custom Name", symbol: "CUSTOM", decimals: 18 })
                .fromDefinition(definition)
                .build();

            expect(token.symbol).toBe("CUSTOM");
            expect(token.name).toBe("Custom Name");
            expect(token.decimals).toBe(18);
        });
    });

    describe(".build()", () => {
        it("throws when no chains have been added", () => {
            const client = createMultichain(1);
            const builder = new ERC20TokenBuilder(client).metadata({
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
            });

            expect(() => builder.build()).toThrow(ChainUtilsFault);
        });

        it("throws when no symbol is set", () => {
            const client = createMultichain(1);
            const builder = new ERC20TokenBuilder(client)
                .metadata({ name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET);

            expect(() => builder.build()).toThrow(ChainUtilsFault);
        });

        it("throws when no name is set", () => {
            const client = createMultichain(1);
            const builder = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET);

            expect(() => builder.build()).toThrow(ChainUtilsFault);
        });

        it("throws when no decimals is set", () => {
            const client = createMultichain(1);
            const builder = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", name: "USD Coin" })
                .onChain(1 as const, USDC_MAINNET);

            expect(() => builder.build()).toThrow(ChainUtilsFault);
        });

        it("returns an ERC20Token", () => {
            const client = createMultichain(1);
            const token = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .build();

            expect(token.symbol).toBe("USDC");
            expect(token.chainIds).toEqual([1]);
        });
    });

    describe("type safety", () => {
        it("constrains onChain to MultichainClient chain IDs", () => {
            const client = createMultichain(1, 10);
            const builder = new ERC20TokenBuilder(client);

            const withMainnet = builder
                .metadata({ symbol: "USDC" })
                .onChain(1 as const, USDC_MAINNET);

            expectTypeOf(withMainnet).toEqualTypeOf<ERC20TokenBuilder<1 | 10, 1>>();
        });

        it("accumulates chain IDs through onChain calls", () => {
            const client = createMultichain(1, 10);
            const token = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .onChain(10 as const, USDC_OPTIMISM)
                .build();

            expectTypeOf(token).toEqualTypeOf<ERC20Token<1 | 10>>();
        });

        it("build returns ERC20Token with accumulated chain IDs", () => {
            const client = createMultichain(1, 10, 42161);
            const token = new ERC20TokenBuilder(client)
                .metadata({ symbol: "USDC", name: "USD Coin", decimals: 6 })
                .onChain(1 as const, USDC_MAINNET)
                .build();

            expectTypeOf(token).toEqualTypeOf<ERC20Token<1>>();
        });
    });
});
