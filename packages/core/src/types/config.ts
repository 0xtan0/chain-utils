import type { Address, Chain, PublicClient, Transport } from "viem";

/**
 * Shorthand for when the user doesn't want to create a PublicClient themselves.
 * The library creates the client internally from chain + transport.
 *
 * When you already have a PublicClient, pass it directly — no wrapper needed.
 * The chain is already embedded in PublicClient.chain.
 */
export interface ChainTransportConfig {
    readonly chain: Chain;
    readonly transport: Transport;
    readonly multicallAddress?: Address;
}

/**
 * What the factories accept: either a pre-built PublicClient
 * (chain is already in client.chain) or a ChainTransportConfig shorthand.
 */
export type ChainInput = PublicClient<Transport, Chain> | ChainTransportConfig;
