import type { Chain, PublicClient, Transport } from "viem";
import { createPublicClient } from "viem";

import type { ChainTransportConfig } from "../types/config.js";
import { ChainUtilsFault } from "../errors/base.js";
import { UnsupportedChain } from "../errors/chain.js";
import { resolveChainFromConfig } from "../utils/chain.js";

/**
 * Typed registry of `PublicClient` instances keyed by chain ID.
 *
 * This class is ABI-agnostic and focuses only on chain-aware RPC access.
 *
 * @template TChainId Literal union of configured chain IDs.
 *
 * @example
 * ```ts
 * const multichain = createMultichainClient([mainnetClient, baseClient] as const);
 * const mainnetRpc = multichain.getPublicClient(1);
 * ```
 */
export class MultichainClient<TChainId extends number> {
    readonly chainIds: ReadonlyArray<TChainId>;
    private readonly clients: ReadonlyMap<TChainId, PublicClient<Transport, Chain>>;

    /**
     * @param {ReadonlyMap<TChainId, PublicClient<Transport, Chain>>} clients Public clients keyed by chain ID.
     * @returns {MultichainClient<TChainId>} A multichain RPC client container.
     */
    constructor(clients: ReadonlyMap<TChainId, PublicClient<Transport, Chain>>) {
        this.clients = clients;
        this.chainIds = [...clients.keys()];
    }

    /**
     * Returns the `PublicClient` configured for a chain.
     *
     * @param {TChainId} chainId Chain identifier to resolve.
     * @returns {PublicClient<Transport, Chain>} The configured public client for `chainId`.
     * @throws {UnsupportedChain} Thrown when `chainId` is not configured.
     */
    getPublicClient(chainId: TChainId): PublicClient<Transport, Chain> {
        const client = this.clients.get(chainId);
        if (!client) {
            throw new UnsupportedChain(chainId, {
                availableChainIds: [...this.chainIds],
            });
        }
        return client;
    }

    /**
     * Checks whether a chain ID is configured.
     *
     * @param {number} chainId Chain identifier to test.
     * @returns {boolean} `true` when a client exists for the chain.
     */
    hasChain(chainId: number): boolean {
        return this.clients.has(chainId as TChainId);
    }

    /**
     * Returns a new immutable instance with an additional chain client.
     *
     * @template TNewChainId New chain ID literal type.
     * @param {PublicClient<Transport, Chain>} client Public client to add.
     * @returns {MultichainClient<TChainId | TNewChainId>} New client set including the added chain.
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

/**
 * Creates a `MultichainClient` from pre-built public clients.
 *
 * @template TClients Readonly tuple of clients with literal chain IDs.
 * @param {TClients} clients Public clients to index by `client.chain.id`.
 * @returns {MultichainClient<TClients[number]["chain"]["id"]>} Typed multichain client.
 * @throws {ChainUtilsFault} Thrown when duplicate chain IDs are provided.
 */
export function createMultichainClient<const TClients extends readonly { chain: Chain }[]>(
    clients: TClients,
): MultichainClient<TClients[number]["chain"]["id"]>;

/**
 * Creates a `MultichainClient` from transport configs.
 *
 * @template TConfigs Readonly tuple of chain transport configs with literal chain IDs.
 * @param {TConfigs} configs Config entries used to create `PublicClient` instances internally.
 * @returns {MultichainClient<TConfigs[number]["chain"]["id"]>} Typed multichain client.
 * @throws {ChainUtilsFault} Thrown when duplicate chain IDs are provided.
 */
export function createMultichainClient<const TConfigs extends readonly ChainTransportConfig[]>(
    configs: TConfigs,
): MultichainClient<TConfigs[number]["chain"]["id"]>;

/**
 * Creates a `MultichainClient` from mixed `PublicClient` and transport-config inputs.
 *
 * @template TChainId Literal union of chain IDs in `inputs`.
 * @param {readonly (PublicClient<Transport, Chain> | ChainTransportConfig)[]} inputs Chain client inputs.
 * @returns {MultichainClient<TChainId>} New multichain client instance.
 * @throws {ChainUtilsFault} Thrown when duplicate chain IDs are provided.
 * @throws {Error} Propagates client-construction failures from viem when building clients from configs.
 */
export function createMultichainClient<TChainId extends number>(
    inputs: readonly (PublicClient<Transport, Chain> | ChainTransportConfig)[],
): MultichainClient<TChainId> {
    const map = new Map<number, PublicClient<Transport, Chain>>();
    const seenChainIds = new Set<number>();

    for (const input of inputs) {
        if ("request" in input) {
            const chainId = input.chain.id;
            if (seenChainIds.has(chainId)) {
                throw new ChainUtilsFault("Duplicate chain ID in multichain client inputs", {
                    metaMessages: [`Chain ID: ${chainId}`],
                });
            }
            seenChainIds.add(chainId);
            map.set(chainId, input);
        } else {
            const chain = resolveChainFromConfig(input);
            const chainId = chain.id;
            if (seenChainIds.has(chainId)) {
                throw new ChainUtilsFault("Duplicate chain ID in multichain client inputs", {
                    metaMessages: [`Chain ID: ${chainId}`],
                });
            }
            seenChainIds.add(chainId);
            const client = createPublicClient({
                chain,
                transport: input.transport,
            });
            map.set(chainId, client);
        }
    }

    return new MultichainClient(map) as MultichainClient<TChainId>;
}
