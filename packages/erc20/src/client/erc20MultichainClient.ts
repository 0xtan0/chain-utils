import type {
    ChainTransportConfig,
    CrossChainBatchResult,
    MultichainContract,
} from "@0xtan0/chain-utils/core";
import type { Address, Chain, PublicClient, Transport } from "viem";
import {
    ChainUtilsFault,
    createMultichainClient,
    createMultichainContract,
    MultichainClient,
    UnsupportedChain,
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

/**
 * Multichain ERC20 client facade.
 *
 * Coordinates one `IERC20Read` per chain and returns aggregate
 * cross-chain results without failing the full request when one chain errors.
 *
 * @template TChainId Literal union of configured chain IDs.
 *
 * @example
 * ```ts
 * const client = createERC20MultichainClient([mainnetClient, baseClient] as const);
 * const balances = await client.getBalanceAcrossChains(token, holder, [1, 8453]);
 * ```
 */
export class ERC20MultichainClient<TChainId extends number>
    implements IERC20MultichainClient<TChainId>
{
    readonly multichain: MultichainContract<ERC20Abi, TChainId>;
    readonly chainIds: ReadonlyArray<TChainId>;

    readonly #clients: ReadonlyMap<TChainId, IERC20Read>;

    /**
     * @param {ReadonlyMap<TChainId, IERC20Read>} clients Per-chain read clients.
     * @param {MultichainContract<ERC20Abi, TChainId>} multichain Underlying multichain contract facade.
     * @returns {ERC20MultichainClient<TChainId>} Multichain ERC20 client.
     */
    constructor(
        clients: ReadonlyMap<TChainId, IERC20Read>,
        multichain: MultichainContract<ERC20Abi, TChainId>,
    ) {
        this.#clients = clients;
        this.multichain = multichain;
        this.chainIds = [...clients.keys()];
    }

    /**
     * Returns the read client for one chain.
     *
     * @param {TChainId} chainId Chain ID to resolve.
     * @returns {IERC20Read} Chain-scoped ERC20 read client.
     * @throws {UnsupportedChain} Thrown when `chainId` is not configured.
     */
    getClient(chainId: TChainId): IERC20Read {
        const client = this.#clients.get(chainId);
        if (!client) {
            throw new UnsupportedChain(chainId, {
                availableChainIds: [...this.chainIds],
            });
        }
        return client;
    }

    /**
     * Checks whether a chain is configured.
     *
     * @param {number} chainId Chain ID to test.
     * @returns {boolean} `true` when chain exists in this client.
     */
    hasChain(chainId: number): boolean {
        return this.#clients.has(chainId as TChainId);
    }

    /**
     * Reads one token balance for one holder across target chains.
     *
     * @param {Address} token Token address used on all target chains.
     * @param {Address} holder Holder wallet address.
     * @param {ReadonlyArray<TChainId>} chainIds Target chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchBalanceResult>>} Per-chain balance batch results.
     */
    async getBalanceAcrossChains(
        token: Address,
        holder: Address,
        chainIds: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>> {
        return this.#runAcrossChains(chainIds, (client) => client.getBalances([{ token, holder }]));
    }

    /**
     * Executes grouped balance queries across chains.
     *
     * @param {ReadonlyArray<BalanceQuery & { chainId: TChainId }>} queries Balance queries with explicit chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchBalanceResult>>} Per-chain balance batch results.
     */
    async getBalances(
        queries: ReadonlyArray<BalanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>> {
        const grouped = this.#groupByChain(queries);
        return this.#runAcrossChains([...grouped.keys()], (client, chainId) => {
            const chainQueries = grouped.get(chainId)!;
            return client.getBalances(chainQueries);
        });
    }

    /**
     * Executes grouped allowance queries across chains.
     *
     * @param {ReadonlyArray<AllowanceQuery & { chainId: TChainId }>} queries Allowance queries with explicit chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchAllowanceResult>>} Per-chain allowance batch results.
     */
    async getAllowances(
        queries: ReadonlyArray<AllowanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>> {
        const grouped = this.#groupByChain(queries);
        return this.#runAcrossChains([...grouped.keys()], (client, chainId) => {
            const chainQueries = grouped.get(chainId)!;
            return client.getAllowances(chainQueries);
        });
    }

    /**
     * Reads token balance across the overlap between token and client chains.
     *
     * @template TTokenChainId Token definition chain union (subset of client chains).
     * @param {ITokenDefinition<TTokenChainId>} token Token definition.
     * @param {Address} holder Holder wallet address.
     * @param {ReadonlyArray<TTokenChainId>} [chainIds] Optional target subset. Defaults to chain overlap.
     * @returns {Promise<CrossChainBatchResult<TokenBalance>>} Per-chain token balance results.
     */
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

    /**
     * Reads token allowance across the overlap between token and client chains.
     *
     * @template TTokenChainId Token definition chain union (subset of client chains).
     * @param {ITokenDefinition<TTokenChainId>} token Token definition.
     * @param {Address} owner Token owner address.
     * @param {Address} spender Spender address.
     * @param {ReadonlyArray<TTokenChainId>} [chainIds] Optional target subset. Defaults to chain overlap.
     * @returns {Promise<CrossChainBatchResult<BatchAllowanceResult>>} Per-chain allowance results.
     */
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

    /**
     * Creates an `ERC20Token` bound to this multichain client.
     *
     * @template TTokenChainId Token definition chain union (subset of client chains).
     * @param {ITokenDefinition<TTokenChainId>} token Token definition to bind.
     * @param {boolean} [returnIntersectionChains=false] When `true`, returns only valid chain intersections instead of strict matching.
     * @returns {ERC20Token<TTokenChainId>} Bound token helper.
     * @throws {Error} Thrown when no chain overlap exists or token metadata is incomplete.
     * @throws {ChainUtilsFault} Thrown when strict matching is required and some overlap chains are missing from the multichain RPC client.
     */
    forToken<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        returnIntersectionChains = false,
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
        const readClients = new Map<TTokenChainId, IERC20Read>();
        const multichainPublicClients = new Map<TTokenChainId, PublicClient<Transport, Chain>>();
        const missingChains: number[] = [];

        const sourceMultichainClient = this.multichain.multichainClient;
        for (const chainId of overlapping) {
            if (!sourceMultichainClient.hasChain(chainId)) {
                missingChains.push(chainId);
                continue;
            }

            addresses.set(chainId, token.address(chainId));
            readClients.set(chainId, this.getClient(chainId));
            multichainPublicClients.set(chainId, sourceMultichainClient.getPublicClient(chainId));
        }

        if (missingChains.length > 0 && !returnIntersectionChains) {
            throw new ChainUtilsFault(
                "Token binding requires all overlapping chains to exist in the multichain RPC client",
                {
                    metaMessages: [
                        `Token: ${token.symbol}`,
                        `Missing chains: ${missingChains.join(", ")}`,
                        `Available multichain RPC chains: ${this.multichain.multichainClient.chainIds.join(", ")}`,
                    ],
                },
            );
        }

        const multichainClient = new MultichainClient(multichainPublicClients);

        return new ERC20BoundToken<TTokenChainId>({
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            addresses,
            multichainClient,
            readClients,
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

/**
 * Creates a multichain ERC20 client from pre-built public clients.
 *
 * @template TClients Readonly tuple of clients with literal chain IDs.
 * @param {TClients} clients Public clients.
 * @param {ERC20MultichainClientOptions} [options] Decoder and multicall options applied to all chains.
 * @returns {IERC20MultichainClient<TClients[number]["chain"]["id"]>} Multichain ERC20 client.
 * @throws {ChainUtilsFault} Thrown when duplicate chain IDs are provided.
 * @throws {Error} Propagates RPC client construction failures.
 */
export function createERC20MultichainClient<const TClients extends readonly { chain: Chain }[]>(
    clients: TClients,
    options?: ERC20MultichainClientOptions,
): IERC20MultichainClient<TClients[number]["chain"]["id"]>;

/**
 * Creates a multichain ERC20 client from chain transport configs.
 *
 * @template TConfigs Readonly tuple of configs with literal chain IDs.
 * @param {TConfigs} configs Chain transport configs.
 * @param {ERC20MultichainClientOptions} [options] Decoder and multicall options applied to all chains.
 * @returns {IERC20MultichainClient<TConfigs[number]["chain"]["id"]>} Multichain ERC20 client.
 * @throws {ChainUtilsFault} Thrown when duplicate chain IDs are provided.
 * @throws {Error} Propagates RPC client construction failures.
 */
export function createERC20MultichainClient<const TConfigs extends readonly ChainTransportConfig[]>(
    configs: TConfigs,
    options?: ERC20MultichainClientOptions,
): IERC20MultichainClient<TConfigs[number]["chain"]["id"]>;

/**
 * Creates a multichain ERC20 client from mixed public-client and config inputs.
 *
 * @template TChainId Literal union of configured chain IDs.
 * @param {readonly (PublicClient<Transport, Chain> | ChainTransportConfig)[]} inputs Chain inputs.
 * @param {ERC20MultichainClientOptions} [options] Decoder and multicall options applied to all chains.
 * @returns {IERC20MultichainClient<TChainId>} Multichain ERC20 client.
 * @throws {ChainUtilsFault} Thrown when duplicate chain IDs are provided.
 * @throws {Error} Propagates client-construction and downstream initialization failures.
 */
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
