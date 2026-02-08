import type { ERC20WriteClientOptions } from "@/types/options.js";
import type { Address, Chain, Hash, PublicClient, Transport, WalletClient } from "viem";
import { erc20ErrorsAbi } from "@/abi/erc20ErrorsAbi.js";
import { createERC20WriteClient, ERC20WriteClientImpl } from "@/client/erc20WriteClient.js";
import { InvalidAddress } from "@/errors/contract.js";
import { InsufficientBalance } from "@/errors/revert.js";
import { BaseError, encodeErrorResult } from "viem";
import { describe, expect, it, vi } from "vitest";

const TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const HOLDER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const SPENDER = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" as Address;
const RECIPIENT = "0x742d35cc6634c0532925a3b844bc9e7595f2bd18" as Address;

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

function createOptions(overrides?: Partial<ERC20WriteClientOptions>): ERC20WriteClientOptions {
    const chain = mockChain(1);
    return {
        client: mockPublicClient(chain),
        walletClient: mockWalletClient(),
        ...overrides,
    };
}

describe("ERC20WriteClientImpl", () => {
    describe("construction", () => {
        it("exposes chainId, supportsMulticall, and contract", () => {
            const client = new ERC20WriteClientImpl(createOptions());
            expect(client.chainId).toBe(1);
            expect(client.supportsMulticall).toBe(true);
            expect(client.contract).toBeDefined();
        });

        it("has wallet client on the underlying contract", () => {
            const wc = mockWalletClient();
            const client = new ERC20WriteClientImpl(createOptions({ walletClient: wc }));
            expect(client.contract.walletClient).toBe(wc);
        });

        it("inherits read methods from ERC20ReadClient", async () => {
            const readContract = vi.fn().mockResolvedValueOnce(1000n);
            const client = new ERC20WriteClientImpl(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            const result = await client.getBalance(TOKEN, HOLDER);
            expect(result.balance).toBe(1000n);
        });

        it("createERC20WriteClient factory returns an ERC20WriteClientImpl", () => {
            const client = createERC20WriteClient(createOptions());
            expect(client.chainId).toBe(1);
        });
    });

    describe("prepareApprove", () => {
        it("delegates to contract.prepare with correct args", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            const prepared = await client.prepareApprove(TOKEN, SPENDER, 1000n);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: TOKEN,
                    functionName: "approve",
                    args: [SPENDER, 1000n],
                }),
            );
            expect(prepared.gasEstimate).toBe(50000n);
            expect(prepared.chainId).toBe(1);
        });

        it("throws InvalidAddress for invalid token", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(client.prepareApprove("bad" as Address, SPENDER, 1000n)).rejects.toThrow(
                InvalidAddress,
            );
        });

        it("throws InvalidAddress for invalid spender", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(client.prepareApprove(TOKEN, "bad" as Address, 1000n)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("prepareTransfer", () => {
        it("delegates to contract.prepare with correct args", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            const prepared = await client.prepareTransfer(TOKEN, RECIPIENT, 500n);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: TOKEN,
                    functionName: "transfer",
                    args: [RECIPIENT, 500n],
                }),
            );
            expect(prepared.gasEstimate).toBe(50000n);
        });

        it("throws InvalidAddress for invalid to address", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(client.prepareTransfer(TOKEN, "bad" as Address, 500n)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("prepareTransferFrom", () => {
        it("delegates to contract.prepare with correct args", async () => {
            const simulateContract = vi.fn().mockResolvedValue({ request: {} });
            const estimateGas = vi.fn().mockResolvedValue(50000n);
            const pc = mockPublicClient(mockChain(1), { simulateContract, estimateGas });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            const prepared = await client.prepareTransferFrom(TOKEN, HOLDER, RECIPIENT, 300n);

            expect(simulateContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: TOKEN,
                    functionName: "transferFrom",
                    args: [HOLDER, RECIPIENT, 300n],
                }),
            );
            expect(prepared.gasEstimate).toBe(50000n);
        });

        it("throws InvalidAddress for invalid from address", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(
                client.prepareTransferFrom(TOKEN, "bad" as Address, RECIPIENT, 300n),
            ).rejects.toThrow(InvalidAddress);
        });

        it("throws InvalidAddress for invalid to address", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(
                client.prepareTransferFrom(TOKEN, HOLDER, "bad" as Address, 300n),
            ).rejects.toThrow(InvalidAddress);
        });
    });

    describe("signTransaction", () => {
        it("delegates to contract.sign", async () => {
            const signTransaction = vi.fn().mockResolvedValue("0xsigned");
            const wc = mockWalletClient({ signTransaction });
            const client = new ERC20WriteClientImpl(createOptions({ walletClient: wc }));

            const prepared = {
                request: { to: TOKEN, data: "0x1234" as `0x${string}` },
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
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

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
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            const result = await client.waitForReceipt(TX_HASH);

            expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH });
            expect(result).toBe(receipt);
        });
    });

    describe("approve (convenience)", () => {
        it("runs full pipeline and returns hash by default", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            const result = await client.approve(TOKEN, SPENDER, 1000n);

            expect(result).toBe(TX_HASH);
        });

        it("returns receipt when waitForReceipt is true", async () => {
            const receipt = { status: "success", blockNumber: 100n };
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const pc = mockPublicClient(mockChain(1), { waitForTransactionReceipt });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            const result = await client.approve(TOKEN, SPENDER, 1000n, {
                waitForReceipt: true,
            });

            expect(result).toBe(receipt);
            expect(waitForTransactionReceipt).toHaveBeenCalled();
        });

        it("validates addresses", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(client.approve("bad" as Address, SPENDER, 1000n)).rejects.toThrow(
                InvalidAddress,
            );
            await expect(client.approve(TOKEN, "bad" as Address, 1000n)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("transfer (convenience)", () => {
        it("runs full pipeline and returns hash by default", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            const result = await client.transfer(TOKEN, RECIPIENT, 500n);

            expect(result).toBe(TX_HASH);
        });

        it("returns receipt when waitForReceipt is true", async () => {
            const receipt = { status: "success", blockNumber: 100n };
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const pc = mockPublicClient(mockChain(1), { waitForTransactionReceipt });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            const result = await client.transfer(TOKEN, RECIPIENT, 500n, {
                waitForReceipt: true,
            });

            expect(result).toBe(receipt);
        });

        it("validates addresses", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(client.transfer("bad" as Address, RECIPIENT, 500n)).rejects.toThrow(
                InvalidAddress,
            );
        });
    });

    describe("transferFrom (convenience)", () => {
        it("runs full pipeline and returns hash by default", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            const result = await client.transferFrom(TOKEN, HOLDER, RECIPIENT, 300n);

            expect(result).toBe(TX_HASH);
        });

        it("returns receipt when waitForReceipt is true", async () => {
            const receipt = { status: "success", blockNumber: 100n };
            const waitForTransactionReceipt = vi.fn().mockResolvedValue(receipt);
            const pc = mockPublicClient(mockChain(1), { waitForTransactionReceipt });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            const result = await client.transferFrom(TOKEN, HOLDER, RECIPIENT, 300n, {
                waitForReceipt: true,
            });

            expect(result).toBe(receipt);
        });

        it("validates addresses", async () => {
            const client = new ERC20WriteClientImpl(createOptions());
            await expect(
                client.transferFrom("bad" as Address, HOLDER, RECIPIENT, 300n),
            ).rejects.toThrow(InvalidAddress);
        });
    });

    describe("revert decoding", () => {
        it("decodes ERC20InsufficientBalance revert to typed error", async () => {
            const revertData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InsufficientBalance",
                args: [HOLDER, 100n, 200n],
            });
            const causeWithData = Object.assign(new BaseError("inner"), {
                data: revertData,
            });
            const outerError = new BaseError("revert", { cause: causeWithData });
            const simulateContract = vi.fn().mockRejectedValue(outerError);
            const pc = mockPublicClient(mockChain(1), { simulateContract });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            await expect(client.prepareApprove(TOKEN, SPENDER, 1000n)).rejects.toThrow(
                InsufficientBalance,
            );
        });

        it("decodes revert in convenience methods too", async () => {
            const revertData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InsufficientBalance",
                args: [HOLDER, 100n, 200n],
            });
            const causeWithData = Object.assign(new BaseError("inner"), {
                data: revertData,
            });
            const outerError = new BaseError("revert", { cause: causeWithData });
            const simulateContract = vi.fn().mockRejectedValue(outerError);
            const pc = mockPublicClient(mockChain(1), { simulateContract });
            const client = new ERC20WriteClientImpl(createOptions({ client: pc }));

            await expect(client.transfer(TOKEN, RECIPIENT, 500n)).rejects.toThrow(
                InsufficientBalance,
            );
        });
    });
});
