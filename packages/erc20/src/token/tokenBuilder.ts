import type { Address, Chain } from "viem";
import { ChainUtilsFault } from "@0xtan0/chain-utils/core";

import type { TokenMetadata, TokenReference } from "../types/token.js";
import type { ITokenDefinition } from "../types/tokenDefinition.js";
import { validateAddress } from "../helpers/validateAddress.js";

/**
 * Intermediate builder state: accumulating chain mappings via .onChain().
 *
 * @template TChainId Literal union of chain IDs collected so far.
 */
export interface ITokenBuilder<TChainId extends number = never> {
    /**
     * Register a chain + address pair.
     *
     * Overload A: accepts a viem Chain object.
     *
     * @template TChain Chain type with literal `id`.
     * @param {TChain} chain viem chain object.
     * @param {Address} address Token address on that chain.
     * @returns {ITokenBuilder<TChainId | TChain["id"]>} Builder with extended chain ID union.
     * @throws {InvalidAddress} Thrown when `address` is not a valid EVM address.
     */
    onChain<TChain extends Chain>(
        chain: TChain,
        address: Address,
    ): ITokenBuilder<TChainId | TChain["id"]>;

    /**
     * Overload B: accepts a numeric chain ID directly.
     *
     * @template TId Numeric chain ID literal.
     * @param {TId} chainId Chain ID.
     * @param {Address} address Token address on that chain.
     * @returns {ITokenBuilder<TChainId | TId>} Builder with extended chain ID union.
     * @throws {InvalidAddress} Thrown when `address` is not a valid EVM address.
     */
    onChain<TId extends number>(chainId: TId, address: Address): ITokenBuilder<TChainId | TId>;

    /**
     * Finalizes and returns a token definition.
     *
     * @returns {ITokenDefinition<TChainId>} Immutable token definition.
     * @throws {ChainUtilsFault} Thrown when no chains were configured.
     */
    build(): ITokenDefinition<TChainId>;
}

/**
 * Optional metadata set while defining a token.
 *
 * @property {string} [name] Human-readable token name.
 * @property {number} [decimals] Token decimal precision.
 */
export interface TokenBuilderOptions {
    readonly name?: string;
    readonly decimals?: number;
}

/**
 * Immutable token definition with chain-specific addresses.
 *
 * @template TChainId Literal union of configured chain IDs.
 */
export class TokenDefinition<TChainId extends number> implements ITokenDefinition<TChainId> {
    readonly symbol: string;
    readonly name?: string;
    readonly decimals?: number;
    readonly addresses: ReadonlyMap<TChainId, Address>;
    readonly chainIds: ReadonlyArray<TChainId>;

    /**
     * @param {string} symbol Token symbol.
     * @param {ReadonlyMap<TChainId, Address>} addresses Chain-to-address map.
     * @param {TokenBuilderOptions} [options] Optional token metadata.
     * @returns {TokenDefinition<TChainId>} Immutable token definition.
     */
    constructor(
        symbol: string,
        addresses: ReadonlyMap<TChainId, Address>,
        options?: TokenBuilderOptions,
    ) {
        this.symbol = symbol;
        this.addresses = addresses;
        this.chainIds = [...addresses.keys()];
        if (options?.name !== undefined) this.name = options.name;
        if (options?.decimals !== undefined) this.decimals = options.decimals;
    }

    /**
     * Returns the token address for a chain.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {Address} Token address.
     * @throws {ChainUtilsFault} Thrown when the token is not configured on `chainId`.
     */
    address(chainId: TChainId): Address {
        const addr = this.addresses.get(chainId);
        if (addr === undefined) {
            throw new ChainUtilsFault(
                `Token ${this.symbol} is not configured on chain ${String(chainId)}`,
                {
                    metaMessages: [
                        `Symbol: ${this.symbol}`,
                        `Requested chain: ${String(chainId)}`,
                        `Configured chains: ${this.chainIds.join(", ")}`,
                    ],
                },
            );
        }
        return addr;
    }

    /**
     * Checks whether a chain is configured.
     *
     * @param {number} chainId Chain ID to test.
     * @returns {boolean} `true` when token has an address for that chain.
     */
    hasChain(chainId: number): boolean {
        return this.addresses.has(chainId as TChainId);
    }

    /**
     * Builds a token reference for one chain.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {TokenReference} Token reference containing address and chain ID.
     * @throws {ChainUtilsFault} Thrown when the token is not configured on `chainId`.
     */
    toTokenReference(chainId: TChainId): TokenReference {
        return {
            address: this.address(chainId),
            chainId,
        };
    }

    /**
     * Builds token metadata for one chain.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {TokenMetadata} Token metadata for that chain.
     * @throws {ChainUtilsFault} Thrown when metadata is incomplete or chain is not configured.
     */
    toTokenMetadata(chainId: TChainId): TokenMetadata {
        if (this.name === undefined || this.decimals === undefined) {
            throw new ChainUtilsFault(
                `Token ${this.symbol} is missing name or decimals for toTokenMetadata()`,
                {
                    metaMessages: [
                        `Symbol: ${this.symbol}`,
                        `name: ${this.name ?? "undefined"}`,
                        `decimals: ${this.decimals !== undefined ? String(this.decimals) : "undefined"}`,
                    ],
                },
            );
        }
        return {
            address: this.address(chainId),
            chainId,
            name: this.name,
            symbol: this.symbol,
            decimals: this.decimals,
        };
    }
}

/**
 * Fluent builder used to construct `TokenDefinition` instances.
 *
 * @template TChainId Literal union of chain IDs collected so far.
 */
export class TokenBuilder<TChainId extends number = never> {
    readonly #symbol: string;
    readonly #options?: TokenBuilderOptions;
    readonly #addresses: Map<number, Address>;

    /**
     * @param {string} symbol Token symbol.
     * @param {TokenBuilderOptions} [options] Optional token metadata.
     * @param {Map<number, Address>} [addresses] Internal chain-to-address state.
     * @returns {TokenBuilder<TChainId>} Fluent token builder.
     */
    constructor(symbol: string, options?: TokenBuilderOptions, addresses?: Map<number, Address>) {
        this.#symbol = symbol;
        this.#options = options;
        this.#addresses = addresses ?? new Map<number, Address>();
    }

    /**
     * Adds or replaces the token address for one chain.
     *
     * @template TId Chain ID literal being added.
     * @param {Chain | TId} chainOrId Chain object or numeric chain ID.
     * @param {Address} address Token address on that chain.
     * @returns {ITokenBuilder<TChainId | TId>} New immutable builder with updated chain set.
     * @throws {InvalidAddress} Thrown when `address` is not a valid EVM address.
     */
    onChain<TId extends number>(
        chainOrId: Chain | TId,
        address: Address,
    ): ITokenBuilder<TChainId | TId> {
        const chainId = typeof chainOrId === "number" ? chainOrId : chainOrId.id;
        validateAddress(address);
        const next = new Map(this.#addresses);
        next.set(chainId, address);
        // The ITokenBuilder interface overloads provide type-safe chain ID tracking.
        // At runtime, addresses are always Map<number, Address>.
        return new TokenBuilder<TChainId | TId>(this.#symbol, this.#options, next);
    }

    /**
     * Finalizes and returns an immutable token definition.
     *
     * @returns {ITokenDefinition<TChainId>} Built token definition.
     * @throws {ChainUtilsFault} Thrown when no chains were configured.
     */
    build(): ITokenDefinition<TChainId> {
        if (this.#addresses.size === 0) {
            throw new ChainUtilsFault(
                `Token ${this.#symbol} must have at least one chain configured`,
                {
                    metaMessages: [`Symbol: ${this.#symbol}`],
                },
            );
        }
        // Safe: the builder only adds chain IDs matching TChainId at the type level.
        return new TokenDefinition<TChainId>(
            this.#symbol,
            this.#addresses as unknown as ReadonlyMap<TChainId, Address>,
            this.#options,
        );
    }
}

/**
 * Create a new token definition using a fluent builder.
 *
 * @example
 * ```typescript
 * import { mainnet, optimism, arbitrum } from "viem/chains";
 *
 * const USDC = defineToken("USDC", { name: "USD Coin", decimals: 6 })
 *     .onChain(mainnet,  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
 *     .onChain(optimism, "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85")
 *     .onChain(arbitrum, "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")
 *     .build();
 *
 * // Type: ITokenDefinition<1 | 10 | 42161>
 * ```
 *
 * @param {string} symbol Token symbol.
 * @param {TokenBuilderOptions} [options] Optional token metadata.
 * @returns {ITokenBuilder} Fluent token builder interface.
 */
export function defineToken(symbol: string, options?: TokenBuilderOptions): ITokenBuilder {
    return new TokenBuilder(symbol, options);
}
