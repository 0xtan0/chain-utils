import type { ITokenDefinition } from "@/types/tokenDefinition.js";
import { USDC, USDT, WETH } from "@/token/common.js";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("USDC", () => {
    it("has correct symbol, name, and decimals", () => {
        expect(USDC.symbol).toBe("USDC");
        expect(USDC.name).toBe("USD Coin");
        expect(USDC.decimals).toBe(6);
    });

    it("has 12 chains configured", () => {
        expect(USDC.chainIds).toHaveLength(12);
    });

    it("returns correct addresses per chain", () => {
        expect(USDC.address(1)).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
        expect(USDC.address(10)).toBe("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85");
        expect(USDC.address(42161)).toBe("0xaf88d065e77c8cC2239327C5EDb3A432268e5831");
        expect(USDC.address(8453)).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
        expect(USDC.address(137)).toBe("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359");
        expect(USDC.address(43114)).toBe("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E");
        expect(USDC.address(2020)).toBe("0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc");
        expect(USDC.address(130)).toBe("0x078D782b760474a361dDA0AF3839290b0EF57AD6");
        expect(USDC.address(200901)).toBe("0xf8C374CE88A3BE3d374e8888349C7768B607c755");
        expect(USDC.address(60808)).toBe("0xe75D0fB2C24A55cA1e3F96781a2bCC7bdba058F0");
        expect(USDC.address(1111)).toBe("0x44bB111010DfFfb3695F9a1B66aa879976199e7b");
        expect(USDC.address(16661)).toBe("0x1f3AA82227281cA364bFb3d253B0f1af1Da6473E");
    });

    it("has correct type", () => {
        expectTypeOf(USDC).toEqualTypeOf<
            ITokenDefinition<
                1 | 10 | 42161 | 8453 | 137 | 43114 | 2020 | 130 | 200901 | 60808 | 1111 | 16661
            >
        >();
    });
});

describe("WETH", () => {
    it("has correct symbol, name, and decimals", () => {
        expect(WETH.symbol).toBe("WETH");
        expect(WETH.name).toBe("Wrapped Ether");
        expect(WETH.decimals).toBe(18);
    });

    it("has 4 chains configured", () => {
        expect(WETH.chainIds).toHaveLength(4);
    });

    it("returns correct addresses per chain", () => {
        expect(WETH.address(1)).toBe("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
        expect(WETH.address(10)).toBe("0x4200000000000000000000000000000000000006");
        expect(WETH.address(42161)).toBe("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1");
        expect(WETH.address(8453)).toBe("0x4200000000000000000000000000000000000006");
    });

    it("has correct type", () => {
        expectTypeOf(WETH).toEqualTypeOf<ITokenDefinition<1 | 10 | 42161 | 8453>>();
    });
});

describe("USDT", () => {
    it("has correct symbol, name, and decimals", () => {
        expect(USDT.symbol).toBe("USDT");
        expect(USDT.name).toBe("Tether USD");
        expect(USDT.decimals).toBe(6);
    });

    it("has 4 chains configured (no base)", () => {
        expect(USDT.chainIds).toHaveLength(4);
        expect(USDT.hasChain(8453)).toBe(false);
    });

    it("returns correct addresses per chain", () => {
        expect(USDT.address(1)).toBe("0xdAC17F958D2ee523a2206206994597C13D831ec7");
        expect(USDT.address(10)).toBe("0x94b008aA00579c1307B0EF2c499aD98a8ce58e58");
        expect(USDT.address(42161)).toBe("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9");
        expect(USDT.address(137)).toBe("0xc2132D05D31c914a87C6611C10748AEb04B58e8F");
    });

    it("has correct type", () => {
        expectTypeOf(USDT).toEqualTypeOf<ITokenDefinition<1 | 10 | 42161 | 137>>();
    });
});
