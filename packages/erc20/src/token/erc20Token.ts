import type { CrossChainBatchResult, MultichainClient } from "@0xtan0/chain-utils/core";
import type { Address, Chain, PublicClient, Transport } from "viem";
import { ChainUtilsFault } from "@0xtan0/chain-utils/core";

import type { IERC20Read } from "../types/client.js";
import type { ERC20Token } from "../types/erc20Token.js";
import type {
    TokenAllowance,
    TokenBalance,
    TokenMetadata,
    TokenReference,
} from "../types/token.js";
import { ERC20ReadClient } from "../client/erc20ReadClient.js";

export interface ERC20BoundTokenOptions<TChainId extends number> {
    readonly symbol: string;
    readonly name?: string;
    readonly decimals?: number;
    readonly addresses: ReadonlyMap<TChainId, Address>;
    readonly multichainClient: MultichainClient<TChainId>;
}

export class ERC20BoundToken<TChainId extends number> implements ERC20Token<TChainId> {
    readonly symbol: string;
    readonly name?: string;
    readonly decimals?: number;
    readonly chainIds: ReadonlyArray<TChainId>;

    readonly #addresses: ReadonlyMap<TChainId, Address>;
    readonly #multichainClient: MultichainClient<TChainId>;
    readonly #clients: Map<TChainId, IERC20Read> = new Map();

    constructor(options: ERC20BoundTokenOptions<TChainId>) {
        this.symbol = options.symbol;
        this.#addresses = options.addresses;
        this.#multichainClient = options.multichainClient;
        this.chainIds = [...options.addresses.keys()];
        if (options.name !== undefined) this.name = options.name;
        if (options.decimals !== undefined) this.decimals = options.decimals;
    }

    address(chainId: TChainId): Address {
        const addr = this.#addresses.get(chainId);
        if (addr === undefined) {
            throw new ChainUtilsFault(
                `Token ${this.symbol} is not bound on chain ${String(chainId)}`,
                {
                    metaMessages: [
                        `Symbol: ${this.symbol}`,
                        `Requested chain: ${String(chainId)}`,
                        `Bound chains: ${this.chainIds.join(", ")}`,
                    ],
                },
            );
        }
        return addr;
    }

    hasChain(chainId: number): boolean {
        return this.#addresses.has(chainId as TChainId);
    }

    toTokenReference(chainId: TChainId): TokenReference {
        return {
            address: this.address(chainId),
            chainId,
        };
    }

    async getBalance(
        holder: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) =>
            client.getBalance(this.address(chainId), holder),
        );
    }

    async getAllowance(
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenAllowance>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) =>
            client.getAllowance(this.address(chainId), owner, spender),
        );
    }

    async getMetadata(chainId?: TChainId): Promise<TokenMetadata> {
        const targetChainId = chainId ?? this.chainIds[0]!;

        if (this.name !== undefined && this.decimals !== undefined) {
            return {
                address: this.address(targetChainId),
                chainId: targetChainId,
                name: this.name,
                symbol: this.symbol,
                decimals: this.decimals,
            };
        }

        const client = this.#getReadClient(targetChainId);
        return client.getTokenMetadata(this.address(targetChainId));
    }

    async getTotalSupply(chainId: TChainId): Promise<bigint> {
        const client = this.#getReadClient(chainId);
        return client.getTotalSupply(this.address(chainId));
    }

    #getReadClient(chainId: TChainId): IERC20Read {
        let client = this.#clients.get(chainId);
        if (!client) {
            const publicClient = this.#multichainClient.getPublicClient(chainId) as PublicClient<
                Transport,
                Chain
            >;
            client = new ERC20ReadClient({ client: publicClient });
            this.#clients.set(chainId, client);
        }
        return client;
    }

    async #runAcrossChains<T>(
        chainIds: ReadonlyArray<TChainId>,
        fn: (client: IERC20Read, chainId: TChainId) => Promise<T>,
    ): Promise<CrossChainBatchResult<T>> {
        const resultsByChain = new Map<number, T>();
        const failedChains: Array<{ readonly chainId: number; readonly error: Error }> = [];

        const settled = await Promise.allSettled(
            chainIds.map(async (chainId) => {
                const client = this.#getReadClient(chainId);
                const result = await fn(client, chainId);
                return { chainId, result };
            }),
        );

        for (const entry of settled) {
            if (entry.status === "fulfilled") {
                resultsByChain.set(entry.value.chainId, entry.value.result);
            } else {
                const chainId = chainIds[settled.indexOf(entry)]!;
                failedChains.push({
                    chainId,
                    error:
                        entry.reason instanceof Error
                            ? entry.reason
                            : new Error(String(entry.reason)),
                });
            }
        }

        return { resultsByChain, failedChains };
    }
}
