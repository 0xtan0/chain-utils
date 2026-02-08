import type {
    ChainTransportConfig,
    CrossChainBatchResult,
    MultichainContract,
} from "@0xtan0/chain-utils/core";
import type { Address, Chain, PublicClient, Transport } from "viem";
import {
    createMultichainClient,
    createMultichainContract,
    MultichainClient,
} from "@0xtan0/chain-utils/core";

import type { ERC20Abi } from "../abi/erc20Abi.js";
import type { IERC20MultichainClient, IERC20Read } from "../types/client.js";
import type { ERC20Token } from "../types/erc20Token.js";
import type { ERC20MultichainClientOptions } from "../types/options.js";
import type {
    AllowanceQuery,
    BalanceQuery,
    BatchAllowanceResult,
    BatchBalanceResult,
} from "../types/query.js";
import type { TokenBalance } from "../types/token.js";
import type { ITokenDefinition } from "../types/tokenDefinition.js";
import { erc20Abi } from "../abi/erc20Abi.js";
import { ERC20BoundToken } from "../token/erc20Token.js";
import { ERC20ReadClient } from "./erc20ReadClient.js";

export class ERC20MultichainClient<TChainId extends number>
    implements IERC20MultichainClient<TChainId>
{
    readonly multichain: MultichainContract<ERC20Abi, TChainId>;
    readonly chainIds: ReadonlyArray<TChainId>;

    readonly #clients: ReadonlyMap<TChainId, IERC20Read>;

    constructor(
        clients: ReadonlyMap<TChainId, IERC20Read>,
        multichain: MultichainContract<ERC20Abi, TChainId>,
    ) {
        this.#clients = clients;
        this.multichain = multichain;
        this.chainIds = [...clients.keys()];
    }

    getClient(chainId: TChainId): IERC20Read {
        const client = this.#clients.get(chainId);
        if (!client) {
            throw new Error(`No ERC20 client configured for chain ${String(chainId)}`);
        }
        return client;
    }

    hasChain(chainId: number): boolean {
        return this.#clients.has(chainId as TChainId);
    }

    async getBalanceAcrossChains(
        token: Address,
        holder: Address,
        chainIds: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>> {
        return this.#runAcrossChains(chainIds, (client) => client.getBalances([{ token, holder }]));
    }

    async getBalances(
        queries: ReadonlyArray<BalanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>> {
        const grouped = this.#groupByChain(queries);
        return this.#runAcrossChains([...grouped.keys()], (client, chainId) => {
            const chainQueries = grouped.get(chainId)!;
            return client.getBalances(chainQueries);
        });
    }

    async getAllowances(
        queries: ReadonlyArray<AllowanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>> {
        const grouped = this.#groupByChain(queries);
        return this.#runAcrossChains([...grouped.keys()], (client, chainId) => {
            const chainQueries = grouped.get(chainId)!;
            return client.getAllowances(chainQueries);
        });
    }

    async getTokenBalance<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        holder: Address,
        chainIds?: ReadonlyArray<TTokenChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>> {
        const targets = chainIds ?? this.#overlappingChains(token);
        return this.#runAcrossChains(targets, (client, chainId) =>
            client.getBalance(token.address(chainId as TTokenChainId), holder),
        );
    }

    async getTokenAllowance<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TTokenChainId>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>> {
        const targets = chainIds ?? this.#overlappingChains(token);
        return this.#runAcrossChains(targets, (client, chainId) =>
            client.getAllowances([
                { token: token.address(chainId as TTokenChainId), owner, spender },
            ]),
        );
    }

    forToken<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
    ): ERC20Token<TTokenChainId> {
        const overlapping = this.#overlappingChains(token);

        if (overlapping.length === 0) {
            throw new Error(
                `No overlapping chains between client and token definition "${token.symbol}"`,
            );
        }

        if (token.name === undefined || token.decimals === undefined) {
            throw new Error(
                `Token definition "${token.symbol}" must have name and decimals for forToken()`,
            );
        }

        const addresses = new Map<TTokenChainId, Address>();
        for (const chainId of overlapping) {
            addresses.set(chainId, token.address(chainId));
        }

        const multichainClient = this.multichain
            .multichainClient as unknown as MultichainClient<TTokenChainId>;

        return new ERC20BoundToken<TTokenChainId>({
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            addresses,
            multichainClient,
        });
    }

    #overlappingChains<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
    ): TTokenChainId[] {
        return token.chainIds.filter((id) => this.hasChain(id));
    }

    #groupByChain<T extends { chainId: TChainId }>(items: ReadonlyArray<T>): Map<TChainId, T[]> {
        const grouped = new Map<TChainId, T[]>();
        for (const item of items) {
            const existing = grouped.get(item.chainId) ?? [];
            existing.push(item);
            grouped.set(item.chainId, existing);
        }
        return grouped;
    }

    async #runAcrossChains<T>(
        chainIds: ReadonlyArray<TChainId>,
        fn: (client: IERC20Read, chainId: TChainId) => Promise<T>,
    ): Promise<CrossChainBatchResult<T>> {
        const resultsByChain = new Map<number, T>();
        const failedChains: Array<{ readonly chainId: number; readonly error: Error }> = [];

        const settled = await Promise.allSettled(
            chainIds.map(async (chainId) => {
                const client = this.getClient(chainId);
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

/** Create from pre-built PublicClients. */
export function createERC20MultichainClient<const TClients extends readonly { chain: Chain }[]>(
    clients: TClients,
    options?: ERC20MultichainClientOptions,
): IERC20MultichainClient<TClients[number]["chain"]["id"]>;

/** Create from ChainTransportConfig array. */
export function createERC20MultichainClient<const TConfigs extends readonly ChainTransportConfig[]>(
    configs: TConfigs,
    options?: ERC20MultichainClientOptions,
): IERC20MultichainClient<TConfigs[number]["chain"]["id"]>;

export function createERC20MultichainClient<TChainId extends number>(
    inputs: readonly (PublicClient<Transport, Chain> | ChainTransportConfig)[],
    options?: ERC20MultichainClientOptions,
): IERC20MultichainClient<TChainId> {
    const multichainClient = createMultichainClient(
        inputs as readonly PublicClient<Transport, Chain>[],
    ) as MultichainClient<TChainId>;

    const multichain = createMultichainContract<ERC20Abi, TChainId>({
        abi: erc20Abi,
        multichainClient,
        errorDecoder: options?.errorDecoder,
        multicallBatchSize: options?.defaultMulticallBatchSize,
    });

    const erc20Clients = new Map<TChainId, IERC20Read>();
    for (const chainId of multichainClient.chainIds) {
        const publicClient = multichainClient.getPublicClient(chainId);
        erc20Clients.set(
            chainId,
            new ERC20ReadClient({
                client: publicClient,
                errorDecoder: options?.errorDecoder,
                customErrorAbi: options?.customErrorAbi,
                multicallBatchSize: options?.defaultMulticallBatchSize,
            }),
        );
    }

    return new ERC20MultichainClient(erc20Clients, multichain);
}
