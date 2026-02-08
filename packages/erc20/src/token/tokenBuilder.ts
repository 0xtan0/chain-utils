import type { Address, Chain } from "viem";
import { ChainUtilsFault } from "@0xtan0/chain-utils/core";

import type { TokenMetadata, TokenReference } from "../types/token.js";
import type { ITokenDefinition } from "../types/tokenDefinition.js";

/**
 * Intermediate builder state: accumulating chain mappings via .onChain().
 */
export interface ITokenBuilder<TChainId extends number = never> {
    /**
     * Register a chain + address pair.
     *
     * Overload A: accepts a viem Chain object.
     */
    onChain<TChain extends Chain>(
        chain: TChain,
        address: Address,
    ): ITokenBuilder<TChainId | TChain["id"]>;

    /**
     * Overload B: accepts a numeric chain ID directly.
     */
    onChain<TId extends number>(chainId: TId, address: Address): ITokenBuilder<TChainId | TId>;

    /** Finalize the definition. Requires at least one chain. */
    build(): ITokenDefinition<TChainId>;
}

export interface TokenBuilderOptions {
    readonly name?: string;
    readonly decimals?: number;
}

export class TokenDefinition<TChainId extends number> implements ITokenDefinition<TChainId> {
    readonly symbol: string;
    readonly name?: string;
    readonly decimals?: number;
    readonly addresses: ReadonlyMap<TChainId, Address>;
    readonly chainIds: ReadonlyArray<TChainId>;

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

    hasChain(chainId: number): boolean {
        return this.addresses.has(chainId as TChainId);
    }

    toTokenReference(chainId: TChainId): TokenReference {
        return {
            address: this.address(chainId),
            chainId,
        };
    }

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

export class TokenBuilder<TChainId extends number = never> {
    readonly #symbol: string;
    readonly #options?: TokenBuilderOptions;
    readonly #addresses: Map<number, Address>;

    constructor(symbol: string, options?: TokenBuilderOptions, addresses?: Map<number, Address>) {
        this.#symbol = symbol;
        this.#options = options;
        this.#addresses = addresses ?? new Map<number, Address>();
    }

    onChain<TId extends number>(
        chainOrId: Chain | TId,
        address: Address,
    ): ITokenBuilder<TChainId | TId> {
        const chainId = typeof chainOrId === "number" ? chainOrId : chainOrId.id;
        const next = new Map(this.#addresses);
        next.set(chainId, address);
        // The ITokenBuilder interface overloads provide type-safe chain ID tracking.
        // At runtime, addresses are always Map<number, Address>.
        return new TokenBuilder<TChainId | TId>(this.#symbol, this.#options, next);
    }

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
 */
export function defineToken(symbol: string, options?: TokenBuilderOptions): ITokenBuilder {
    return new TokenBuilder(symbol, options);
}
