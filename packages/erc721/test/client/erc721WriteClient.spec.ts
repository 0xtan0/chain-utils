import type { ERC721WriteClientOptions } from "@/types/options.js";
import type { Address, Chain, Hash, Hex, PublicClient, Transport, WalletClient } from "viem";
import { erc721ErrorsAbi } from "@/abi/erc721ErrorsAbi.js";
import { ERC721CollectionWriter } from "@/client/erc721CollectionWriter.js";
import { createERC721WriteClient, ERC721WriteClient } from "@/client/erc721WriteClient.js";
import { InvalidAddress } from "@/errors/contract.js";
import { NonexistentToken } from "@/errors/revert.js";
import { BaseError, encodeErrorResult } from "viem";
import { describe, expect, it, vi } from "vitest";

const COLLECTION = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const OWNER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const OPERATOR = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" as Address;
const RECIPIENT = "0x742d35cc6634c0532925a3b844bc9e7595f2bd18" as Address;
const DATA = "0x1234" as Hex;

const TX_HASH: Hash = "0x000000000000000000000000000000000000000000000000000000000000abcd";

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
        simulateContract: vi.fn().mockResolvedValue({ request: {} }),
        estimateGas: vi.fn().mockResolvedValue(50000n),
        estimateFeesPerGas: vi.fn().mockResolvedValue({
            maxFeePerGas: 1000000000n,
            maxPriorityFeePerGas: 100000000n,
        }),
        getTransactionCount: vi.fn().mockResolvedValue(0),
        sendRawTransaction: vi.fn().mockResolvedValue(TX_HASH),
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
            status: "success",
            blockNumber: 100n,
        }),
        ...overrides,
    } as unknown as PublicClient<Transport, Chain>;
}

function mockWalletClient(overrides?: Partial<WalletClient>): WalletClient {
    return {
        account: {
            address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            type: "local",
        },
        signTransaction: vi.fn().mockResolvedValue("0xsigned"),
        ...overrides,
    } as unknown as WalletClient;
}

function createOptions(overrides?: Partial<ERC721WriteClientOptions>): ERC721WriteClientOptions {
    const chain = mockChain(1);
    return {
        client: mockPublicClient(chain),
        walletClient: mockWalletClient(),
        ...overrides,
    };
}

describe("ERC721WriteClient", () => {
    describe("construction", () => {
        it("exposes chainId, supportsMulticall, and contract", () => {
            const client = new ERC721WriteClient(createOptions());
            expect(client.chainId).toBe(1);
            expect(client.supportsMulticall).toBe(true);
            expect(client.contract).toBeDefined();
        });

        it("has wallet client on the underlying contract", () => {
            const wc = mockWalletClient();
            const client = new ERC721WriteClient(createOptions({ walletClient: wc }));
            expect(client.contract.walletClient).toBe(wc);
        });

        it("inherits read methods from ERC721ReadClient", async () => {
            const readContract = vi.fn().mockResolvedValueOnce(OWNER);
            const client = new ERC721WriteClient(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            const result = await client.getOwnerOf(COLLECTION, 1n);
            expect(result.owner).toBe(OWNER);
        });

        it("createERC721WriteClient factory returns an ERC721WriteClient", () => {
            const client = createERC721WriteClient(createOptions());
            expect(client.chainId).toBe(1);
        });

        it("forCollection returns ERC721CollectionWriter", () => {
            const client = new ERC721WriteClient(createOptions());
            const collection = client.forCollection(COLLECTION);

            expect(collection).toBeInstanceOf(ERC721CollectionWriter);
            expect(collection.collection).toBe(COLLECTION);
            expect(collection.chainId).toBe(client.chainId);
        });
    });

    describe("prepareApprove", () => {
        it("delegates to contract.prepare with correct args", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const prepared = await client.prepareApprove(COLLECTION, RECIPIENT, 1n);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: COLLECTION,
                    functionName: "approve",
                    args: [RECIPIENT, 1n],
                }),
            );
            expect(prepared.gasEstimate).toBe(50000n);
            expect(prepared.chainId).toBe(1);
        });

        it("throws InvalidAddress for invalid collection", async () => {
            const client = new ERC721WriteClient(createOptions());
            await expect(client.prepareApprove("bad" as Address, RECIPIENT, 1n)).rejects.toThrow(
                InvalidAddress,
            );
        });

        it("throws InvalidAddress for invalid recipient", async () => {
            const client = new ERC721WriteClient(createOptions());
            await expect(client.prepareApprove(COLLECTION, "bad" as Address, 1n)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("prepareSetApprovalForAll", () => {
        it("delegates to contract.prepare with correct args", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const prepared = await client.prepareSetApprovalForAll(COLLECTION, OPERATOR, true);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: COLLECTION,
                    functionName: "setApprovalForAll",
                    args: [OPERATOR, true],
                }),
            );
            expect(prepared.gasEstimate).toBe(50000n);
        });

        it("throws InvalidAddress for invalid operator", async () => {
            const client = new ERC721WriteClient(createOptions());
            await expect(
                client.prepareSetApprovalForAll(COLLECTION, "bad" as Address, true),
            ).rejects.toThrow(InvalidAddress);
        });
    });

    describe("prepareTransferFrom", () => {
        it("delegates to contract.prepare with correct args", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const prepared = await client.prepareTransferFrom(COLLECTION, OWNER, RECIPIENT, 1n);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: COLLECTION,
                    functionName: "transferFrom",
                    args: [OWNER, RECIPIENT, 1n],
                }),
            );
            expect(prepared.gasEstimate).toBe(50000n);
        });

        it("throws InvalidAddress for invalid from", async () => {
            const client = new ERC721WriteClient(createOptions());
            await expect(
                client.prepareTransferFrom(COLLECTION, "bad" as Address, RECIPIENT, 1n),
            ).rejects.toThrow(InvalidAddress);
        });

        it("throws InvalidAddress for invalid to", async () => {
            const client = new ERC721WriteClient(createOptions());
            await expect(
                client.prepareTransferFrom(COLLECTION, OWNER, "bad" as Address, 1n),
            ).rejects.toThrow(InvalidAddress);
        });
    });

    describe("prepareSafeTransferFrom", () => {
        it("delegates to contract.prepare without data", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const prepared = await client.prepareSafeTransferFrom(COLLECTION, OWNER, RECIPIENT, 1n);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: COLLECTION,
                    functionName: "safeTransferFrom",
                    args: [OWNER, RECIPIENT, 1n],
                }),
            );
            expect(prepared.gasEstimate).toBe(50000n);
        });

        it("delegates to contract.prepare with data", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            await client.prepareSafeTransferFrom(COLLECTION, OWNER, RECIPIENT, 1n, DATA);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: COLLECTION,
                    functionName: "safeTransferFrom",
                    args: [OWNER, RECIPIENT, 1n, DATA],
                }),
            );
        });
    });

    describe("signTransaction", () => {
        it("delegates to contract.sign", async () => {
            const signTransaction = vi.fn().mockResolvedValue("0xsigned");
            const wc = mockWalletClient({ signTransaction });
            const client = new ERC721WriteClient(createOptions({ walletClient: wc }));

            const prepared = {
                request: { to: COLLECTION, data: "0x1234" as Hex },
                gasEstimate: 50000n,
                chainId: 1,
            };
            const signed = await client.signTransaction(prepared);

            expect(signTransaction).toHaveBeenCalled();
            expect(signed.serialized).toBe("0xsigned");
            expect(signed.chainId).toBe(1);
        });
    });

    describe("sendTransaction", () => {
        it("delegates to contract.send", async () => {
            const sendRawTransaction = vi.fn().mockResolvedValue(TX_HASH);
            const pc = mockPublicClient(mockChain(1), { sendRawTransaction });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const hash = await client.sendTransaction({ serialized: "0xsigned", chainId: 1 });

            expect(sendRawTransaction).toHaveBeenCalledWith({
                serializedTransaction: "0xsigned",
            });
            expect(hash).toBe(TX_HASH);
        });
    });

    describe("waitForReceipt", () => {
        it("delegates to contract.waitForReceipt", async () => {
            const receipt = { status: "success", blockNumber: 100n };
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const pc = mockPublicClient(mockChain(1), { waitForTransactionReceipt });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const result = await client.waitForReceipt(TX_HASH);

            expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH });
            expect(result).toBe(receipt);
        });
    });

    describe("approve (convenience)", () => {
        it("runs full pipeline and returns hash by default", async () => {
            const client = new ERC721WriteClient(createOptions());
            const result = await client.approve(COLLECTION, RECIPIENT, 1n);

            expect(result).toBe(TX_HASH);
        });

        it("does not wait for receipt by default", async () => {
            const waitForTransactionReceipt = vi.fn().mockResolvedValue({
                status: "success",
                blockNumber: 100n,
            });
            const pc = mockPublicClient(mockChain(1), { waitForTransactionReceipt });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            await client.approve(COLLECTION, RECIPIENT, 1n);

            expect(waitForTransactionReceipt).not.toHaveBeenCalled();
        });

        it("returns receipt when waitForReceipt is true", async () => {
            const receipt = { status: "success", blockNumber: 100n };
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const pc = mockPublicClient(mockChain(1), { waitForTransactionReceipt });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const result = await client.approve(COLLECTION, RECIPIENT, 1n, {
                waitForReceipt: true,
            });

            expect(result).toBe(receipt);
            expect(waitForTransactionReceipt).toHaveBeenCalled();
        });

        it("validates addresses", async () => {
            const client = new ERC721WriteClient(createOptions());
            await expect(client.approve("bad" as Address, RECIPIENT, 1n)).rejects.toThrow(
                InvalidAddress,
            );
            await expect(client.approve(COLLECTION, "bad" as Address, 1n)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("transferFrom (convenience)", () => {
        it("runs full pipeline and returns hash by default", async () => {
            const client = new ERC721WriteClient(createOptions());
            const result = await client.transferFrom(COLLECTION, OWNER, RECIPIENT, 1n);

            expect(result).toBe(TX_HASH);
        });

        it("returns receipt when waitForReceipt is true", async () => {
            const receipt = { status: "success", blockNumber: 100n };
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const pc = mockPublicClient(mockChain(1), { waitForTransactionReceipt });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            const result = await client.transferFrom(COLLECTION, OWNER, RECIPIENT, 1n, {
                waitForReceipt: true,
            });

            expect(result).toBe(receipt);
        });

        it("validates addresses", async () => {
            const client = new ERC721WriteClient(createOptions());
            await expect(
                client.transferFrom("bad" as Address, OWNER, RECIPIENT, 1n),
            ).rejects.toThrow(InvalidAddress);
        });
    });

    describe("safeTransferFrom (convenience)", () => {
        it("runs full pipeline with data", async () => {
            const client = new ERC721WriteClient(createOptions());
            const result = await client.safeTransferFrom(COLLECTION, OWNER, RECIPIENT, 1n, DATA);

            expect(result).toBe(TX_HASH);
        });
    });

    describe("wallet client requirements", () => {
        it("throws when wallet client is missing", async () => {
            const client = new ERC721WriteClient(
                createOptions({ walletClient: undefined as unknown as WalletClient }),
            );

            await expect(
                client.signTransaction({
                    request: { to: COLLECTION, data: "0x1234" as Hex },
                    gasEstimate: 50000n,
                    chainId: 1,
                }),
            ).rejects.toThrow("WalletClient is required for write operations");
        });

        it("throws when wallet client has no account", async () => {
            const wc = mockWalletClient({ account: undefined });
            const client = new ERC721WriteClient(createOptions({ walletClient: wc }));

            await expect(
                client.signTransaction({
                    request: { to: COLLECTION, data: "0x1234" as Hex },
                    gasEstimate: 50000n,
                    chainId: 1,
                }),
            ).rejects.toThrow("WalletClient must have an account for signing");
        });
    });

    describe("revert decoding", () => {
        it("decodes ERC721NonexistentToken revert to typed error", async () => {
            const revertData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721NonexistentToken",
                args: [1n],
            });
            const causeWithData = Object.assign(new BaseError("inner"), {
                data: revertData,
            });
            const outerError = new BaseError("revert", { cause: causeWithData });
            const simulateContract = vi.fn().mockRejectedValue(outerError);
            const pc = mockPublicClient(mockChain(1), { simulateContract });
            const client = new ERC721WriteClient(createOptions({ client: pc }));

            await expect(client.prepareApprove(COLLECTION, RECIPIENT, 1n)).rejects.toThrow(
                NonexistentToken,
            );
        });
    });
});
