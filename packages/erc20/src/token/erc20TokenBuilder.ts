import type { Address, Chain, PublicClient, Transport } from "viem";
import { ChainUtilsFault, MultichainClient } from "@0xtan0/chain-utils-core";

import type { ERC20Token } from "../types/erc20Token.js";
import type { ITokenDefinition } from "../types/tokenDefinition.js";
import { validateAddress } from "../helpers/validateAddress.js";
import { ERC20BoundToken } from "./erc20Token.js";

interface ERC20TokenMeta {
    readonly name?: string;
    readonly symbol?: string;
    readonly decimals?: number;
}

/**
 * Fluent builder that creates an ERC20Token bound to a MultichainClient.
 *
 * TClientChainId — all chain IDs the MultichainClient supports.
 * TTokenChainId  — chain IDs accumulated so far via .onChain().
 *
 * @template TClientChainId Literal union of chain IDs supported by the source multichain client.
 * @template TTokenChainId Literal union of chain IDs currently configured on the token.
 */
export class ERC20TokenBuilder<
    TClientChainId extends number,
    TTokenChainId extends number = never,
> {
    readonly #client: MultichainClient<TClientChainId>;
    readonly #addresses: Map<number, Address>;
    #meta: ERC20TokenMeta;

    /**
     * @param {MultichainClient<TClientChainId>} client Source multichain public-client registry.
     * @param {Map<number, Address>} [addresses] Internal chain-to-address state.
     * @param {ERC20TokenMeta} [meta] Internal metadata state.
     * @returns {ERC20TokenBuilder<TClientChainId, TTokenChainId>} Fluent bound-token builder.
     */
    constructor(
        client: MultichainClient<TClientChainId>,
        addresses?: Map<number, Address>,
        meta?: ERC20TokenMeta,
    ) {
        this.#client = client;
        this.#addresses = addresses ?? new Map<number, Address>();
        this.#meta = meta ?? {};
    }

    /**
     * Merges token metadata into the builder state.
     *
     * @param {ERC20TokenMeta} meta Partial metadata to merge.
     * @returns {this} Current builder instance for fluent chaining.
     */
    metadata(meta: ERC20TokenMeta): this {
        this.#meta = { ...this.#meta, ...meta };
        return this;
    }

    /**
     * Adds or replaces token address for a chain.
     *
     * @template TId Chain ID literal constrained to source client chains.
     * @param {TId | Chain} chainOrId Chain object or numeric chain ID.
     * @param {Address} address Token address on that chain.
     * @returns {ERC20TokenBuilder<TClientChainId, TTokenChainId | TId>} New immutable builder with extended token chain set.
     * @throws {ChainUtilsFault} Thrown when the chain is not configured in the source multichain client.
     * @throws {InvalidAddress} Thrown when `address` is not a valid EVM address.
     */
    onChain<TId extends TClientChainId>(
        chainOrId: TId | Chain,
        address: Address,
    ): ERC20TokenBuilder<TClientChainId, TTokenChainId | TId> {
        const chainId = typeof chainOrId === "number" ? chainOrId : chainOrId.id;

        if (!this.#client.hasChain(chainId)) {
            throw new ChainUtilsFault(
                `Chain ${String(chainId)} is not configured in the MultichainClient`,
                {
                    metaMessages: [
                        `Requested chain: ${String(chainId)}`,
                        `Available chains: ${this.#client.chainIds.join(", ")}`,
                    ],
                },
            );
        }

        validateAddress(address);

        const next = new Map(this.#addresses);
        next.set(chainId, address);
        return new ERC20TokenBuilder<TClientChainId, TTokenChainId | TId>(
            this.#client,
            next,
            this.#meta,
        );
    }

    /**
     * Imports addresses and metadata from an existing token definition.
     *
     * Only chains that are supported by the source multichain client are copied.
     *
     * @template TDefChainId Chain ID union from the source token definition.
     * @param {ITokenDefinition<TDefChainId>} definition Source token definition.
     * @returns {ERC20TokenBuilder<TClientChainId, TTokenChainId | TDefChainId>} New immutable builder enriched from definition data.
     */
    fromDefinition<TDefChainId extends TClientChainId>(
        definition: ITokenDefinition<TDefChainId>,
    ): ERC20TokenBuilder<TClientChainId, TTokenChainId | TDefChainId> {
        const next = new Map(this.#addresses);

        for (const chainId of definition.chainIds) {
            if (this.#client.hasChain(chainId)) {
                next.set(chainId, definition.address(chainId));
            }
        }

        const meta: ERC20TokenMeta = {
            ...this.#meta,
            symbol: this.#meta.symbol ?? definition.symbol,
            name: this.#meta.name ?? definition.name,
            decimals: this.#meta.decimals ?? definition.decimals,
        };

        return new ERC20TokenBuilder<TClientChainId, TTokenChainId | TDefChainId>(
            this.#client,
            next,
            meta,
        );
    }

    /**
     * Finalizes and returns a bound ERC20 token helper.
     *
     * @returns {ERC20Token<TTokenChainId>} Bound ERC20 token instance.
     * @throws {ChainUtilsFault} Thrown when no chains are configured, required metadata is missing, or chain assignments are invalid.
     */
    build(): ERC20Token<TTokenChainId> {
        if (this.#addresses.size === 0) {
            throw new ChainUtilsFault(
                "ERC20TokenBuilder requires at least one chain to be configured",
                {
                    metaMessages: [
                        `Available chains in client: ${this.#client.chainIds.join(", ")}`,
                    ],
                },
            );
        }

        if (!this.#meta.symbol) {
            throw new ChainUtilsFault(
                "ERC20TokenBuilder requires a symbol — use .metadata({ symbol }) or .fromDefinition()",
            );
        }

        if (this.#meta.name === undefined) {
            throw new ChainUtilsFault(
                "ERC20TokenBuilder requires a name — use .metadata({ name }) or .fromDefinition()",
            );
        }

        if (this.#meta.decimals === undefined) {
            throw new ChainUtilsFault(
                "ERC20TokenBuilder requires decimals — use .metadata({ decimals }) or .fromDefinition()",
            );
        }

        const availableChains = new Set<number>(this.#client.chainIds as ReadonlyArray<number>);
        const invalidChains = [...this.#addresses.keys()].filter(
            (chainId) => !availableChains.has(chainId),
        );

        if (invalidChains.length > 0) {
            throw new ChainUtilsFault(
                "ERC20TokenBuilder chain assignments must be a subset of the MultichainClient chains",
                {
                    metaMessages: [
                        `Invalid chains: ${invalidChains.join(", ")}`,
                        `Available chains: ${this.#client.chainIds.join(", ")}`,
                    ],
                },
            );
        }

        const addresses = new Map<TTokenChainId, Address>();
        const multichainPublicClients = new Map<TTokenChainId, PublicClient<Transport, Chain>>();
        for (const [chainId, address] of this.#addresses) {
            const tokenChainId = chainId as TTokenChainId;
            addresses.set(tokenChainId, address);
            multichainPublicClients.set(
                tokenChainId,
                this.#client.getPublicClient(chainId as TClientChainId),
            );
        }

        const multichainClient = new MultichainClient(multichainPublicClients);

        return new ERC20BoundToken<TTokenChainId>({
            symbol: this.#meta.symbol,
            name: this.#meta.name,
            decimals: this.#meta.decimals,
            addresses,
            multichainClient,
        });
    }
}
