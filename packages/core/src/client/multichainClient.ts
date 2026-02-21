import type { Chain, PublicClient, Transport } from "viem";
import { createPublicClient } from "viem";

import type { ChainTransportConfig } from "../types/config.js";
import { UnsupportedChain } from "../errors/chain.js";
import { resolveChainFromConfig } from "../utils/chain.js";

/**
 * A typed collection of PublicClients keyed by chain ID.
 *
 * No ABI awareness — just RPC connections.
 * Use this as the entry point for multichain setups,
 * then build token-specific or contract-specific clients on top.
 *
 * TChainId is a union of literal chain IDs captured at creation time.
 */
export class MultichainClient<TChainId extends number> {
    readonly chainIds: ReadonlyArray<TChainId>;
    private readonly clients: ReadonlyMap<TChainId, PublicClient<Transport, Chain>>;

    constructor(clients: ReadonlyMap<TChainId, PublicClient<Transport, Chain>>) {
        this.clients = clients;
        this.chainIds = [...clients.keys()];
    }

    /** Get the PublicClient for a specific chain. */
    getPublicClient(chainId: TChainId): PublicClient<Transport, Chain> {
        const client = this.clients.get(chainId);
        if (!client) {
            throw new UnsupportedChain(chainId, {
                availableChainIds: [...this.chainIds],
            });
        }
        return client;
    }

    /** Check if a chain is configured. */
    hasChain(chainId: number): boolean {
        return this.clients.has(chainId as TChainId);
    }

    /**
     * Returns a new MultichainClient with an additional chain.
     * Immutable — does not mutate the current instance.
     */
    withChain<TNewChainId extends number>(
        client: PublicClient<Transport, Chain>,
    ): MultichainClient<TChainId | TNewChainId> {
        const newMap = new Map<TChainId | TNewChainId, PublicClient<Transport, Chain>>(
            this.clients,
        );
        const chainId = client.chain.id as TNewChainId;
        newMap.set(chainId, client);
        return new MultichainClient(newMap);
    }
}

/** Create from pre-built PublicClients (most common). */
export function createMultichainClient<const TClients extends readonly { chain: Chain }[]>(
    clients: TClients,
): MultichainClient<TClients[number]["chain"]["id"]>;

/** Create from ChainTransportConfig array (library creates PublicClients internally). */
export function createMultichainClient<const TConfigs extends readonly ChainTransportConfig[]>(
    configs: TConfigs,
): MultichainClient<TConfigs[number]["chain"]["id"]>;

export function createMultichainClient<TChainId extends number>(
    inputs: readonly (PublicClient<Transport, Chain> | ChainTransportConfig)[],
): MultichainClient<TChainId> {
    const map = new Map<number, PublicClient<Transport, Chain>>();

    for (const input of inputs) {
        if ("request" in input) {
            map.set(input.chain.id, input);
        } else {
            const chain = resolveChainFromConfig(input);
            const client = createPublicClient({
                chain,
                transport: input.transport,
            });
            map.set(chain.id, client);
        }
    }

    return new MultichainClient(map) as MultichainClient<TChainId>;
}
