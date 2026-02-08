import type { TokenAllowance, TokenBalance, TokenMetadata, TokenReference } from "@/types/token.js";
import type { Address } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("Token data types", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;

    it("TokenReference has address and chainId", () => {
        const ref: TokenReference = { address, chainId: 1 };
        expectTypeOf(ref.address).toEqualTypeOf<Address>();
        expectTypeOf(ref.chainId).toEqualTypeOf<number>();
    });

    it("TokenMetadata extends TokenReference", () => {
        const meta: TokenMetadata = {
            address,
            chainId: 1,
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
        };
        expectTypeOf(meta).toMatchTypeOf<TokenReference>();
        expectTypeOf(meta.name).toEqualTypeOf<string>();
        expectTypeOf(meta.symbol).toEqualTypeOf<string>();
        expectTypeOf(meta.decimals).toEqualTypeOf<number>();
    });

    it("TokenBalance has token, holder, and balance", () => {
        const balance: TokenBalance = {
            token: { address, chainId: 1 },
            holder: address,
            balance: 1000n,
        };
        expectTypeOf(balance.token).toEqualTypeOf<TokenReference>();
        expectTypeOf(balance.holder).toEqualTypeOf<Address>();
        expectTypeOf(balance.balance).toEqualTypeOf<bigint>();
    });

    it("TokenAllowance has token, owner, spender, and allowance", () => {
        const allowance: TokenAllowance = {
            token: { address, chainId: 1 },
            owner: address,
            spender: address,
            allowance: 500n,
        };
        expectTypeOf(allowance.token).toEqualTypeOf<TokenReference>();
        expectTypeOf(allowance.owner).toEqualTypeOf<Address>();
        expectTypeOf(allowance.spender).toEqualTypeOf<Address>();
        expectTypeOf(allowance.allowance).toEqualTypeOf<bigint>();
    });
});
