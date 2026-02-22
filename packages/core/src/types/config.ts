import type { Address, Chain, PublicClient, Transport } from "viem";

/**
 * Transport configuration used to lazily create a `PublicClient` for a chain.
 *
 * @property {Chain} chain Chain metadata used by viem and by the generated client.
 * @property {Transport} transport Transport factory used when creating the `PublicClient`.
 * @property {Address} [multicallAddress] Optional multicall override applied before client creation.
 */
export interface ChainTransportConfig {
    readonly chain: Chain;
    readonly transport: Transport;
    readonly multicallAddress?: Address;
}

/**
 * Accepted chain input for multichain factories.
 *
 * Use a pre-built `PublicClient` when client lifecycle is managed externally,
 * or `ChainTransportConfig` when the library should build the client.
 */
export type ChainInput = PublicClient<Transport, Chain> | ChainTransportConfig;
