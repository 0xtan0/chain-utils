import type { IERC20Read } from "@/types/client.js";
import type { ITokenDefinition } from "@/types/tokenDefinition.js";
import type { Address, Chain, PublicClient, Transport } from "viem";
import { erc20Abi } from "@/abi/erc20Abi.js";
import {
    createERC20MultichainClient,
    ERC20MultichainClient,
} from "@/client/erc20MultichainClient.js";
import { defineToken } from "@/token/tokenBuilder.js";
import {
    ContractClient,
    createMultichainContract,
    MultichainClient,
    MultichainContract,
} from "@0xtan0/chain-utils/core";
import { describe, expect, it, vi } from "vitest";

const TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const TOKEN_OP = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address;
const HOLDER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const HOLDER_2 = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" as Address;
const SPENDER = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503" as Address;

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
    multicall?: ReturnType<typeof vi.fn>,
): PublicClient<Transport, Chain> {
    return {
        chain: mockChain(chainId),
        transport: {},
        request: () => {},
        readContract: readContract ?? vi.fn(),
        multicall: multicall ?? vi.fn(),
    } as unknown as PublicClient<Transport, Chain>;
}

function mockERC20Read(chainId: number): IERC20Read {
    return {
        contract: {} as ContractClient<typeof erc20Abi>,
        chainId,
        supportsMulticall: true,
        getTokenMetadata: vi.fn(),
        getBalance: vi.fn(),
        getAllowance: vi.fn(),
        getTotalSupply: vi.fn(),
        getBalances: vi.fn(),
        getAllowances: vi.fn(),
        getTokenMetadataBatch: vi.fn(),
    };
}

function createTestImpl(): {
    impl: ERC20MultichainClient<1 | 10>;
    clients: Map<1 | 10, IERC20Read>;
} {
    const client1 = mockERC20Read(1);
    const client10 = mockERC20Read(10);

    const clients = new Map<1 | 10, IERC20Read>([
        [1, client1],
        [10, client10],
    ]);

    const pc1 = mockPublicClient(1);
    const pc10 = mockPublicClient(10);
    const multichainClient = new MultichainClient(
        new Map<1 | 10, PublicClient<Transport, Chain>>([
            [1, pc1],
            [10, pc10],
        ]),
    );

    const multichain = createMultichainContract({
        abi: erc20Abi,
        multichainClient,
    });

    const impl = new ERC20MultichainClient(clients, multichain);
    return { impl, clients };
}

describe("ERC20MultichainClient", () => {
    describe("construction", () => {
        it("exposes chainIds", () => {
            const { impl } = createTestImpl();
            expect(impl.chainIds).toContain(1);
            expect(impl.chainIds).toContain(10);
            expect(impl.chainIds).toHaveLength(2);
        });

        it("exposes multichain contract", () => {
            const { impl } = createTestImpl();
            expect(impl.multichain).toBeInstanceOf(MultichainContract);
        });
    });

    describe("getClient()", () => {
        it("returns the correct read client for a chain", () => {
            const { impl, clients } = createTestImpl();
            expect(impl.getClient(1)).toBe(clients.get(1));
            expect(impl.getClient(10)).toBe(clients.get(10));
        });

        it("throws for an unconfigured chain", () => {
            const { impl } = createTestImpl();
            expect(() => (impl as ERC20MultichainClient<number>).getClient(137)).toThrow();
        });
    });

    describe("hasChain()", () => {
        it("returns true for configured chains", () => {
            const { impl } = createTestImpl();
            expect(impl.hasChain(1)).toBe(true);
            expect(impl.hasChain(10)).toBe(true);
        });

        it("returns false for unconfigured chains", () => {
            const { impl } = createTestImpl();
            expect(impl.hasChain(137)).toBe(false);
        });
    });

    describe("getBalanceAcrossChains()", () => {
        it("queries the same token on multiple chains in parallel", async () => {
            const { impl, clients } = createTestImpl();

            const balanceResult1 = {
                chainId: 1,
                results: [{ status: "success" as const, result: 100n }],
                queries: [{ token: TOKEN, holder: HOLDER }],
                failures: [],
            };
            const balanceResult10 = {
                chainId: 10,
                results: [{ status: "success" as const, result: 200n }],
                queries: [{ token: TOKEN, holder: HOLDER }],
                failures: [],
            };

            vi.mocked(clients.get(1)!.getBalances).mockResolvedValue(balanceResult1);
            vi.mocked(clients.get(10)!.getBalances).mockResolvedValue(balanceResult10);

            const result = await impl.getBalanceAcrossChains(TOKEN, HOLDER, [1, 10]);

            expect(result.resultsByChain.size).toBe(2);
            expect(result.resultsByChain.get(1)).toBe(balanceResult1);
            expect(result.resultsByChain.get(10)).toBe(balanceResult10);
            expect(result.failedChains).toHaveLength(0);
        });

        it("handles partial chain failures", async () => {
            const { impl, clients } = createTestImpl();

            const balanceResult1 = {
                chainId: 1,
                results: [{ status: "success" as const, result: 100n }],
                queries: [{ token: TOKEN, holder: HOLDER }],
                failures: [],
            };
            vi.mocked(clients.get(1)!.getBalances).mockResolvedValue(balanceResult1);
            vi.mocked(clients.get(10)!.getBalances).mockRejectedValue(new Error("RPC down"));

            const result = await impl.getBalanceAcrossChains(TOKEN, HOLDER, [1, 10]);

            expect(result.resultsByChain.size).toBe(1);
            expect(result.resultsByChain.get(1)).toBe(balanceResult1);
            expect(result.failedChains).toHaveLength(1);
            expect(result.failedChains[0]!.chainId).toBe(10);
            expect(result.failedChains[0]!.error.message).toBe("RPC down");
        });
    });

    describe("getBalances()", () => {
        it("groups queries by chain and dispatches in parallel", async () => {
            const { impl, clients } = createTestImpl();

            const balanceResult1 = {
                chainId: 1,
                results: [{ status: "success" as const, result: 100n }],
                queries: [{ token: TOKEN, holder: HOLDER }],
                failures: [],
            };
            const balanceResult10 = {
                chainId: 10,
                results: [{ status: "success" as const, result: 200n }],
                queries: [{ token: TOKEN, holder: HOLDER_2 }],
                failures: [],
            };

            vi.mocked(clients.get(1)!.getBalances).mockResolvedValue(balanceResult1);
            vi.mocked(clients.get(10)!.getBalances).mockResolvedValue(balanceResult10);

            const result = await impl.getBalances([
                { token: TOKEN, holder: HOLDER, chainId: 1 },
                { token: TOKEN, holder: HOLDER_2, chainId: 10 },
            ]);

            expect(result.resultsByChain.size).toBe(2);
            expect(clients.get(1)!.getBalances).toHaveBeenCalledWith([
                { token: TOKEN, holder: HOLDER, chainId: 1 },
            ]);
            expect(clients.get(10)!.getBalances).toHaveBeenCalledWith([
                { token: TOKEN, holder: HOLDER_2, chainId: 10 },
            ]);
        });
    });

    describe("getAllowances()", () => {
        it("groups queries by chain and dispatches in parallel", async () => {
            const { impl, clients } = createTestImpl();

            const allowResult1 = {
                chainId: 1,
                results: [{ status: "success" as const, result: 500n }],
                queries: [{ token: TOKEN, owner: HOLDER, spender: SPENDER }],
                failures: [],
            };

            vi.mocked(clients.get(1)!.getAllowances).mockResolvedValue(allowResult1);

            const result = await impl.getAllowances([
                { token: TOKEN, owner: HOLDER, spender: SPENDER, chainId: 1 },
            ]);

            expect(result.resultsByChain.size).toBe(1);
            expect(result.resultsByChain.get(1)).toBe(allowResult1);
        });
    });

    describe("getTokenBalance()", () => {
        it("resolves addresses from TokenDefinition per chain", async () => {
            const { impl, clients } = createTestImpl();

            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .onChain(10 as const, TOKEN_OP)
                .build();

            const tokenBalance1 = {
                token: { address: TOKEN, chainId: 1 },
                holder: HOLDER,
                balance: 100n,
            };
            const tokenBalance10 = {
                token: { address: TOKEN_OP, chainId: 10 },
                holder: HOLDER,
                balance: 200n,
            };

            vi.mocked(clients.get(1)!.getBalance).mockResolvedValue(tokenBalance1);
            vi.mocked(clients.get(10)!.getBalance).mockResolvedValue(tokenBalance10);

            const result = await impl.getTokenBalance(definition, HOLDER);

            expect(result.resultsByChain.size).toBe(2);
            expect(result.resultsByChain.get(1)).toBe(tokenBalance1);
            expect(result.resultsByChain.get(10)).toBe(tokenBalance10);

            // Verify correct addresses were resolved
            expect(clients.get(1)!.getBalance).toHaveBeenCalledWith(TOKEN, HOLDER);
            expect(clients.get(10)!.getBalance).toHaveBeenCalledWith(TOKEN_OP, HOLDER);
        });

        it("only queries overlapping chains", async () => {
            const { impl, clients } = createTestImpl();

            // Token defined on chains 1 and 42161, client has 1 and 10
            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .onChain(42161 as const, "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address)
                .build();

            const tokenBalance1 = {
                token: { address: TOKEN, chainId: 1 },
                holder: HOLDER,
                balance: 100n,
            };
            vi.mocked(clients.get(1)!.getBalance).mockResolvedValue(tokenBalance1);

            const result = await impl.getTokenBalance(
                definition as unknown as ITokenDefinition<1>,
                HOLDER,
            );

            expect(result.resultsByChain.size).toBe(1);
            expect(result.resultsByChain.get(1)).toBe(tokenBalance1);
            expect(clients.get(10)!.getBalance).not.toHaveBeenCalled();
        });

        it("accepts optional chain subset", async () => {
            const { impl, clients } = createTestImpl();

            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .onChain(10 as const, TOKEN_OP)
                .build();

            const tokenBalance1 = {
                token: { address: TOKEN, chainId: 1 },
                holder: HOLDER,
                balance: 100n,
            };
            vi.mocked(clients.get(1)!.getBalance).mockResolvedValue(tokenBalance1);

            const result = await impl.getTokenBalance(definition, HOLDER, [1]);

            expect(result.resultsByChain.size).toBe(1);
            expect(result.resultsByChain.has(1)).toBe(true);
            expect(clients.get(10)!.getBalance).not.toHaveBeenCalled();
        });
    });

    describe("getTokenAllowance()", () => {
        it("resolves addresses from TokenDefinition", async () => {
            const { impl, clients } = createTestImpl();

            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .onChain(10 as const, TOKEN_OP)
                .build();

            const allowResult1 = {
                chainId: 1,
                results: [{ status: "success" as const, result: 500n }],
                queries: [{ token: TOKEN, owner: HOLDER, spender: SPENDER }],
                failures: [],
            };
            const allowResult10 = {
                chainId: 10,
                results: [{ status: "success" as const, result: 1500n }],
                queries: [{ token: TOKEN_OP, owner: HOLDER, spender: SPENDER }],
                failures: [],
            };

            vi.mocked(clients.get(1)!.getAllowances).mockResolvedValue(allowResult1);
            vi.mocked(clients.get(10)!.getAllowances).mockResolvedValue(allowResult10);

            const result = await impl.getTokenAllowance(definition, HOLDER, SPENDER);

            expect(result.resultsByChain.size).toBe(2);
            expect(result.resultsByChain.get(1)).toBe(allowResult1);
            expect(result.resultsByChain.get(10)).toBe(allowResult10);
        });
    });

    describe("forToken()", () => {
        it("returns a bound ERC20Token", () => {
            const { impl } = createTestImpl();

            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .onChain(10 as const, TOKEN_OP)
                .build();

            const bound = impl.forToken(definition);

            expect(bound.symbol).toBe("USDC");
            expect(bound.name).toBe("USD Coin");
            expect(bound.decimals).toBe(6);
            expect(bound.chainIds).toContain(1);
            expect(bound.chainIds).toContain(10);
        });

        it("only includes overlapping chains", () => {
            const { impl } = createTestImpl();

            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .onChain(42161 as const, "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address)
                .build();

            const bound = impl.forToken(definition as unknown as ITokenDefinition<1>);

            expect(bound.chainIds).toContain(1);
            expect(bound.chainIds).not.toContain(42161);
            expect(bound.chainIds).toHaveLength(1);
        });

        it("throws when no overlapping chains", () => {
            const { impl } = createTestImpl();

            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(42161 as const, "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address)
                .build();

            expect(() => impl.forToken(definition as unknown as ITokenDefinition<1 | 10>)).toThrow(
                "No overlapping chains",
            );
        });

        it("throws when definition lacks name or decimals", () => {
            const { impl } = createTestImpl();

            const definition = defineToken("USDC")
                .onChain(1 as const, TOKEN)
                .build();

            expect(() => impl.forToken(definition)).toThrow("must have name and decimals");
        });

        it("reuses configured read clients in bound-token flow", async () => {
            const pc1 = mockPublicClient(1);
            const customErrorAbi = [
                {
                    type: "error",
                    name: "CustomTokenError",
                    inputs: [{ name: "code", type: "uint256" }],
                },
            ] as const;
            const client = createERC20MultichainClient([pc1], { customErrorAbi });
            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .build();

            const reusedGetBalance = vi.fn().mockResolvedValue({
                token: { address: TOKEN, chainId: 1 },
                holder: HOLDER,
                balance: 123n,
            });
            client.getClient(1).getBalance = reusedGetBalance;

            const bound = client.forToken(definition);
            const result = await bound.getBalance(HOLDER, [1]);

            expect(reusedGetBalance).toHaveBeenCalledWith(TOKEN, HOLDER);
            expect(result.resultsByChain.get(1)).toEqual({
                token: { address: TOKEN, chainId: 1 },
                holder: HOLDER,
                balance: 123n,
            });
        });

        it("preserves default multicall batch size in bound-token flow", async () => {
            const multicall = vi.fn().mockResolvedValue([{ status: "success", result: 100n }]);
            const pc1 = mockPublicClient(1, vi.fn(), multicall);
            const client = createERC20MultichainClient([pc1], {
                defaultMulticallBatchSize: 321,
            });
            const definition = defineToken("USDC", { name: "USD Coin", decimals: 6 })
                .onChain(1 as const, TOKEN)
                .build();

            const bound = client.forToken(definition);
            await bound.getBalances([HOLDER], [1]);

            expect(multicall).toHaveBeenCalledWith(expect.objectContaining({ batchSize: 321 }));
        });
    });
});

describe("createERC20MultichainClient", () => {
    it("creates from PublicClient array", () => {
        const pc1 = mockPublicClient(1);
        const pc10 = mockPublicClient(10);

        const client = createERC20MultichainClient([pc1, pc10]);

        expect(client.chainIds).toContain(1);
        expect(client.chainIds).toContain(10);
        expect(client.hasChain(1)).toBe(true);
        expect(client.hasChain(10)).toBe(true);
        expect(client.hasChain(137)).toBe(false);
    });

    it("getClient returns working read clients", () => {
        const pc1 = mockPublicClient(1);
        const client = createERC20MultichainClient([pc1]);

        const readClient = client.getClient(1);
        expect(readClient.chainId).toBe(1);
    });
});
