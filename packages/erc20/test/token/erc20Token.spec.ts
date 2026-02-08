import type { Address, Chain, PublicClient, Transport } from "viem";
import { ERC20BoundToken } from "@/token/erc20Token.js";
import { ChainUtilsFault, MultichainClient } from "@0xtan0/chain-utils/core";
import { describe, expect, it, vi } from "vitest";

const TOKEN_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const TOKEN_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address;
const HOLDER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const SPENDER = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" as Address;

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

function mockPublicClient(
    chainId: number,
    readContract?: ReturnType<typeof vi.fn>,
): PublicClient<Transport, Chain> {
    return {
        chain: mockChain(chainId),
        transport: {},
        request: () => {},
        readContract: readContract ?? vi.fn(),
        multicall: vi.fn(),
    } as unknown as PublicClient<Transport, Chain>;
}

function createMultichainWithMocks<const TIds extends readonly number[]>(
    ...chainIds: TIds
): {
    client: MultichainClient<TIds[number]>;
    readContracts: Map<TIds[number], ReturnType<typeof vi.fn>>;
} {
    const map = new Map<TIds[number], PublicClient<Transport, Chain>>();
    const readContracts = new Map<TIds[number], ReturnType<typeof vi.fn>>();

    for (const id of chainIds) {
        const readContract = vi.fn();
        readContracts.set(id as TIds[number], readContract);
        map.set(id as TIds[number], mockPublicClient(id, readContract));
    }

    return { client: new MultichainClient(map), readContracts };
}

function createBoundToken(options?: { chainIds?: number[]; name?: string; decimals?: number }): {
    token: ERC20BoundToken<1 | 10>;
    readContracts: Map<1 | 10, ReturnType<typeof vi.fn>>;
} {
    const ids = (options?.chainIds ?? [1, 10]) as [1, 10];
    const { client, readContracts } = createMultichainWithMocks(...ids);

    const addresses = new Map<1 | 10, Address>();
    if (ids.includes(1)) addresses.set(1, TOKEN_MAINNET);
    if (ids.includes(10)) addresses.set(10, TOKEN_OPTIMISM);

    const token = new ERC20BoundToken({
        symbol: "USDC",
        name: options?.name,
        decimals: options?.decimals,
        addresses,
        multichainClient: client,
    });

    return { token, readContracts };
}

describe("ERC20BoundToken", () => {
    describe("properties", () => {
        it("exposes symbol, chainIds", () => {
            const { token } = createBoundToken();
            expect(token.symbol).toBe("USDC");
            expect(token.chainIds).toContain(1);
            expect(token.chainIds).toContain(10);
            expect(token.chainIds).toHaveLength(2);
        });

        it("exposes optional name and decimals", () => {
            const { token } = createBoundToken({ name: "USD Coin", decimals: 6 });
            expect(token.name).toBe("USD Coin");
            expect(token.decimals).toBe(6);
        });

        it("name and decimals are undefined when not provided", () => {
            const { token } = createBoundToken();
            expect(token.name).toBeUndefined();
            expect(token.decimals).toBeUndefined();
        });
    });

    describe("address()", () => {
        it("returns the address for a bound chain", () => {
            const { token } = createBoundToken();
            expect(token.address(1)).toBe(TOKEN_MAINNET);
            expect(token.address(10)).toBe(TOKEN_OPTIMISM);
        });

        it("throws for an unbound chain", () => {
            const { token } = createBoundToken();
            expect(() => (token as ERC20BoundToken<number>).address(137)).toThrow(ChainUtilsFault);
        });
    });

    describe("hasChain()", () => {
        it("returns true for bound chains", () => {
            const { token } = createBoundToken();
            expect(token.hasChain(1)).toBe(true);
            expect(token.hasChain(10)).toBe(true);
        });

        it("returns false for unbound chains", () => {
            const { token } = createBoundToken();
            expect(token.hasChain(137)).toBe(false);
        });
    });

    describe("toTokenReference()", () => {
        it("returns a TokenReference", () => {
            const { token } = createBoundToken();
            expect(token.toTokenReference(1)).toEqual({
                address: TOKEN_MAINNET,
                chainId: 1,
            });
        });
    });

    describe("getBalance()", () => {
        it("fetches balance across all bound chains", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(1)!.mockResolvedValue(1000n);
            readContracts.get(10)!.mockResolvedValue(2000n);

            const result = await token.getBalance(HOLDER);

            expect(result.resultsByChain.size).toBe(2);

            const mainnetResult = result.resultsByChain.get(1);
            expect(mainnetResult).toEqual({
                token: { address: TOKEN_MAINNET, chainId: 1 },
                holder: HOLDER,
                balance: 1000n,
            });

            const optimismResult = result.resultsByChain.get(10);
            expect(optimismResult).toEqual({
                token: { address: TOKEN_OPTIMISM, chainId: 10 },
                holder: HOLDER,
                balance: 2000n,
            });

            expect(result.failedChains).toHaveLength(0);
        });

        it("dispatches to the correct chain's read client", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(1)!.mockResolvedValue(1000n);
            readContracts.get(10)!.mockResolvedValue(2000n);

            await token.getBalance(HOLDER);

            // Verify chain 1 was called with chain 1's token address
            expect(readContracts.get(1)).toHaveBeenCalled();
            const call1 = readContracts.get(1)!.mock.calls[0]! as [{ address: string }];
            expect(call1[0].address).toBe(TOKEN_MAINNET);

            // Verify chain 10 was called with chain 10's token address
            expect(readContracts.get(10)).toHaveBeenCalled();
            const call10 = readContracts.get(10)!.mock.calls[0]! as [{ address: string }];
            expect(call10[0].address).toBe(TOKEN_OPTIMISM);
        });

        it("fetches balance for a subset of chains", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(1)!.mockResolvedValue(1000n);

            const result = await token.getBalance(HOLDER, [1]);

            expect(result.resultsByChain.size).toBe(1);
            expect(result.resultsByChain.has(1)).toBe(true);
            expect(result.resultsByChain.has(10)).toBe(false);

            // Optimism should not have been called
            expect(readContracts.get(10)).not.toHaveBeenCalled();
        });

        it("handles chain failures gracefully", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(1)!.mockResolvedValue(1000n);
            readContracts.get(10)!.mockRejectedValue(new Error("RPC timeout"));

            const result = await token.getBalance(HOLDER);

            expect(result.resultsByChain.size).toBe(1);
            expect(result.resultsByChain.has(1)).toBe(true);

            expect(result.failedChains).toHaveLength(1);
            expect(result.failedChains[0]!.chainId).toBe(10);
            expect(result.failedChains[0]!.error.message).toBe("RPC timeout");
        });
    });

    describe("getAllowance()", () => {
        it("fetches allowance across all bound chains", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(1)!.mockResolvedValue(500n);
            readContracts.get(10)!.mockResolvedValue(1500n);

            const result = await token.getAllowance(HOLDER, SPENDER);

            expect(result.resultsByChain.size).toBe(2);

            const mainnetResult = result.resultsByChain.get(1);
            expect(mainnetResult).toEqual({
                token: { address: TOKEN_MAINNET, chainId: 1 },
                owner: HOLDER,
                spender: SPENDER,
                allowance: 500n,
            });

            const optimismResult = result.resultsByChain.get(10);
            expect(optimismResult).toEqual({
                token: { address: TOKEN_OPTIMISM, chainId: 10 },
                owner: HOLDER,
                spender: SPENDER,
                allowance: 1500n,
            });

            expect(result.failedChains).toHaveLength(0);
        });

        it("fetches allowance for a subset of chains", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(10)!.mockResolvedValue(1500n);

            const result = await token.getAllowance(HOLDER, SPENDER, [10]);

            expect(result.resultsByChain.size).toBe(1);
            expect(result.resultsByChain.has(10)).toBe(true);
            expect(readContracts.get(1)).not.toHaveBeenCalled();
        });
    });

    describe("getMetadata()", () => {
        it("returns cached metadata without RPC when name and decimals are set", async () => {
            const { token, readContracts } = createBoundToken({
                name: "USD Coin",
                decimals: 6,
            });

            const meta = await token.getMetadata(1);

            expect(meta).toEqual({
                address: TOKEN_MAINNET,
                chainId: 1,
                name: "USD Coin",
                symbol: "USDC",
                decimals: 6,
            });

            // No RPC calls should have been made
            expect(readContracts.get(1)).not.toHaveBeenCalled();
        });

        it("uses first chain when no chainId specified", async () => {
            const { token } = createBoundToken({ name: "USD Coin", decimals: 6 });

            const meta = await token.getMetadata();

            expect(meta.chainId).toBe(1);
            expect(meta.address).toBe(TOKEN_MAINNET);
        });

        it("fetches metadata via RPC when name/decimals not cached", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts
                .get(1)!
                .mockResolvedValueOnce("USD Coin")
                .mockResolvedValueOnce("USDC")
                .mockResolvedValueOnce(6);

            const meta = await token.getMetadata(1);

            expect(meta).toEqual({
                address: TOKEN_MAINNET,
                chainId: 1,
                name: "USD Coin",
                symbol: "USDC",
                decimals: 6,
            });

            expect(readContracts.get(1)).toHaveBeenCalled();
        });
    });

    describe("getTotalSupply()", () => {
        it("fetches total supply from a specific chain", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(1)!.mockResolvedValue(1_000_000_000n);

            const supply = await token.getTotalSupply(1);

            expect(supply).toBe(1_000_000_000n);
        });
    });

    describe("CrossChainBatchResult structure", () => {
        it("returns correct structure with resultsByChain and failedChains", async () => {
            const { token, readContracts } = createBoundToken();

            readContracts.get(1)!.mockResolvedValue(1000n);
            readContracts.get(10)!.mockResolvedValue(2000n);

            const result = await token.getBalance(HOLDER);

            expect(result).toHaveProperty("resultsByChain");
            expect(result).toHaveProperty("failedChains");
            expect(result.resultsByChain).toBeInstanceOf(Map);
            expect(Array.isArray(result.failedChains)).toBe(true);
        });
    });
});
