import type { Address } from "viem";

/**
 * Pure data type describing a token's addresses across chains.
 * No RPC — just addresses. Populated by future tasks.
 */
export interface TokenDefinition<TChainId extends number> {
    readonly symbol: string;
    readonly name: string;
    readonly decimals: number;
    readonly addresses: ReadonlyMap<TChainId, Address>;
}
