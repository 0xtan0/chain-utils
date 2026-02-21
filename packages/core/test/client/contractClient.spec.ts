import type { ErrorDecoder } from "@/decoder/errorDecoder.js";
import type { Abi, Address, Hash, Hex, WalletClient } from "viem";
import { ContractClient, createContractClient } from "@/client/contractClient.js";
import { ChainUtilsFault } from "@/errors/base.js";
import { ContractReverted } from "@/errors/revert.js";
import { BaseError } from "viem";
import { describe, expect, it, vi } from "vitest";

import {
    mockChainWithMulticall,
    mockChainWithoutMulticall,
    mockPublicClient,
} from "../mocks/publicClient.js";

function mockWalletClient(overrides?: Partial<WalletClient>): WalletClient {
    return {
        account: {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            type: "local",
        },
        signTransaction: vi.fn(),
        ...overrides,
    } as unknown as WalletClient;
}

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

    describe("prepare", () => {
        it("simulates the contract call and returns a PreparedTransaction", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(21000n);
            const pc = mockPublicClient(mockChainWithMulticall(1), {
                simulateContract,
                estimateGas,
            });
            const wc = mockWalletClient();

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                walletClient: wc,
            });
            const prepared = await client.prepare(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS]);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    abi: TEST_ABI,
                    address: TEST_ADDRESS,
                    functionName: "balanceOf",
                    args: [OTHER_ADDRESS],
                }),
            );
            expect(prepared.gasEstimate).toBe(21000n);
            expect(prepared.chainId).toBe(1);
            expect(prepared.request.to).toBe(TEST_ADDRESS);
            expect(prepared.request.data).toBeDefined();
        });

        it("throws the original error when simulation fails without errorDecoder", async () => {
            const simulateContract = vi.fn().mockRejectedValue(new Error("revert"));
            const pc = mockPublicClient(mockChainWithMulticall(1), { simulateContract });

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });

            await expect(
                client.prepare(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS]),
            ).rejects.toThrow("revert");
        });

        it("decodes revert data through errorDecoder when simulation fails", async () => {
            const rawData: Hex = "0xdeadbeef";
            const causeWithData = Object.assign(new BaseError("inner revert"), { data: rawData });
            const outerError = new BaseError("revert", { cause: causeWithData });
            const simulateContract = vi.fn().mockRejectedValue(outerError);
            const pc = mockPublicClient(mockChainWithMulticall(1), { simulateContract });

            const decoded = new ContractReverted({
                rawData,
                decodedMessage: "Insufficient balance",
            });
            const errorDecoder: ErrorDecoder = { decode: vi.fn().mockReturnValue(decoded) };

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                errorDecoder,
            });

            await expect(client.prepare(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS])).rejects.toBe(
                decoded,
            );
            expect(errorDecoder.decode).toHaveBeenCalledWith(rawData);
        });

        it("throws original error when errorDecoder returns null", async () => {
            const causeWithData = Object.assign(new BaseError("inner revert"), {
                data: "0xdeadbeef",
            });
            const innerError = new BaseError("revert", { cause: causeWithData });
            const simulateContract = vi.fn().mockRejectedValue(innerError);
            const pc = mockPublicClient(mockChainWithMulticall(1), { simulateContract });

            const errorDecoder: ErrorDecoder = { decode: vi.fn().mockReturnValue(null) };

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                errorDecoder,
            });

            await expect(client.prepare(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS])).rejects.toBe(
                innerError,
            );
        });

        it("throws original error when no revert data is found", async () => {
            const viemError = new BaseError("network error");
            const simulateContract = vi.fn().mockRejectedValue(viemError);
            const pc = mockPublicClient(mockChainWithMulticall(1), { simulateContract });

            const errorDecoder: ErrorDecoder = { decode: vi.fn() };

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                errorDecoder,
            });

            await expect(client.prepare(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS])).rejects.toBe(
                viemError,
            );
            expect(errorDecoder.decode).not.toHaveBeenCalled();
        });
    });

    describe("sign", () => {
        it("delegates to walletClient.signTransaction", async () => {
            const signTransaction = vi.fn().mockResolvedValue("0xsigned");
            const pc = mockPublicClient(mockChainWithMulticall(1));
            const wc = mockWalletClient({ signTransaction });

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                walletClient: wc,
            });

            const signed = await client.sign({
                request: { to: TEST_ADDRESS, data: "0x1234" },
                gasEstimate: 21000n,
                chainId: 1,
            });

            expect(signTransaction).toHaveBeenCalledWith(
                expect.objectContaining({ to: TEST_ADDRESS, data: "0x1234" }),
            );
            expect(signed.serialized).toBe("0xsigned");
            expect(signed.chainId).toBe(1);
        });

        it("throws ChainUtilsFault when prepared transaction chain does not match client chain", async () => {
            const signTransaction = vi.fn().mockResolvedValue("0xsigned");
            const pc = mockPublicClient(mockChainWithMulticall(1));
            const wc = mockWalletClient({ signTransaction });

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                walletClient: wc,
            });

            const signing = client.sign({
                request: { to: TEST_ADDRESS, data: "0x1234" },
                gasEstimate: 21000n,
                chainId: 10,
            });

            await expect(signing).rejects.toThrow(ChainUtilsFault);
            await expect(signing).rejects.toMatchObject({
                shortMessage: "Prepared transaction chain ID does not match client chain ID",
                metaMessages: ["Expected chain ID: 1", "Actual chain ID: 10"],
            });
            expect(signTransaction).not.toHaveBeenCalled();
        });

        it("throws ChainUtilsFault when walletClient is not provided", async () => {
            const pc = mockPublicClient(mockChainWithMulticall(1));

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });

            await expect(
                client.sign({
                    request: { to: TEST_ADDRESS },
                    gasEstimate: 21000n,
                    chainId: 1,
                }),
            ).rejects.toThrow(ChainUtilsFault);
        });

        it("throws ChainUtilsFault when walletClient has no account", async () => {
            const pc = mockPublicClient(mockChainWithMulticall(1));
            const wc = mockWalletClient({ account: undefined });

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                walletClient: wc,
            });

            await expect(
                client.sign({
                    request: { to: TEST_ADDRESS },
                    gasEstimate: 21000n,
                    chainId: 1,
                }),
            ).rejects.toThrow("account");
        });
    });

    describe("send", () => {
        it("calls sendRawTransaction with serialized transaction", async () => {
            const txHash: Hash =
                "0x000000000000000000000000000000000000000000000000000000000000abcd";
            const sendRawTransaction = vi.fn().mockResolvedValue(txHash);
            const pc = mockPublicClient(mockChainWithMulticall(1), { sendRawTransaction });

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
            const hash = await client.send({ serialized: "0xsigned", chainId: 1 });

            expect(sendRawTransaction).toHaveBeenCalledWith({
                serializedTransaction: "0xsigned",
            });
            expect(hash).toBe(txHash);
        });

        it("throws ChainUtilsFault when signed transaction chain does not match client chain", async () => {
            const sendRawTransaction = vi.fn();
            const pc = mockPublicClient(mockChainWithMulticall(1), { sendRawTransaction });

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
            const sending = client.send({ serialized: "0xsigned", chainId: 10 });

            await expect(sending).rejects.toThrow(ChainUtilsFault);
            await expect(sending).rejects.toMatchObject({
                shortMessage: "Signed transaction chain ID does not match client chain ID",
                metaMessages: ["Expected chain ID: 1", "Actual chain ID: 10"],
            });
            expect(sendRawTransaction).not.toHaveBeenCalled();
        });
    });

    describe("waitForReceipt", () => {
        it("calls waitForTransactionReceipt with hash", async () => {
            const receipt = { status: "success", blockNumber: 100n };
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const pc = mockPublicClient(mockChainWithMulticall(1), { waitForTransactionReceipt });
            const txHash: Hash =
                "0x000000000000000000000000000000000000000000000000000000000000abcd";

            const client = new ContractClient({ abi: TEST_ABI, publicClient: pc });
            const result = await client.waitForReceipt(txHash);

            expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: txHash });
            expect(result).toBe(receipt);
        });
    });

    describe("execute", () => {
        it("runs the full pipeline and returns hash by default", async () => {
            const txHash: Hash =
                "0x000000000000000000000000000000000000000000000000000000000000abcd";
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(21000n);
            const sendRawTransaction = vi.fn().mockResolvedValue(txHash);
            const signTransaction = vi.fn().mockResolvedValue("0xsigned");

            const pc = mockPublicClient(mockChainWithMulticall(1), {
                simulateContract,
                estimateGas,
                sendRawTransaction,
            });
            const wc = mockWalletClient({ signTransaction });

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                walletClient: wc,
            });
            const result = await client.execute(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS]);

            expect(result).toBe(txHash);
            expect(simulateContract).toHaveBeenCalled();
            expect(signTransaction).toHaveBeenCalled();
            expect(sendRawTransaction).toHaveBeenCalled();
        });

        it("waits for receipt when waitForReceipt option is true", async () => {
            const txHash: Hash =
                "0x000000000000000000000000000000000000000000000000000000000000abcd";
            const receipt = { status: "success", blockNumber: 100n };
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(21000n);
            const sendRawTransaction = vi.fn().mockResolvedValue(txHash);
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const signTransaction = vi.fn().mockResolvedValue("0xsigned");

            const pc = mockPublicClient(mockChainWithMulticall(1), {
                simulateContract,
                estimateGas,
                sendRawTransaction,
                waitForTransactionReceipt,
            });
            const wc = mockWalletClient({ signTransaction });

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                walletClient: wc,
            });
            const result = await client.execute(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS], {
                waitForReceipt: true,
            });

            expect(result).toBe(receipt);
            expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: txHash });
        });

        it("does not wait for receipt when waitForReceipt is false", async () => {
            const txHash: Hash =
                "0x000000000000000000000000000000000000000000000000000000000000abcd";
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(21000n);
            const sendRawTransaction = vi.fn().mockResolvedValue(txHash);
            const waitForTransactionReceipt = vi.fn();
            const signTransaction = vi.fn().mockResolvedValue("0xsigned");

            const pc = mockPublicClient(mockChainWithMulticall(1), {
                simulateContract,
                estimateGas,
                sendRawTransaction,
                waitForTransactionReceipt,
            });
            const wc = mockWalletClient({ signTransaction });

            const client = new ContractClient({
                abi: TEST_ABI,
                publicClient: pc,
                walletClient: wc,
            });
            await client.execute(TEST_ADDRESS, "balanceOf", [OTHER_ADDRESS], {
                waitForReceipt: false,
            });

            expect(waitForTransactionReceipt).not.toHaveBeenCalled();
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
