import type { IERC721WriteClient } from "@/types/index.js";
import type { Address, Chain, Hash, Hex, PublicClient, Transport, WalletClient } from "viem";
import { ERC721WriteClient } from "@/client/erc721WriteClient.js";
import { ERC721CollectionWriter } from "@/collections/index.js";
import { describe, expect, it, vi } from "vitest";

const COLLECTION = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const OWNER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
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
        readContract: vi.fn().mockResolvedValue(OWNER),
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

function createWriterDelegationHarness(): {
    writer: ERC721CollectionWriter;
    calls: {
        prepareApprove: ReturnType<typeof vi.fn>;
        prepareSetApprovalForAll: ReturnType<typeof vi.fn>;
        prepareTransferFrom: ReturnType<typeof vi.fn>;
        prepareSafeTransferFrom: ReturnType<typeof vi.fn>;
        signTransaction: ReturnType<typeof vi.fn>;
        sendTransaction: ReturnType<typeof vi.fn>;
        waitForReceipt: ReturnType<typeof vi.fn>;
        approve: ReturnType<typeof vi.fn>;
        setApprovalForAll: ReturnType<typeof vi.fn>;
        transferFrom: ReturnType<typeof vi.fn>;
        safeTransferFrom: ReturnType<typeof vi.fn>;
    };
} {
    const calls = {
        supportsInterface: vi.fn(),
        getCollectionMetadata: vi.fn(),
        getOwnerOf: vi.fn(),
        getBalance: vi.fn(),
        getApproved: vi.fn(),
        isApprovedForAll: vi.fn(),
        getTokenURI: vi.fn(),
        getTotalSupply: vi.fn(),
        getTokenByIndex: vi.fn(),
        getTokenOfOwnerByIndex: vi.fn(),
        getOwners: vi.fn(),
        getTokenURIs: vi.fn(),
        getApprovals: vi.fn(),
        getBalances: vi.fn(),
        getOperatorApprovals: vi.fn(),
        getInterfaceSupports: vi.fn(),
        getTotalSupplies: vi.fn(),
        getTokenByIndexes: vi.fn(),
        getTokenOfOwnerByIndexes: vi.fn(),
        prepareApprove: vi.fn(),
        prepareSetApprovalForAll: vi.fn(),
        prepareTransferFrom: vi.fn(),
        prepareSafeTransferFrom: vi.fn(),
        signTransaction: vi.fn(),
        sendTransaction: vi.fn(),
        waitForReceipt: vi.fn(),
        approve: vi.fn(),
        setApprovalForAll: vi.fn(),
        transferFrom: vi.fn(),
        safeTransferFrom: vi.fn(),
        forCollection: vi.fn(),
    };

    const writeClient = {
        contract: {} as IERC721WriteClient["contract"],
        chainId: 1,
        supportsMulticall: true,
        ...calls,
    } as unknown as IERC721WriteClient;

    return {
        writer: ERC721CollectionWriter.fromClient(
            writeClient,
            COLLECTION,
        ) as ERC721CollectionWriter,
        calls: {
            prepareApprove: calls.prepareApprove,
            prepareSetApprovalForAll: calls.prepareSetApprovalForAll,
            prepareTransferFrom: calls.prepareTransferFrom,
            prepareSafeTransferFrom: calls.prepareSafeTransferFrom,
            signTransaction: calls.signTransaction,
            sendTransaction: calls.sendTransaction,
            waitForReceipt: calls.waitForReceipt,
            approve: calls.approve,
            setApprovalForAll: calls.setApprovalForAll,
            transferFrom: calls.transferFrom,
            safeTransferFrom: calls.safeTransferFrom,
        },
    };
}

describe("ERC721CollectionWriter", () => {
    it("supports direct options constructor", () => {
        const writer = new ERC721CollectionWriter({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1)),
            walletClient: mockWalletClient(),
        });

        expect(writer.collection).toBe(COLLECTION);
        expect(writer.chainId).toBe(1);
    });

    it("supports fromClient binding", () => {
        const writeClient = new ERC721WriteClient({
            client: mockPublicClient(mockChain(1)),
            walletClient: mockWalletClient(),
        });

        const writer = ERC721CollectionWriter.fromClient(writeClient, COLLECTION);

        expect(writer.collection).toBe(COLLECTION);
        expect(writer.chainId).toBe(writeClient.chainId);
    });

    it("inherits bound read methods", async () => {
        const writer = new ERC721CollectionWriter({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1)),
            walletClient: mockWalletClient(),
        });

        const owner = await writer.getOwnerOf(1n);
        expect(owner.owner).toBe(OWNER);
    });

    it("binds collection address for prepareTransferFrom", async () => {
        const simulateContract = vi.fn().mockResolvedValue({ request: {} });
        const writer = new ERC721CollectionWriter({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1), { simulateContract }),
            walletClient: mockWalletClient(),
        });

        await writer.prepareTransferFrom(OWNER, RECIPIENT, 1n);

        expect(simulateContract).toHaveBeenCalledWith(
            expect.objectContaining({
                address: COLLECTION,
                functionName: "transferFrom",
                args: [OWNER, RECIPIENT, 1n],
            }),
        );
    });

    it("runs approve with bound collection", async () => {
        const writer = new ERC721CollectionWriter({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1)),
            walletClient: mockWalletClient(),
        });

        const result = await writer.approve(RECIPIENT, 1n);

        expect(result).toBe(TX_HASH);
    });

    it("delegates sign/send/wait lifecycle methods", async () => {
        const sendRawTransaction = vi.fn().mockResolvedValue(TX_HASH);
        const waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: "success" });
        const writer = new ERC721CollectionWriter({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1), {
                sendRawTransaction,
                waitForTransactionReceipt,
            }),
            walletClient: mockWalletClient(),
        });

        const signed = await writer.signTransaction({
            request: { to: COLLECTION, data: "0x1234" as Hex },
            gasEstimate: 50000n,
            chainId: 1,
        });
        const hash = await writer.sendTransaction(signed);
        await writer.waitForReceipt(hash);

        expect(hash).toBe(TX_HASH);
        expect(sendRawTransaction).toHaveBeenCalledTimes(1);
        expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH });
    });

    describe("delegates every writer method to bound write client", () => {
        it("delegates prepareApprove", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            const expected = {
                request: { to: COLLECTION, data: "0x12" },
                gasEstimate: 1n,
                chainId: 1,
            };
            calls.prepareApprove.mockResolvedValue(expected);

            await expect(writer.prepareApprove(RECIPIENT, 1n)).resolves.toBe(expected);
            expect(calls.prepareApprove).toHaveBeenCalledWith(COLLECTION, RECIPIENT, 1n);
        });

        it("delegates prepareSetApprovalForAll", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            const expected = {
                request: { to: COLLECTION, data: "0x12" },
                gasEstimate: 1n,
                chainId: 1,
            };
            calls.prepareSetApprovalForAll.mockResolvedValue(expected);

            await expect(writer.prepareSetApprovalForAll(RECIPIENT, true)).resolves.toBe(expected);
            expect(calls.prepareSetApprovalForAll).toHaveBeenCalledWith(
                COLLECTION,
                RECIPIENT,
                true,
            );
        });

        it("delegates prepareTransferFrom", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            const expected = {
                request: { to: COLLECTION, data: "0x12" },
                gasEstimate: 1n,
                chainId: 1,
            };
            calls.prepareTransferFrom.mockResolvedValue(expected);

            await expect(writer.prepareTransferFrom(OWNER, RECIPIENT, 1n)).resolves.toBe(expected);
            expect(calls.prepareTransferFrom).toHaveBeenCalledWith(
                COLLECTION,
                OWNER,
                RECIPIENT,
                1n,
            );
        });

        it("delegates prepareSafeTransferFrom", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            const expected = {
                request: { to: COLLECTION, data: "0x12" },
                gasEstimate: 1n,
                chainId: 1,
            };
            calls.prepareSafeTransferFrom.mockResolvedValue(expected);

            await expect(
                writer.prepareSafeTransferFrom(OWNER, RECIPIENT, 1n, "0x1234"),
            ).resolves.toBe(expected);
            expect(calls.prepareSafeTransferFrom).toHaveBeenCalledWith(
                COLLECTION,
                OWNER,
                RECIPIENT,
                1n,
                "0x1234",
            );
        });

        it("delegates signTransaction", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            const prepared = {
                request: { to: COLLECTION, data: "0x1234" as Hex },
                gasEstimate: 5n,
                chainId: 1,
            };
            const signed = { serialized: "0xsigned", chainId: 1 };
            calls.signTransaction.mockResolvedValue(signed);

            await expect(writer.signTransaction(prepared)).resolves.toBe(signed);
            expect(calls.signTransaction).toHaveBeenCalledWith(prepared);
        });

        it("delegates sendTransaction", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            const signed = { serialized: "0xsigned" as Hex, chainId: 1 };
            calls.sendTransaction.mockResolvedValue(TX_HASH);

            await expect(writer.sendTransaction(signed)).resolves.toBe(TX_HASH);
            expect(calls.sendTransaction).toHaveBeenCalledWith(signed);
        });

        it("delegates waitForReceipt", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            const receipt = { status: "success" };
            calls.waitForReceipt.mockResolvedValue(receipt);

            await expect(writer.waitForReceipt(TX_HASH)).resolves.toBe(receipt);
            expect(calls.waitForReceipt).toHaveBeenCalledWith(TX_HASH);
        });

        it("delegates approve", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            calls.approve.mockResolvedValue(TX_HASH);

            await expect(writer.approve(RECIPIENT, 2n)).resolves.toBe(TX_HASH);
            expect(calls.approve).toHaveBeenCalledWith(COLLECTION, RECIPIENT, 2n, undefined);
        });

        it("delegates setApprovalForAll", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            calls.setApprovalForAll.mockResolvedValue(TX_HASH);

            await expect(writer.setApprovalForAll(RECIPIENT, true)).resolves.toBe(TX_HASH);
            expect(calls.setApprovalForAll).toHaveBeenCalledWith(
                COLLECTION,
                RECIPIENT,
                true,
                undefined,
            );
        });

        it("delegates transferFrom", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            calls.transferFrom.mockResolvedValue(TX_HASH);

            await expect(writer.transferFrom(OWNER, RECIPIENT, 3n)).resolves.toBe(TX_HASH);
            expect(calls.transferFrom).toHaveBeenCalledWith(
                COLLECTION,
                OWNER,
                RECIPIENT,
                3n,
                undefined,
            );
        });

        it("delegates safeTransferFrom", async () => {
            const { writer, calls } = createWriterDelegationHarness();
            calls.safeTransferFrom.mockResolvedValue(TX_HASH);

            await expect(writer.safeTransferFrom(OWNER, RECIPIENT, 4n, "0xabcd")).resolves.toBe(
                TX_HASH,
            );
            expect(calls.safeTransferFrom).toHaveBeenCalledWith(
                COLLECTION,
                OWNER,
                RECIPIENT,
                4n,
                "0xabcd",
                undefined,
            );
        });
    });
});
