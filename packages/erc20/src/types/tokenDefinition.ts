import type { Address } from "viem";

import type { TokenMetadata, TokenReference } from "./token.js";

/**
 * A token's identity and addresses across multiple chains.
 *
 * TChainId tracks which chains have been configured at the type level,
 * preventing lookups on unconfigured chains.
 */
export interface ITokenDefinition<TChainId extends number = number> {
    /** Token symbol (e.g. "USDC"). Used as a human-readable identifier. */
    readonly symbol: string;

    /** Optional metadata. When provided, avoids on-chain fetches. */
    readonly name?: string;
    readonly decimals?: number;

    /** All configured chain-to-address mappings. */
    readonly addresses: ReadonlyMap<TChainId, Address>;

    /** All chain IDs this token is configured on. */
    readonly chainIds: ReadonlyArray<TChainId>;

    /** Get the token's address on a specific chain. */
    address(chainId: TChainId): Address;

    /** Check if this token has an address on the given chain. */
    hasChain(chainId: number): boolean;

    /** Build a TokenReference for a specific chain. */
    toTokenReference(chainId: TChainId): TokenReference;

    /**
     * Build a full TokenMetadata for a specific chain.
     * Only available when name + decimals are set in the definition.
     */
    toTokenMetadata(chainId: TChainId): TokenMetadata;
}
