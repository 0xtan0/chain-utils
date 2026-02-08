import type { Abi, Address } from "viem";
import { ContractClient, createContractClient } from "@/client/contractClient.js";
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
    {
        type: "function",
        name: "totalSupply",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
] as const satisfies Abi;

const TEST_ADDRESS: Address = "0x1111111111111111111111111111111111111111";
const OTHER_ADDRESS: Address = "0x2222222222222222222222222222222222222222";

describe("ContractClient", () => {
    describe("constructor", () => {
        it("sets chainId from publicClient", () => {
            const chain = mockChainWithMulticall(1);
            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: mockPublicClient(chain),
            });

            expect(client.chainId).toBe(1);
        });

        it("detects multicall support from chain.contracts.multicall3", () => {
            const withMulticall = new ContractClient({
                abi: TEST_ABI,
                publicClient: mockPublicClient(mockChainWithMulticall(1)),
            });

            expect(withMulticall.supportsMulticall).toBe(true);
        });

        it("detects absence of multicall support", () => {
            const withoutMulticall = new ContractClient({
                abi: TEST_ABI,
                publicClient: mockPublicClient(mockChainWithoutMulticall(1)),
            });

            expect(withoutMulticall.supportsMulticall).toBe(false);
        });

        it("stores abi", () => {
            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: mockPublicClient(mockChainWithMulticall(1)),
            });

            expect(client.abi).toBe(TEST_ABI);
        });

        it("stores walletClient when provided", () => {
            const walletClient = {} as never;
            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: mockPublicClient(mockChainWithMulticall(1)),
                walletClient,
            });

            expect(client.walletClient).toBe(walletClient);
        });

        it("leaves walletClient undefined when not provided", () => {
            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: mockPublicClient(mockChainWithMulticall(1)),
            });

            expect(client.walletClient).toBeUndefined();
        });
    });

    describe("read", () => {
        it("delegates to publicClient.readContract with correct params", async () => {
            const readContract = vi.fn().mockResolvedValue(1000n);
            const pc = mockPublicClient(mockChainWithMulticall(1), { readContract });

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
            const result = await client.read(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS]);

            expect(result).toBe(1000n);
            expect(readContract).toHaveBeenCalledWith({
                abi: TEST_ABI,
                address: TEST_ADDRESS,
                functionName: "balanceOf",
                args: [OTHER_ADDRESS],
            });
        });

        it("calls readContract without args when args is undefined", async () => {
            const readContract = vi.fn().mockResolvedValue(5000n);
            const pc = mockPublicClient(mockChainWithMulticall(1), { readContract });

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
            const result = await client.read(TEST_ADDRESS, "totalSupply");

            expect(result).toBe(5000n);
            expect(readContract).toHaveBeenCalledWith({
                abi: TEST_ABI,
                address: TEST_ADDRESS,
                functionName: "totalSupply",
                args: [],
            });
        });

        it("propagates errors from readContract", async () => {
            const readContract = vi.fn().mockRejectedValue(new Error("rpc error"));
            const pc = mockPublicClient(mockChainWithMulticall(1), { readContract });

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });

            await expect(client.read(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS])).rejects.toThrow(
                "rpc error",
            );
        });
    });

    describe("readBatch", () => {
        const calls = [
            { address: TEST_ADDRESS, functionName: "balanceOf", args: [OTHER_ADDRESS] },
            { address: TEST_ADDRESS, functionName: "totalSupply" },
        ] as const;

        describe("with multicall support", () => {
            it("uses publicClient.multicall with allowFailure: true", async () => {
                const multicall = vi.fn().mockResolvedValue([
                    { status: "success", result: 1000n },
                    { status: "success", result: 5000n },
                ]);
                const pc = mockPublicClient(mockChainWithMulticall(1), { multicall });

                const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
                const batch = await client.readBatch(calls);

                expect(multicall).toHaveBeenCalledWith({
                    contracts: [
                        {
                            abi: TEST_ABI,
                            address: TEST_ADDRESS,
                            functionName: "balanceOf",
                            args: [OTHER_ADDRESS],
                        },
                        {
                            abi: TEST_ABI,
                            address: TEST_ADDRESS,
                            functionName: "totalSupply",
                            args: undefined,
                        },
                    ],
                    allowFailure: true,
                });
                expect(batch.chainId).toBe(1);
                expect(batch.results).toEqual([
                    { status: "success", result: 1000n },
                    { status: "success", result: 5000n },
                ]);
            });

            it("maps multicall failures to MulticallItemResult failure", async () => {
                const error = new Error("execution reverted");
                const multicall = vi.fn().mockResolvedValue([
                    { status: "success", result: 1000n },
                    { status: "failure", error },
                ]);
                const pc = mockPublicClient(mockChainWithMulticall(1), { multicall });

                const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
                const batch = await client.readBatch(calls);

                expect(batch.results[0]).toEqual({ status: "success", result: 1000n });
                expect(batch.results[1]).toEqual({ status: "failure", error });
            });

            it("passes multicallBatchSize when configured", async () => {
                const multicall = vi.fn().mockResolvedValue([{ status: "success", result: 1000n }]);
                const pc = mockPublicClient(mockChainWithMulticall(1), { multicall });

                const client = new ContractClient({
                    abi: TEST_ABI,
                    publicClient: pc,
                    multicallBatchSize: 512,
                });
                await client.readBatch([calls[0]]);

                expect(multicall).toHaveBeenCalledWith(expect.objectContaining({ batchSize: 512 }));
            });
        });

        describe("without multicall support (sequential fallback)", () => {
            it("uses Promise.allSettled with readContract", async () => {
                const readContract = vi
                    .fn()
                    .mockResolvedValueOnce(1000n)
                    .mockResolvedValueOnce(5000n);
                const pc = mockPublicClient(mockChainWithoutMulticall(1), { readContract });

                const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
                const batch = await client.readBatch(calls);

                expect(readContract).toHaveBeenCalledTimes(2);
                expect(batch.chainId).toBe(1);
                expect(batch.results).toEqual([
                    { status: "success", result: 1000n },
                    { status: "success", result: 5000n },
                ]);
            });

            it("maps rejected calls to MulticallItemResult failure", async () => {
                const error = new Error("rpc error");
                const readContract = vi
                    .fn()
                    .mockResolvedValueOnce(1000n)
                    .mockRejectedValueOnce(error);
                const pc = mockPublicClient(mockChainWithoutMulticall(1), { readContract });

                const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
                const batch = await client.readBatch(calls);

                expect(batch.results[0]).toEqual({ status: "success", result: 1000n });
                expect(batch.results[1]).toEqual({ status: "failure", error });
            });

            it("wraps non-Error rejections in an Error", async () => {
                const readContract = vi.fn().mockRejectedValueOnce("string rejection");
                const pc = mockPublicClient(mockChainWithoutMulticall(1), { readContract });

                const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
                const batch = await client.readBatch([calls[0]]);

                expect(batch.results).toHaveLength(1);
                expect(batch.results[0]?.status).toBe("failure");
                expect(
                    batch.results[0]?.status === "failure" && batch.results[0].error.message,
                ).toBe("string rejection");
            });

            it("does not call multicall", async () => {
                const multicall = vi.fn();
                const readContract = vi.fn().mockResolvedValue(0n);
                const pc = mockPublicClient(mockChainWithoutMulticall(1), {
                    multicall,
                    readContract,
                });

                const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
                await client.readBatch([calls[0]]);

                expect(multicall).not.toHaveBeenCalled();
            });
        });

        it("returns empty results for empty calls array", async () => {
            const pc = mockPublicClient(mockChainWithMulticall(1), {
                multicall: vi.fn().mockResolvedValue([]),
            });

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
            const batch = await client.readBatch([]);

            expect(batch.results).toEqual([]);
            expect(batch.chainId).toBe(1);
        });
    });
});

describe("createContractClient", () => {
    it("returns a ContractClient instance", () => {
        const pc = mockPublicClient(mockChainWithMulticall(1));

        const client = createContractClient({ abi: TEST_ABI, publicClient: pc });

        expect(client).toBeInstanceOf(ContractClient);
        expect(client.chainId).toBe(1);
    });
});
