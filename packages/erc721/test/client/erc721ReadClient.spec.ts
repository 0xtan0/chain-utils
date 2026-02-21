import type { ERC721ClientOptions } from "@/index.js";
import type { Address, Chain, PublicClient, Transport } from "viem";
import {
    createERC721Client,
    ERC721CollectionReader,
    ERC721ReadClient,
    NotERC721Enumerable,
} from "@/index.js";
import { describe, expect, it, vi } from "vitest";

const COLLECTION = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const NON_ENUMERABLE_COLLECTION = "0x1111111111111111111111111111111111111111" as Address;
const OWNER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const OWNER2 = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" as Address;

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

function createOptions(overrides?: Partial<ERC721ClientOptions>): ERC721ClientOptions {
    const chain = mockChain(1);
    return {
        client: mockPublicClient(chain),
        ...overrides,
    };
}

describe("ERC721ReadClient", () => {
    describe("construction", () => {
        it("exposes chainId and supportsMulticall", () => {
            const client = new ERC721ReadClient(createOptions());
            expect(client.chainId).toBe(1);
            expect(client.supportsMulticall).toBe(true);
        });

        it("createERC721Client factory returns an ERC721ReadClient", () => {
            const client = createERC721Client(createOptions());
            expect(client.chainId).toBe(1);
        });

        it("forCollection returns ERC721CollectionReader", () => {
            const client = new ERC721ReadClient(createOptions());
            const collection = client.forCollection(COLLECTION);

            expect(collection).toBeInstanceOf(ERC721CollectionReader);
            expect(collection.collection).toBe(COLLECTION);
            expect(collection.chainId).toBe(client.chainId);
        });
    });

    describe("standard reads", () => {
        it("returns metadata, owner, and tokenURI", async () => {
            const readContract = vi.fn();
            readContract
                .mockResolvedValueOnce("Cool Collection")
                .mockResolvedValueOnce("COOL")
                .mockResolvedValueOnce(OWNER)
                .mockResolvedValueOnce("ipfs://token/1");

            const client = new ERC721ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            const metadata = await client.getCollectionMetadata(COLLECTION);
            expect(metadata).toEqual({
                address: COLLECTION,
                chainId: 1,
                name: "Cool Collection",
                symbol: "COOL",
            });

            const owner = await client.getOwnerOf(COLLECTION, 1n);
            expect(owner).toEqual({
                nft: {
                    collection: { address: COLLECTION, chainId: 1 },
                    tokenId: 1n,
                },
                owner: OWNER,
            });

            const tokenURI = await client.getTokenURI(COLLECTION, 1n);
            expect(tokenURI).toEqual({
                nft: {
                    collection: { address: COLLECTION, chainId: 1 },
                    tokenId: 1n,
                },
                tokenURI: "ipfs://token/1",
            });
        });
    });

    describe("enumerable gating", () => {
        const cases = [
            {
                name: "getTotalSupply",
                run: (client: ERC721ReadClient): Promise<bigint> =>
                    client.getTotalSupply(COLLECTION),
            },
            {
                name: "getTokenByIndex",
                run: (client: ERC721ReadClient): Promise<bigint> =>
                    client.getTokenByIndex(COLLECTION, 0n),
            },
            {
                name: "getTokenOfOwnerByIndex",
                run: (client: ERC721ReadClient): Promise<bigint> =>
                    client.getTokenOfOwnerByIndex(COLLECTION, OWNER, 0n),
            },
        ];

        it.each(cases)("$name throws NotERC721Enumerable when unsupported", async ({ run }) => {
            const readContract = vi.fn().mockResolvedValue(false);
            const client = new ERC721ReadClient(
                createOptions({ client: mockPublicClient(mockChain(1), { readContract }) }),
            );

            await expect(run(client)).rejects.toBeInstanceOf(NotERC721Enumerable);
            expect(readContract).toHaveBeenCalledTimes(1);
        });
    });

    describe("batch reads", () => {
        it("preserves order and reports failures without multicall", async () => {
            const error = new Error("revert");
            const readContract = vi.fn();
            readContract
                .mockResolvedValueOnce(OWNER)
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce(OWNER2);

            const client = new ERC721ReadClient(
                createOptions({
                    client: mockPublicClient(mockChain(1, false), { readContract }),
                }),
            );

            const queries = [
                { collection: COLLECTION, tokenId: 1n },
                { collection: COLLECTION, tokenId: 2n },
                { collection: COLLECTION, tokenId: 3n },
            ];

            const result = await client.getOwners(queries);
            expect(result.chainId).toBe(1);
            expect(result.queries).toBe(queries);
            expect(result.results).toEqual([
                { status: "success", result: OWNER },
                { status: "failure", error },
                { status: "success", result: OWNER2 },
            ]);
            expect(result.failures).toEqual([{ query: queries[1], error }]);
        });

        it("handles 10 owner queries while preserving order and partial failures", async () => {
            const failureIndexes = [1, 4, 8] as const;
            const errorsByIndex = new Map<number, Error>(
                failureIndexes.map((index) => [index, new Error(`revert-${index}`)]),
            );

            const readContract = vi.fn();
            for (let i = 0; i < 10; i += 1) {
                const error = errorsByIndex.get(i);
                if (error) {
                    readContract.mockRejectedValueOnce(error);
                } else {
                    readContract.mockResolvedValueOnce(i % 2 === 0 ? OWNER : OWNER2);
                }
            }

            const client = new ERC721ReadClient(
                createOptions({
                    client: mockPublicClient(mockChain(1, false), { readContract }),
                }),
            );

            const queries = Array.from({ length: 10 }, (_, index) => ({
                collection: COLLECTION,
                tokenId: BigInt(index + 1),
            }));

            const result = await client.getOwners(queries);
            const expectedResults = queries.map((_, index) => {
                const error = errorsByIndex.get(index);
                if (error) {
                    return { status: "failure" as const, error };
                }
                return {
                    status: "success" as const,
                    result: index % 2 === 0 ? OWNER : OWNER2,
                };
            });
            const expectedFailures = failureIndexes.map((index) => ({
                query: queries[index]!,
                error: errorsByIndex.get(index)!,
            }));

            expect(result.chainId).toBe(1);
            expect(result.queries).toEqual(queries);
            expect(result.results).toEqual(expectedResults);
            expect(result.failures).toEqual(expectedFailures);
            expect(readContract).toHaveBeenCalledTimes(10);
        });
    });

    describe("enumerable batch semantics", () => {
        it("getTotalSupplies keeps partial failures for non-enumerable collections", async () => {
            const readContract = vi.fn();
            readContract
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(100n);

            const client = new ERC721ReadClient(
                createOptions({
                    client: mockPublicClient(mockChain(1, false), { readContract }),
                }),
            );

            const queries = [{ collection: COLLECTION }, { collection: NON_ENUMERABLE_COLLECTION }];

            const result = await client.getTotalSupplies(queries);

            expect(result.results[0]).toEqual({ status: "success", result: 100n });
            expect(result.results[1]?.status).toBe("failure");
            expect(result.failures).toHaveLength(1);
            expect(result.failures[0]?.query).toEqual(queries[1]);
            expect(result.failures[0]?.error).toBeInstanceOf(NotERC721Enumerable);
            expect(readContract).toHaveBeenCalledTimes(3);
        });

        it("getTokenByIndexes keeps partial failures for non-enumerable collections", async () => {
            const readContract = vi.fn();
            readContract
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(7n);

            const client = new ERC721ReadClient(
                createOptions({
                    client: mockPublicClient(mockChain(1, false), { readContract }),
                }),
            );

            const queries = [
                { collection: COLLECTION, index: 0n },
                { collection: NON_ENUMERABLE_COLLECTION, index: 0n },
            ];

            const result = await client.getTokenByIndexes(queries);

            expect(result.results[0]).toEqual({ status: "success", result: 7n });
            expect(result.results[1]?.status).toBe("failure");
            expect(result.failures).toHaveLength(1);
            expect(result.failures[0]?.query).toEqual(queries[1]);
            expect(result.failures[0]?.error).toBeInstanceOf(NotERC721Enumerable);
            expect(readContract).toHaveBeenCalledTimes(3);
        });

        it("getTokenOfOwnerByIndexes keeps partial failures for non-enumerable collections", async () => {
            const readContract = vi.fn();
            readContract
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(9n);

            const client = new ERC721ReadClient(
                createOptions({
                    client: mockPublicClient(mockChain(1, false), { readContract }),
                }),
            );

            const queries = [
                { collection: COLLECTION, owner: OWNER, index: 0n },
                { collection: NON_ENUMERABLE_COLLECTION, owner: OWNER, index: 0n },
            ];

            const result = await client.getTokenOfOwnerByIndexes(queries);

            expect(result.results[0]).toEqual({ status: "success", result: 9n });
            expect(result.results[1]?.status).toBe("failure");
            expect(result.failures).toHaveLength(1);
            expect(result.failures[0]?.query).toEqual(queries[1]);
            expect(result.failures[0]?.error).toBeInstanceOf(NotERC721Enumerable);
            expect(readContract).toHaveBeenCalledTimes(3);
        });
    });
});
