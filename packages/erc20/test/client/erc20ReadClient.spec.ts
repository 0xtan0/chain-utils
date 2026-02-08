import type { ERC20ClientOptions } from "@/types/options.js";
import type { Address, Chain, PublicClient, Transport } from "viem";
import { createERC20Client, ERC20ReadClient } from "@/client/erc20ReadClient.js";
import { InvalidAddress } from "@/errors/contract.js";
import { describe, expect, it, vi } from "vitest";

const TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const HOLDER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const SPENDER = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" as Address;

function mockChain(chainId: number): Chain {
    return {
        id: chainId,
        name: "test",
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
    chain: Chain,
    overrides?: Partial<PublicClient<Transport, Chain>>,
): PublicClient<Transport, Chain> {
    return {
        chain,
        transport: {},
        request: () => {},
        readContract: vi.fn(),
        multicall: vi.fn(),
        ...overrides,
    } as unknown as PublicClient<Transport, Chain>;
}

function createOptions(overrides?: Partial<ERC20ClientOptions>): ERC20ClientOptions {
    const chain = mockChain(1);
    return {
        client: mockPublicClient(chain),
        ...overrides,
    };
}

describe("ERC20ReadClient", () => {
    describe("construction", () => {
        it("exposes chainId and supportsMulticall", () => {
            const client = new ERC20ReadClient(createOptions());
            expect(client.chainId).toBe(1);
            expect(client.supportsMulticall).toBe(true);
        });

        it("createERC20Client factory returns an ERC20ReadClient", () => {
            const client = createERC20Client(createOptions());
            expect(client.chainId).toBe(1);
        });
    });

    describe("getTokenMetadata", () => {
        it("fetches name, symbol, decimals and returns TokenMetadata", async () => {
            const readContract = vi.fn();
            readContract
                .mockResolvedValueOnce("USD Coin")
                .mockResolvedValueOnce("USDC")
                .mockResolvedValueOnce(6);

            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            const meta = await client.getTokenMetadata(TOKEN);
            expect(meta).toEqual({
                address: TOKEN,
                chainId: 1,
                name: "USD Coin",
                symbol: "USDC",
                decimals: 6,
            });
            expect(readContract).toHaveBeenCalledTimes(3);
        });

        it("throws InvalidAddress for invalid token address", async () => {
            const client = new ERC20ReadClient(createOptions());
            await expect(client.getTokenMetadata("bad" as Address)).rejects.toThrow(InvalidAddress);
        });
    });

    describe("getBalance", () => {
        it("returns a TokenBalance", async () => {
            const readContract = vi.fn().mockResolvedValueOnce(1000n);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            const result = await client.getBalance(TOKEN, HOLDER);
            expect(result).toEqual({
                token: { address: TOKEN, chainId: 1 },
                holder: HOLDER,
                balance: 1000n,
            });
        });

        it("throws InvalidAddress for invalid holder", async () => {
            const client = new ERC20ReadClient(createOptions());
            await expect(client.getBalance(TOKEN, "bad" as Address)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("getAllowance", () => {
        it("returns a TokenAllowance", async () => {
            const readContract = vi.fn().mockResolvedValueOnce(500n);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            const result = await client.getAllowance(TOKEN, HOLDER, SPENDER);
            expect(result).toEqual({
                token: { address: TOKEN, chainId: 1 },
                owner: HOLDER,
                spender: SPENDER,
                allowance: 500n,
            });
        });

        it("throws InvalidAddress for invalid spender", async () => {
            const client = new ERC20ReadClient(createOptions());
            await expect(client.getAllowance(TOKEN, HOLDER, "bad" as Address)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("getTotalSupply", () => {
        it("returns a bigint", async () => {
            const readContract = vi.fn().mockResolvedValueOnce(1_000_000n);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            const result = await client.getTotalSupply(TOKEN);
            expect(result).toBe(1_000_000n);
        });
    });

    describe("getBalances (batch)", () => {
        it("returns BatchBalanceResult with multicall", async () => {
            const multicall = vi.fn().mockResolvedValueOnce([
                { status: "success", result: 100n },
                { status: "success", result: 200n },
            ]);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { multicall }) }),
            );

            const queries = [
                { token: TOKEN, holder: HOLDER },
                { token: TOKEN, holder: SPENDER },
            ];
            const result = await client.getBalances(queries);
            expect(result.chainId).toBe(1);
            expect(result.queries).toBe(queries);
            expect(result.results).toHaveLength(2);
            expect(result.results[0]).toEqual({ status: "success", result: 100n });
            expect(result.results[1]).toEqual({ status: "success", result: 200n });
            expect(result.failures).toHaveLength(0);
        });

        it("handles partial failures", async () => {
            const error = new Error("revert");
            const multicall = vi.fn().mockResolvedValueOnce([
                { status: "success", result: 100n },
                { status: "failure", error },
            ]);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { multicall }) }),
            );

            const queries = [
                { token: TOKEN, holder: HOLDER },
                { token: TOKEN, holder: SPENDER },
            ];
            const result = await client.getBalances(queries);
            expect(result.results[0]?.status).toBe("success");
            expect(result.results[1]?.status).toBe("failure");
            expect(result.failures).toHaveLength(1);
            expect(result.failures[0]).toEqual({ query: queries[1], error });
        });
    });

    describe("getAllowances (batch)", () => {
        it("returns BatchAllowanceResult", async () => {
            const multicall = vi.fn().mockResolvedValueOnce([{ status: "success", result: 500n }]);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { multicall }) }),
            );

            const queries = [{ token: TOKEN, owner: HOLDER, spender: SPENDER }];
            const result = await client.getAllowances(queries);
            expect(result.chainId).toBe(1);
            expect(result.queries).toBe(queries);
            expect(result.results[0]).toEqual({ status: "success", result: 500n });
            expect(result.failures).toHaveLength(0);
        });
    });

    describe("getTokenMetadataBatch", () => {
        it("returns metadata for multiple tokens", async () => {
            const multicall = vi.fn().mockResolvedValueOnce([
                { status: "success", result: "USD Coin" },
                { status: "success", result: "USDC" },
                { status: "success", result: 6 },
                { status: "success", result: "Dai Stablecoin" },
                { status: "success", result: "DAI" },
                { status: "success", result: 18 },
            ]);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { multicall }) }),
            );

            const TOKEN2 = "0x6B175474E89094C44Da98b954EedeAC495271d0F" as Address;
            const results = await client.getTokenMetadataBatch([TOKEN, TOKEN2]);
            expect(results).toHaveLength(2);
            expect(results[0]).toEqual({
                status: "success",
                data: {
                    address: TOKEN,
                    chainId: 1,
                    name: "USD Coin",
                    symbol: "USDC",
                    decimals: 6,
                },
            });
            expect(results[1]).toEqual({
                status: "success",
                data: {
                    address: TOKEN2,
                    chainId: 1,
                    name: "Dai Stablecoin",
                    symbol: "DAI",
                    decimals: 18,
                },
            });
        });

        it("returns Error for tokens where any metadata call fails", async () => {
            const multicall = vi.fn().mockResolvedValueOnce([
                { status: "success", result: "USD Coin" },
                { status: "failure", error: new Error("revert") },
                { status: "success", result: 6 },
            ]);
            const client = new ERC20ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { multicall }) }),
            );

            const results = await client.getTokenMetadataBatch([TOKEN]);
            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                status: "failure",
                token: { address: TOKEN, chainId: 1 },
            });
            expect(results[0]!.status === "failure" && results[0]!.errors).toHaveLength(1);
        });
    });
});
