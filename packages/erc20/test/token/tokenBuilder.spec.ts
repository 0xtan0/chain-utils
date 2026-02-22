import type { ITokenDefinition } from "@/types/tokenDefinition.js";
import type { Address, Chain } from "viem";
import { InvalidAddress } from "@/errors/contract.js";
import { defineToken } from "@/token/tokenBuilder.js";
import { ChainUtilsFault } from "@0xtan0/chain-utils-core";
import { describe, expect, expectTypeOf, it } from "vitest";

const mainnet = {
    id: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.example.com"] } },
} as const satisfies Chain;

const optimism = {
    id: 10,
    name: "OP Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.example.com"] } },
} as const satisfies Chain;

const USDC_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const USDC_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address;

describe("defineToken", () => {
    describe("builder pattern", () => {
        it("creates a token definition with a single chain", () => {
            const token = defineToken("USDC").onChain(mainnet, USDC_MAINNET).build();

            expect(token.symbol).toBe("USDC");
            expect(token.addresses.size).toBe(1);
            expect(token.address(1)).toBe(USDC_MAINNET);
        });

        it("chains multiple .onChain() calls", () => {
            const token = defineToken("USDC")
                .onChain(mainnet, USDC_MAINNET)
                .onChain(optimism, USDC_OPTIMISM)
                .build();

            expect(token.addresses.size).toBe(2);
            expect(token.address(1)).toBe(USDC_MAINNET);
            expect(token.address(10)).toBe(USDC_OPTIMISM);
        });

        it("accepts a numeric chain ID directly", () => {
            const token = defineToken("USDC")
                .onChain(1 as const, USDC_MAINNET)
                .build();

            expect(token.address(1)).toBe(USDC_MAINNET);
        });

        it("throws InvalidAddress when registering an invalid address", () => {
            expect(() => defineToken("USDC").onChain(mainnet, "bad-address" as Address)).toThrow(
                InvalidAddress,
            );
        });

        it("throws when building with no chains", () => {
            expect(() => defineToken("USDC").build()).toThrow(ChainUtilsFault);
        });

        it("stores optional metadata", () => {
            const token = defineToken("USDC", {
                name: "USD Coin",
                decimals: 6,
            })
                .onChain(mainnet, USDC_MAINNET)
                .build();

            expect(token.name).toBe("USD Coin");
            expect(token.decimals).toBe(6);
        });

        it("omits name and decimals when not provided", () => {
            const token = defineToken("USDC").onChain(mainnet, USDC_MAINNET).build();

            expect(token.name).toBeUndefined();
            expect(token.decimals).toBeUndefined();
        });
    });

    describe("ITokenDefinition", () => {
        const token = defineToken("USDC", { name: "USD Coin", decimals: 6 })
            .onChain(mainnet, USDC_MAINNET)
            .onChain(optimism, USDC_OPTIMISM)
            .build();

        describe("address()", () => {
            it("returns the correct address for a configured chain", () => {
                expect(token.address(1)).toBe(USDC_MAINNET);
                expect(token.address(10)).toBe(USDC_OPTIMISM);
            });

            it("throws for an unconfigured chain", () => {
                expect(() => (token as ITokenDefinition<number>).address(137)).toThrow(
                    ChainUtilsFault,
                );
            });
        });

        describe("hasChain()", () => {
            it("returns true for configured chains", () => {
                expect(token.hasChain(1)).toBe(true);
                expect(token.hasChain(10)).toBe(true);
            });

            it("returns false for unconfigured chains", () => {
                expect(token.hasChain(137)).toBe(false);
                expect(token.hasChain(42161)).toBe(false);
            });
        });

        describe("chainIds", () => {
            it("lists all configured chain IDs", () => {
                expect(token.chainIds).toEqual(expect.arrayContaining([1, 10]));
                expect(token.chainIds).toHaveLength(2);
            });
        });

        describe("toTokenReference()", () => {
            it("returns a TokenReference for a configured chain", () => {
                const ref = token.toTokenReference(1);
                expect(ref).toEqual({
                    address: USDC_MAINNET,
                    chainId: 1,
                });
            });

            it("throws for an unconfigured chain", () => {
                expect(() => (token as ITokenDefinition<number>).toTokenReference(137)).toThrow(
                    ChainUtilsFault,
                );
            });
        });

        describe("toTokenMetadata()", () => {
            it("returns a TokenMetadata when name and decimals are set", () => {
                const meta = token.toTokenMetadata(1);
                expect(meta).toEqual({
                    address: USDC_MAINNET,
                    chainId: 1,
                    name: "USD Coin",
                    symbol: "USDC",
                    decimals: 6,
                });
            });

            it("throws when name or decimals are missing", () => {
                const partial = defineToken("USDC").onChain(mainnet, USDC_MAINNET).build();

                expect(() => (partial as ITokenDefinition<number>).toTokenMetadata(1)).toThrow(
                    ChainUtilsFault,
                );
            });

            it("throws for an unconfigured chain", () => {
                expect(() => (token as ITokenDefinition<number>).toTokenMetadata(137)).toThrow(
                    ChainUtilsFault,
                );
            });
        });
    });

    describe("type safety", () => {
        it("accumulates chain IDs in the type parameter", () => {
            const token = defineToken("USDC")
                .onChain(mainnet, USDC_MAINNET)
                .onChain(optimism, USDC_OPTIMISM)
                .build();

            expectTypeOf(token).toEqualTypeOf<ITokenDefinition<1 | 10>>();
        });

        it("captures chain ID from viem Chain object", () => {
            const token = defineToken("USDC").onChain(mainnet, USDC_MAINNET).build();

            expectTypeOf(token).toEqualTypeOf<ITokenDefinition<1>>();
        });

        it("captures chain ID from numeric literal", () => {
            const token = defineToken("USDC")
                .onChain(1 as const, USDC_MAINNET)
                .build();

            expectTypeOf(token).toEqualTypeOf<ITokenDefinition<1>>();
        });
    });
});
