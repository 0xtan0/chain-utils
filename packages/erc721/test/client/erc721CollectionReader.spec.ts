import type { IERC721Read } from "@/types/index.js";
import type { Address, Chain, PublicClient, Transport } from "viem";
import { ERC721ReadClient } from "@/client/erc721ReadClient.js";
import { ERC721CollectionReader } from "@/collection/index.js";
import { describe, expect, it, vi } from "vitest";

const COLLECTION = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const OWNER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const OWNER_2 = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" as Address;

function mockChain(chainId: number, withMulticall = true): Chain {
    return {
        id: chainId,
        name: "test",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["http://localhost"] } },
        ...(withMulticall
            ? {
                  contracts: {
                      multicall3: {
                          address: "0xcA11bde05977b3631167028862bE2a173976CA11",
                      },
                  },
              }
            : {}),
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

function createDelegationHarness(): {
    reader: ERC721CollectionReader;
    calls: {
        supportsInterface: ReturnType<typeof vi.fn>;
        getCollectionMetadata: ReturnType<typeof vi.fn>;
        getOwnerOf: ReturnType<typeof vi.fn>;
        getBalance: ReturnType<typeof vi.fn>;
        getApproved: ReturnType<typeof vi.fn>;
        isApprovedForAll: ReturnType<typeof vi.fn>;
        getTokenURI: ReturnType<typeof vi.fn>;
        getTotalSupply: ReturnType<typeof vi.fn>;
        getTokenByIndex: ReturnType<typeof vi.fn>;
        getTokenOfOwnerByIndex: ReturnType<typeof vi.fn>;
        getOwners: ReturnType<typeof vi.fn>;
        getTokenURIs: ReturnType<typeof vi.fn>;
        getApprovals: ReturnType<typeof vi.fn>;
        getBalances: ReturnType<typeof vi.fn>;
        getOperatorApprovals: ReturnType<typeof vi.fn>;
        getInterfaceSupports: ReturnType<typeof vi.fn>;
        getTotalSupplies: ReturnType<typeof vi.fn>;
        getTokenByIndexes: ReturnType<typeof vi.fn>;
        getTokenOfOwnerByIndexes: ReturnType<typeof vi.fn>;
        forCollection: ReturnType<typeof vi.fn>;
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
        forCollection: vi.fn(),
    };

    const readClient = {
        contract: {} as IERC721Read["contract"],
        chainId: 1,
        supportsMulticall: true,
        ...calls,
    } as unknown as IERC721Read;

    return {
        reader: new ERC721CollectionReader({ collection: COLLECTION, readClient }),
        calls,
    };
}

describe("ERC721CollectionReader", () => {
    it("supports direct options constructor", () => {
        const reader = new ERC721CollectionReader({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1)),
        });

        expect(reader.collection).toBe(COLLECTION);
        expect(reader.chainId).toBe(1);
    });

    it("supports fromClient binding", () => {
        const readClient = new ERC721ReadClient({
            client: mockPublicClient(mockChain(1)),
        });

        const reader = ERC721CollectionReader.fromClient(readClient, COLLECTION);

        expect(reader.collection).toBe(COLLECTION);
        expect(reader.chainId).toBe(readClient.chainId);
    });

    it("maps bound tokenIds to owner queries and uses multicall", async () => {
        const multicall = vi
            .fn()
            .mockResolvedValue([{ status: "success", result: OWNER }] as const);
        const reader = new ERC721CollectionReader({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1), { multicall }),
        });

        const result = await reader.getOwners([1n]);

        expect(multicall).toHaveBeenCalledTimes(1);
        expect(result.chainId).toBe(1);
        expect(result.queries).toEqual([{ collection: COLLECTION, tokenId: 1n }]);
        expect(result.results).toEqual([{ status: "success", result: OWNER }]);
    });

    it("falls back to sequential reads when multicall is unavailable", async () => {
        const error = new Error("revert");
        const readContract = vi.fn();
        readContract.mockResolvedValueOnce(OWNER).mockRejectedValueOnce(error);

        const reader = new ERC721CollectionReader({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1, false), { readContract }),
        });

        const result = await reader.getOwners([1n, 2n]);

        expect(result.results).toEqual([
            { status: "success", result: OWNER },
            { status: "failure", error },
        ]);
        expect(result.failures).toEqual([
            { query: { collection: COLLECTION, tokenId: 2n }, error },
        ]);
    });

    it("getTotalSupplies returns single-item batch for the bound collection", async () => {
        const readContract = vi.fn().mockResolvedValue(true);
        const multicall = vi.fn().mockResolvedValueOnce([{ status: "success", result: 123n }]);
        const reader = new ERC721CollectionReader({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1), { readContract, multicall }),
        });

        const result = await reader.getTotalSupplies();

        expect(result.queries).toEqual([{ collection: COLLECTION }]);
        expect(result.results).toEqual([{ status: "success", result: 123n }]);
        expect(result.failures).toHaveLength(0);
    });

    it("maps owner/index tuples for tokenOfOwnerByIndexes", async () => {
        const readContract = vi.fn().mockResolvedValue(true);
        const multicall = vi.fn().mockResolvedValueOnce([
            { status: "success", result: 11n },
            { status: "success", result: 22n },
        ]);
        const reader = new ERC721CollectionReader({
            collection: COLLECTION,
            client: mockPublicClient(mockChain(1), { readContract, multicall }),
        });

        const result = await reader.getTokenOfOwnerByIndexes([
            { owner: OWNER, index: 0n },
            { owner: OWNER_2, index: 1n },
        ]);

        expect(result.queries).toEqual([
            { collection: COLLECTION, owner: OWNER, index: 0n },
            { collection: COLLECTION, owner: OWNER_2, index: 1n },
        ]);
        expect(result.results).toEqual([
            { status: "success", result: 11n },
            { status: "success", result: 22n },
        ]);
    });

    describe("delegates every method to bound read client", () => {
        it("delegates supportsInterface", async () => {
            const { reader, calls } = createDelegationHarness();
            calls.supportsInterface.mockResolvedValue(true);

            await expect(reader.supportsInterface("0x80ac58cd")).resolves.toBe(true);
            expect(calls.supportsInterface).toHaveBeenCalledWith(COLLECTION, "0x80ac58cd");
        });

        it("delegates getCollectionMetadata", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { address: COLLECTION, chainId: 1, name: "Cool", symbol: "COOL" };
            calls.getCollectionMetadata.mockResolvedValue(expected);

            await expect(reader.getCollectionMetadata()).resolves.toBe(expected);
            expect(calls.getCollectionMetadata).toHaveBeenCalledWith(COLLECTION);
        });

        it("delegates getOwnerOf", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { owner: OWNER };
            calls.getOwnerOf.mockResolvedValue(expected);

            await expect(reader.getOwnerOf(7n)).resolves.toBe(expected);
            expect(calls.getOwnerOf).toHaveBeenCalledWith(COLLECTION, 7n);
        });

        it("delegates getBalance", async () => {
            const { reader, calls } = createDelegationHarness();
            calls.getBalance.mockResolvedValue(42n);

            await expect(reader.getBalance(OWNER)).resolves.toBe(42n);
            expect(calls.getBalance).toHaveBeenCalledWith(COLLECTION, OWNER);
        });

        it("delegates getApproved", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { approved: OWNER };
            calls.getApproved.mockResolvedValue(expected);

            await expect(reader.getApproved(8n)).resolves.toBe(expected);
            expect(calls.getApproved).toHaveBeenCalledWith(COLLECTION, 8n);
        });

        it("delegates isApprovedForAll", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { approved: true };
            calls.isApprovedForAll.mockResolvedValue(expected);

            await expect(reader.isApprovedForAll(OWNER, OWNER_2)).resolves.toBe(expected);
            expect(calls.isApprovedForAll).toHaveBeenCalledWith(COLLECTION, OWNER, OWNER_2);
        });

        it("delegates getTokenURI", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { tokenURI: "ipfs://x" };
            calls.getTokenURI.mockResolvedValue(expected);

            await expect(reader.getTokenURI(9n)).resolves.toBe(expected);
            expect(calls.getTokenURI).toHaveBeenCalledWith(COLLECTION, 9n);
        });

        it("delegates enumerable single reads", async () => {
            const { reader, calls } = createDelegationHarness();
            calls.getTotalSupply.mockResolvedValue(100n);
            calls.getTokenByIndex.mockResolvedValue(10n);
            calls.getTokenOfOwnerByIndex.mockResolvedValue(11n);

            await expect(reader.getTotalSupply()).resolves.toBe(100n);
            await expect(reader.getTokenByIndex(0n)).resolves.toBe(10n);
            await expect(reader.getTokenOfOwnerByIndex(OWNER, 1n)).resolves.toBe(11n);

            expect(calls.getTotalSupply).toHaveBeenCalledWith(COLLECTION);
            expect(calls.getTokenByIndex).toHaveBeenCalledWith(COLLECTION, 0n);
            expect(calls.getTokenOfOwnerByIndex).toHaveBeenCalledWith(COLLECTION, OWNER, 1n);
        });

        it("delegates getOwners mapping tokenIds", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getOwners.mockResolvedValue(expected);

            await expect(reader.getOwners([1n, 2n])).resolves.toBe(expected);
            expect(calls.getOwners).toHaveBeenCalledWith([
                { collection: COLLECTION, tokenId: 1n },
                { collection: COLLECTION, tokenId: 2n },
            ]);
        });

        it("delegates getTokenURIs mapping tokenIds", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getTokenURIs.mockResolvedValue(expected);

            await expect(reader.getTokenURIs([3n, 4n])).resolves.toBe(expected);
            expect(calls.getTokenURIs).toHaveBeenCalledWith([
                { collection: COLLECTION, tokenId: 3n },
                { collection: COLLECTION, tokenId: 4n },
            ]);
        });

        it("delegates getApprovals mapping tokenIds", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getApprovals.mockResolvedValue(expected);

            await expect(reader.getApprovals([5n, 6n])).resolves.toBe(expected);
            expect(calls.getApprovals).toHaveBeenCalledWith([
                { collection: COLLECTION, tokenId: 5n },
                { collection: COLLECTION, tokenId: 6n },
            ]);
        });

        it("delegates getBalances mapping owners", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getBalances.mockResolvedValue(expected);

            await expect(reader.getBalances([OWNER, OWNER_2])).resolves.toBe(expected);
            expect(calls.getBalances).toHaveBeenCalledWith([
                { collection: COLLECTION, owner: OWNER },
                { collection: COLLECTION, owner: OWNER_2 },
            ]);
        });

        it("delegates getOperatorApprovals mapping queries", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getOperatorApprovals.mockResolvedValue(expected);

            await expect(
                reader.getOperatorApprovals([{ owner: OWNER, operator: OWNER_2 }]),
            ).resolves.toBe(expected);
            expect(calls.getOperatorApprovals).toHaveBeenCalledWith([
                { collection: COLLECTION, owner: OWNER, operator: OWNER_2 },
            ]);
        });

        it("delegates getInterfaceSupports mapping interfaceIds", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getInterfaceSupports.mockResolvedValue(expected);

            await expect(reader.getInterfaceSupports(["0x80ac58cd"])).resolves.toBe(expected);
            expect(calls.getInterfaceSupports).toHaveBeenCalledWith([
                { collection: COLLECTION, interfaceId: "0x80ac58cd" },
            ]);
        });

        it("delegates getTotalSupplies as single-item query", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getTotalSupplies.mockResolvedValue(expected);

            await expect(reader.getTotalSupplies()).resolves.toBe(expected);
            expect(calls.getTotalSupplies).toHaveBeenCalledWith([{ collection: COLLECTION }]);
        });

        it("delegates getTokenByIndexes mapping indexes", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getTokenByIndexes.mockResolvedValue(expected);

            await expect(reader.getTokenByIndexes([0n, 1n])).resolves.toBe(expected);
            expect(calls.getTokenByIndexes).toHaveBeenCalledWith([
                { collection: COLLECTION, index: 0n },
                { collection: COLLECTION, index: 1n },
            ]);
        });

        it("delegates getTokenOfOwnerByIndexes mapping owner/index tuples", async () => {
            const { reader, calls } = createDelegationHarness();
            const expected = { chainId: 1, results: [], queries: [], failures: [] };
            calls.getTokenOfOwnerByIndexes.mockResolvedValue(expected);

            await expect(
                reader.getTokenOfOwnerByIndexes([
                    { owner: OWNER, index: 0n },
                    { owner: OWNER_2, index: 1n },
                ]),
            ).resolves.toBe(expected);
            expect(calls.getTokenOfOwnerByIndexes).toHaveBeenCalledWith([
                { collection: COLLECTION, owner: OWNER, index: 0n },
                { collection: COLLECTION, owner: OWNER_2, index: 1n },
            ]);
        });
    });
});
