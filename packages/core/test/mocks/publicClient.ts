import type { Chain, PublicClient, Transport } from "viem";
import { vi } from "vitest";

export function mockChainWithMulticall(chainId: number): Chain {
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

export function mockChainWithoutMulticall(chainId: number): Chain {
    return {
        id: chainId,
        name: "test",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["http://localhost"] } },
    } as Chain;
}

export function mockPublicClient(
    chain: Chain | number,
    overrides?: Partial<PublicClient<Transport, Chain>>,
): PublicClient<Transport, Chain> {
    const resolvedChain = typeof chain === "number" ? ({ id: chain } as Chain) : chain;
    return {
        chain: resolvedChain,
        transport: {},
        request: () => {},
        readContract: vi.fn(),
        multicall: vi.fn(),
        ...overrides,
    } as unknown as PublicClient<Transport, Chain>;
}
