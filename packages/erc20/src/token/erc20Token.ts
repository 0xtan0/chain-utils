import type { CrossChainBatchResult } from "@0xtan0/chain-utils/core";
import type { Address, Chain, PublicClient, Transport } from "viem";
import { ChainUtilsFault, MultichainClient } from "@0xtan0/chain-utils/core";

import type { IERC20Read } from "../types/client.js";
import type { ERC20Token } from "../types/erc20Token.js";
import type { BatchAllowanceResult, BatchBalanceResult } from "../types/query.js";
import type { TokenBalance } from "../types/token.js";
import { ERC20ReadClient } from "../client/erc20ReadClient.js";

export interface ERC20BoundTokenOptions<TChainId extends number> {
    readonly symbol: string;
    readonly name: string;
    readonly decimals: number;
    readonly addresses: ReadonlyMap<TChainId, Address>;
    readonly multichainClient: MultichainClient<TChainId>;
}

export class ERC20BoundToken<TChainId extends number> implements ERC20Token<TChainId> {
    readonly symbol: string;
    readonly name: string;
    readonly decimals: number;
    readonly chainIds: ReadonlyArray<TChainId>;

    readonly #addresses: ReadonlyMap<TChainId, Address>;
    readonly #multichainClient: MultichainClient<TChainId>;
    readonly #clients: Map<TChainId, IERC20Read> = new Map();

    constructor(options: ERC20BoundTokenOptions<TChainId>) {
        this.symbol = options.symbol;
        this.name = options.name;
        this.decimals = options.decimals;
        this.#addresses = options.addresses;
        this.#multichainClient = options.multichainClient;
        this.chainIds = [...options.addresses.keys()];
    }

    getAddress(chainId: TChainId): Address {
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

    async getBalance(
        holder: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) =>
            client.getBalance(this.getAddress(chainId), holder),
        );
    }

    async getBalances(
        holders: ReadonlyArray<Address>,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) => {
            const tokenAddress = this.getAddress(chainId);
            const queries = holders.map((holder) => ({ token: tokenAddress, holder }));
            return client.getBalances(queries);
        });
    }

    async getAllowance(
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) => {
            const tokenAddress = this.getAddress(chainId);
            return client.getAllowances([{ token: tokenAddress, owner, spender }]);
        });
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

        for (let i = 0; i < settled.length; i++) {
            const entry = settled[i]!;
            if (entry.status === "fulfilled") {
                resultsByChain.set(entry.value.chainId, entry.value.result);
            } else {
                failedChains.push({
                    chainId: chainIds[i]!,
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
