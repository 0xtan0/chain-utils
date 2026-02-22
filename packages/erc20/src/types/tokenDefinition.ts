import type { Address } from "viem";

import type { TokenMetadata, TokenReference } from "./token.js";

/**
 * A token's identity and addresses across multiple chains.
 *
 * TChainId tracks which chains have been configured at the type level,
 * preventing lookups on unconfigured chains.
 *
 * @template TChainId Literal union of configured chain IDs.
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

    /**
     * Returns the token address for a chain.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {Address} Token address for the given chain.
     * @throws {ChainUtilsFault} Thrown when the chain is not configured on this definition.
     */
    address(chainId: TChainId): Address;

    /**
     * Checks whether the token has an address on the given chain.
     *
     * @param {number} chainId Chain ID to test.
     * @returns {boolean} `true` when the chain exists in the definition.
     */
    hasChain(chainId: number): boolean;

    /**
     * Builds a token reference for a chain.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {TokenReference} Token reference containing chain and address.
     * @throws {ChainUtilsFault} Thrown when the chain is not configured on this definition.
     */
    toTokenReference(chainId: TChainId): TokenReference;

    /**
     * Build a full TokenMetadata for a specific chain.
     * Only available when name + decimals are set in the definition.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {TokenMetadata} Token metadata containing name, symbol, decimals, and address.
     * @throws {ChainUtilsFault} Thrown when metadata is incomplete or the chain is not configured.
     */
    toTokenMetadata(chainId: TChainId): TokenMetadata;
}
