import type { Abi, Address } from "viem";
import { ContractClient } from "@/client/contractClient.js";
import { MultichainClient } from "@/client/multichainClient.js";
import { createMultichainContract, MultichainContract } from "@/client/multichainContract.js";
import { UnsupportedChain } from "@/errors/chain.js";
import { http } from "viem";
import { mainnet, optimism } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import {
    mockChainWithMulticall,
    mockChainWithoutMulticall,
    mockPublicClient,
} from "../mocks/publicClient.js";

const TEST_ABI = [
    {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
] as const satisfies Abi;

const TEST_ADDRESS: Address = "0x1111111111111111111111111111111111111111";

function buildMultichainContract(
    chainIds: number[],
    overrides?: Record<number, Partial<ContractClient<typeof TEST_ABI>>>,
): MultichainContract<typeof TEST_ABI, number> {
    const mcMap = new Map<number, ReturnType<typeof mockPublicClient>>();
    const ccMap = new Map<number, ContractClient<typeof TEST_ABI>>();

    for (const chainId of chainIds) {
        const chain = mockChainWithMulticall(chainId);
        const pc = mockPublicClient(chain);
        mcMap.set(chainId, pc);

        const cc = new ContractClient({ abi: TEST_ABI, publicClient: pc });
        if (overrides?.[chainId]) {
            Object.assign(cc, overrides[chainId]);
        }
        ccMap.set(chainId, cc);
    }

    const multichainClient = new MultichainClient(mcMap);
    return new MultichainContract(multichainClient, ccMap, { abi: TEST_ABI });
}

describe("MultichainContract", () => {
    describe("getClient", () => {
        it("returns the correct ContractClient for a configured chain", () => {
            const mc = buildMultichainContract([1, 10]);

            const client1 = mc.getClient(1);
            const client10 = mc.getClient(10);

            expect(client1).toBeInstanceOf(ContractClient);
            expect(client1.chainId).toBe(1);
            expect(client10.chainId).toBe(10);
        });

        it("throws UnsupportedChain for unconfigured chains", () => {
            const mc = buildMultichainContract([1]);

            expect(() => mc.getClient(42161)).toThrow(UnsupportedChain);
        });

        it("includes available chain IDs in UnsupportedChain error", () => {
            const mc = buildMultichainContract([1, 10]);

            try {
                mc.getClient(999);
                expect.unreachable("should have thrown");
            } catch (e) {
                expect(e).toBeInstanceOf(UnsupportedChain);
                expect((e as UnsupportedChain).availableChainIds).toEqual([1, 10]);
            }
        });
    });

    describe("hasChain", () => {
        it("returns true for configured chains", () => {
            const mc = buildMultichainContract([1, 10]);

            expect(mc.hasChain(1)).toBe(true);
            expect(mc.hasChain(10)).toBe(true);
        });

        it("returns false for unconfigured chains", () => {
            const mc = buildMultichainContract([1]);

            expect(mc.hasChain(42161)).toBe(false);
        });
    });

    describe("chainIds", () => {
        it("exposes all configured chain IDs", () => {
            const mc = buildMultichainContract([1, 10, 8453]);

            expect(mc.chainIds).toEqual([1, 10, 8453]);
        });
    });

    describe("withChain", () => {
        it("returns a new MultichainContract with the added chain", () => {
            const mc = buildMultichainContract([1]);
            const newPc = mockPublicClient(mockChainWithMulticall(10));

            const extended = mc.withChain(newPc);

            expect(extended.hasChain(1)).toBe(true);
            expect(extended.hasChain(10)).toBe(true);
            expect(extended.chainIds).toEqual([1, 10]);
        });

        it("does not mutate the original instance", () => {
            const mc = buildMultichainContract([1]);
            const newPc = mockPublicClient(mockChainWithMulticall(10));

            mc.withChain(newPc);

            expect(mc.hasChain(10)).toBe(false);
            expect(mc.chainIds).toEqual([1]);
        });

        it("creates a ContractClient for the new chain", () => {
            const mc = buildMultichainContract([1]);
            const newPc = mockPublicClient(mockChainWithMulticall(10));

            const extended = mc.withChain(newPc);

            const newClient = extended.getClient(10);
            expect(newClient).toBeInstanceOf(ContractClient);
            expect(newClient.chainId).toBe(10);
        });

        it("applies multicallAddress override when adding a ChainTransportConfig", () => {
            const mc = buildMultichainContract([1]);
            const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11";

            const extended = mc.withChain({
                chain: mockChainWithoutMulticall(10),
                transport: http(),
                multicallAddress,
            });

            const client = extended.getClient(10);
            const chain = extended.multichainClient.getPublicClient(10).chain;

            expect(client.supportsMulticall).toBe(true);
            expect(chain.contracts?.multicall3?.address).toBe(multicallAddress);
        });
    });

    describe("readAcrossChains", () => {
        it("dispatches reads to correct chains in parallel", async () => {
            const readBatch1 = vi.fn().mockResolvedValue({
                chainId: 1,
                results: [{ status: "success", result: 1000n }],
            });
            const readBatch10 = vi.fn().mockResolvedValue({
                chainId: 10,
                results: [{ status: "success", result: 2000n }],
            });

            const mc = buildMultichainContract([1, 10], {
                1: { readBatch: readBatch1 },
                10: { readBatch: readBatch10 },
            });

            const result = await mc.readAcrossChains([
                { chainId: 1, address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xabc"] },
                { chainId: 10, address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xdef"] },
            ]);

            expect(readBatch1).toHaveBeenCalledTimes(1);
            expect(readBatch10).toHaveBeenCalledTimes(1);
            expect(result.resultsByChain.get(1)?.results).toEqual([
                { status: "success", result: 1000n },
            ]);
            expect(result.resultsByChain.get(10)?.results).toEqual([
                { status: "success", result: 2000n },
            ]);
            expect(result.failedChains).toEqual([]);
        });

        it("groups multiple calls for the same chain", async () => {
            const readBatch = vi.fn().mockResolvedValue({
                chainId: 1,
                results: [
                    { status: "success", result: 100n },
                    { status: "success", result: 200n },
                ],
            });

            const mc = buildMultichainContract([1], { 1: { readBatch } });

            await mc.readAcrossChains([
                { chainId: 1, address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xaaa"] },
                { chainId: 1, address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xbbb"] },
            ]);

            expect(readBatch).toHaveBeenCalledTimes(1);
            expect(readBatch).toHaveBeenCalledWith([
                { address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xaaa"] },
                { address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xbbb"] },
            ]);
        });

        it("reports failed chains without throwing", async () => {
            const readBatch1 = vi.fn().mockResolvedValue({
                chainId: 1,
                results: [{ status: "success", result: 1000n }],
            });
            const readBatch10 = vi.fn().mockRejectedValue(new Error("rpc down"));

            const mc = buildMultichainContract([1, 10], {
                1: { readBatch: readBatch1 },
                10: { readBatch: readBatch10 },
            });

            const result = await mc.readAcrossChains([
                { chainId: 1, address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xabc"] },
                { chainId: 10, address: TEST_ADDRESS, functionName: "balanceOf", args: ["0xdef"] },
            ]);

            expect(result.resultsByChain.get(1)).toBeDefined();
            expect(result.failedChains).toHaveLength(1);
            expect(result.failedChains[0]?.chainId).toBe(10);
            expect(result.failedChains[0]?.error.message).toBe("rpc down");
        });

        it("returns empty results for empty calls array", async () => {
            const mc = buildMultichainContract([1]);

            const result = await mc.readAcrossChains([]);

            expect(result.resultsByChain.size).toBe(0);
            expect(result.failedChains).toEqual([]);
        });
    });
});

describe("createMultichainContract", () => {
    it("creates from a MultichainClient", () => {
        const pc1 = mockPublicClient(mockChainWithMulticall(1));
        const pc10 = mockPublicClient(mockChainWithMulticall(10));
        const multichainClient = new MultichainClient(
            new Map([
                [1, pc1],
                [10, pc10],
            ]),
        );

        const mc = createMultichainContract({
            abi: TEST_ABI,
            multichainClient,
        });

        expect(mc).toBeInstanceOf(MultichainContract);
        expect(mc.chainIds).toEqual([1, 10]);
        expect(mc.getClient(1).chainId).toBe(1);
    });

    it("creates from an array of PublicClients", () => {
        const pc1 = mockPublicClient(mockChainWithMulticall(1));
        const pc10 = mockPublicClient(mockChainWithMulticall(10));

        const mc = createMultichainContract({
            abi: TEST_ABI,
            clients: [pc1, pc10],
        });

        expect(mc).toBeInstanceOf(MultichainContract);
        expect(mc.chainIds).toEqual([1, 10]);
    });

    it("creates from an array of ChainTransportConfigs", () => {
        const mc = createMultichainContract({
            abi: TEST_ABI,
            configs: [
                { chain: mainnet, transport: http() },
                { chain: optimism, transport: http() },
            ],
        });

        expect(mc).toBeInstanceOf(MultichainContract);
        expect(mc.chainIds).toEqual([1, 10]);
    });

    it("applies multicallAddress override for config-based creation", () => {
        const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11";
        const mc = createMultichainContract({
            abi: TEST_ABI,
            configs: [
                {
                    chain: mockChainWithoutMulticall(11155111),
                    transport: http(),
                    multicallAddress,
                },
            ],
        });

        const client = mc.getClient(11155111);
        const chain = mc.multichainClient.getPublicClient(11155111).chain;

        expect(client.supportsMulticall).toBe(true);
        expect(chain.contracts?.multicall3?.address).toBe(multicallAddress);
    });

    it("keeps plain config-based creation behavior unchanged", () => {
        const mc = createMultichainContract({
            abi: TEST_ABI,
            configs: [{ chain: mockChainWithoutMulticall(11155111), transport: http() }],
        });

        const client = mc.getClient(11155111);
        const chain = mc.multichainClient.getPublicClient(11155111).chain;

        expect(client.supportsMulticall).toBe(false);
        expect(chain.contracts?.multicall3).toBeUndefined();
    });
});
