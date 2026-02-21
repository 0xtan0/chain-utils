import type { MultichainClient } from "@0xtan0/chain-utils/core";
import type { Address, Chain } from "viem";
import { ChainUtilsFault } from "@0xtan0/chain-utils/core";

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
 */
export class ERC20TokenBuilder<
    TClientChainId extends number,
    TTokenChainId extends number = never,
> {
    readonly #client: MultichainClient<TClientChainId>;
    readonly #addresses: Map<number, Address>;
    #meta: ERC20TokenMeta;

    constructor(
        client: MultichainClient<TClientChainId>,
        addresses?: Map<number, Address>,
        meta?: ERC20TokenMeta,
    ) {
        this.#client = client;
        this.#addresses = addresses ?? new Map<number, Address>();
        this.#meta = meta ?? {};
    }

    metadata(meta: ERC20TokenMeta): this {
        this.#meta = { ...this.#meta, ...meta };
        return this;
    }

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

        const multichainClient = this.#client as unknown as MultichainClient<TTokenChainId>;

        return new ERC20BoundToken<TTokenChainId>({
            symbol: this.#meta.symbol,
            name: this.#meta.name,
            decimals: this.#meta.decimals,
            addresses: this.#addresses as unknown as ReadonlyMap<TTokenChainId, Address>,
            multichainClient,
        });
    }
}
