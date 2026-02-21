import type { Chain, PublicClient, Transport } from "viem";
import { createMultichainClient, MultichainClient } from "@/client/multichainClient.js";
import { ChainUtilsFault } from "@/errors/base.js";
import { UnsupportedChain } from "@/errors/chain.js";
import { http } from "viem";
import { mainnet, optimism } from "viem/chains";
import { describe, expect, it } from "vitest";

import { mockChainWithoutMulticall, mockPublicClient } from "../mocks/publicClient.js";

describe("MultichainClient", () => {
    describe("constructor", () => {
        it("stores clients from a ReadonlyMap", () => {
            const client1 = mockPublicClient(1);
            const map = new Map<1, PublicClient<Transport, Chain>>([[1, client1]]);

            const mc = new MultichainClient(map);

            expect(mc.chainIds).toEqual([1]);
        });

        it("exposes chainIds for all configured chains", () => {
            const map = new Map([
                [1, mockPublicClient(1)],
                [10, mockPublicClient(10)],
                [8453, mockPublicClient(8453)],
            ]);

            const mc = new MultichainClient(map);

            expect(mc.chainIds).toEqual([1, 10, 8453]);
        });
    });

    describe("getPublicClient", () => {
        it("returns the correct client for a configured chain", () => {
            const client1 = mockPublicClient(1);
            const client10 = mockPublicClient(10);
            const map = new Map([
                [1, client1],
                [10, client10],
            ]);

            const mc = new MultichainClient(map);

            expect(mc.getPublicClient(1)).toBe(client1);
            expect(mc.getPublicClient(10)).toBe(client10);
        });

        it("throws UnsupportedChain for unconfigured chains", () => {
            const map = new Map([[1, mockPublicClient(1)]]);
            const mc = new MultichainClient(map);

            expect(() => mc.getPublicClient(42161)).toThrow(UnsupportedChain);
        });

        it("includes available chain IDs in the UnsupportedChain error", () => {
            const map = new Map([
                [1, mockPublicClient(1)],
                [10, mockPublicClient(10)],
            ]);
            const mc = new MultichainClient(map);

            try {
                mc.getPublicClient(999);
                expect.unreachable("should have thrown");
            } catch (e) {
                expect(e).toBeInstanceOf(UnsupportedChain);
                expect((e as UnsupportedChain).chainId).toBe(999);
                expect((e as UnsupportedChain).availableChainIds).toEqual([1, 10]);
            }
        });
    });

    describe("hasChain", () => {
        it("returns true for configured chains", () => {
            const map = new Map([
                [1, mockPublicClient(1)],
                [10, mockPublicClient(10)],
            ]);
            const mc = new MultichainClient(map);

            expect(mc.hasChain(1)).toBe(true);
            expect(mc.hasChain(10)).toBe(true);
        });

        it("returns false for unconfigured chains", () => {
            const map = new Map([[1, mockPublicClient(1)]]);
            const mc = new MultichainClient(map);

            expect(mc.hasChain(42161)).toBe(false);
        });
    });

    describe("withChain", () => {
        it("returns a new MultichainClient with the added chain", () => {
            const client1 = mockPublicClient(1);
            const client10 = mockPublicClient(10);
            const map = new Map([[1, client1]]);
            const original = new MultichainClient(map);

            const extended = original.withChain(client10);

            expect(extended.hasChain(1)).toBe(true);
            expect(extended.hasChain(10)).toBe(true);
            expect(extended.chainIds).toEqual([1, 10]);
        });

        it("does not mutate the original instance", () => {
            const client1 = mockPublicClient(1);
            const client10 = mockPublicClient(10);
            const map = new Map([[1, client1]]);
            const original = new MultichainClient(map);

            original.withChain(client10);

            expect(original.hasChain(10)).toBe(false);
            expect(original.chainIds).toEqual([1]);
        });

        it("preserves existing clients in the new instance", () => {
            const client1 = mockPublicClient(1);
            const client10 = mockPublicClient(10);
            const map = new Map([[1, client1]]);
            const original = new MultichainClient(map);

            const extended = original.withChain(client10);

            expect(extended.getPublicClient(1)).toBe(client1);
        });
    });
});

describe("createMultichainClient", () => {
    it("creates from an array of PublicClients", () => {
        const client1 = mockPublicClient(1);
        const client10 = mockPublicClient(10);

        const mc = createMultichainClient([client1, client10]);

        expect(mc).toBeInstanceOf(MultichainClient);
        expect(mc.chainIds).toEqual([1, 10]);
        expect(mc.getPublicClient(1)).toBe(client1);
        expect(mc.getPublicClient(10)).toBe(client10);
    });

    it("creates from an array of ChainTransportConfigs", () => {
        const configs = [
            { chain: mainnet, transport: http() },
            { chain: optimism, transport: http() },
        ] as const;

        const mc = createMultichainClient(configs);

        expect(mc).toBeInstanceOf(MultichainClient);
        expect(mc.chainIds).toEqual([1, 10]);
    });

    it("applies multicallAddress override for ChainTransportConfig inputs", () => {
        const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11";
        const configs = [
            {
                chain: mockChainWithoutMulticall(11155111),
                transport: http(),
                multicallAddress,
            },
        ] as const;

        const mc = createMultichainClient(configs);
        const chain = mc.getPublicClient(11155111).chain;

        expect(chain.contracts?.multicall3?.address).toBe(multicallAddress);
    });

    it("keeps plain ChainTransportConfig behavior unchanged", () => {
        const configs = [
            { chain: mockChainWithoutMulticall(11155111), transport: http() },
        ] as const;

        const mc = createMultichainClient(configs);
        const chain = mc.getPublicClient(11155111).chain;

        expect(chain.contracts?.multicall3).toBeUndefined();
    });

    it("extracts chain IDs from PublicClient.chain.id", () => {
        const client = mockPublicClient(8453);

        const mc = createMultichainClient([client]);

        expect(mc.hasChain(8453)).toBe(true);
    });

    it("keeps pre-built PublicClient behavior unchanged", () => {
        const client = mockPublicClient(mockChainWithoutMulticall(8453));

        const mc = createMultichainClient([client]);
        const chain = mc.getPublicClient(8453).chain;

        expect(chain).toBe(client.chain);
        expect(chain.contracts?.multicall3).toBeUndefined();
    });

    it("throws ChainUtilsFault on duplicate PublicClient chain IDs", () => {
        const first = mockPublicClient(1);
        const duplicate = mockPublicClient(1);

        try {
            createMultichainClient([first, duplicate]);
            expect.unreachable("should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ChainUtilsFault);
            expect((error as ChainUtilsFault).shortMessage).toBe(
                "Duplicate chain ID in multichain client inputs",
            );
            expect((error as ChainUtilsFault).metaMessages).toEqual(["Chain ID: 1"]);
        }
    });

    it("throws ChainUtilsFault on duplicate config chain IDs", () => {
        const configs = [
            { chain: mainnet, transport: http() },
            { chain: mainnet, transport: http() },
        ] as const;

        try {
            createMultichainClient(configs);
            expect.unreachable("should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ChainUtilsFault);
            expect((error as ChainUtilsFault).shortMessage).toBe(
                "Duplicate chain ID in multichain client inputs",
            );
            expect((error as ChainUtilsFault).metaMessages).toEqual(["Chain ID: 1"]);
        }
    });
});
