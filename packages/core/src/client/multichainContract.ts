import type { Abi, Address, Chain, PublicClient, Transport } from "viem";
import { createPublicClient } from "viem";

import type { ChainTransportConfig } from "../types/config.js";
import type { ErrorDecoder } from "../types/errorDecoder.js";
import type { BatchResult, CrossChainBatchResult } from "../types/multicall.js";
import { UnsupportedChain } from "../errors/chain.js";
import { resolveChainFromConfig } from "../utils/chain.js";
import { ContractClient } from "./contractClient.js";
import { createMultichainClient, MultichainClient } from "./multichainClient.js";

/**
 * Configuration shared across all chain-specific `ContractClient` instances.
 *
 * @template TAbi ABI type used on every configured chain.
 * @property {TAbi} abi Contract ABI used by every per-chain client.
 * @property {ErrorDecoder} [errorDecoder] Optional decoder for mapping raw revert data.
 * @property {number} [multicallBatchSize] Optional multicall batch size hint.
 */
export interface MultichainContractOptions<TAbi extends Abi> {
    readonly abi: TAbi;
    readonly errorDecoder?: ErrorDecoder;
    readonly multicallBatchSize?: number;
}

/**
 * Multichain contract facade that delegates to chain-specific `ContractClient` instances.
 *
 * @template TAbi ABI type shared across chains.
 * @template TChainId Literal union of configured chain IDs.
 *
 * @example
 * ```ts
 * const mc = createMultichainContract({
 *   abi: erc20Abi,
 *   clients: [mainnetClient, baseClient] as const,
 * });
 *
 * const balances = await mc.readAcrossChains([
 *   { chainId: 1, address: tokenA, functionName: "balanceOf", args: [owner] },
 *   { chainId: 8453, address: tokenB, functionName: "balanceOf", args: [owner] },
 * ]);
 * ```
 */
export class MultichainContract<TAbi extends Abi, TChainId extends number> {
    readonly multichainClient: MultichainClient<TChainId>;
    readonly chainIds: ReadonlyArray<TChainId>;

    private readonly clients: ReadonlyMap<TChainId, ContractClient<TAbi>>;
    private readonly options: MultichainContractOptions<TAbi>;

    /**
     * @param {MultichainClient<TChainId>} multichainClient Underlying multichain RPC clients.
     * @param {ReadonlyMap<TChainId, ContractClient<TAbi>>} clients Per-chain contract clients.
     * @param {MultichainContractOptions<TAbi>} options Shared contract options.
     * @returns {MultichainContract<TAbi, TChainId>} A multichain contract facade.
     */
    constructor(
        multichainClient: MultichainClient<TChainId>,
        clients: ReadonlyMap<TChainId, ContractClient<TAbi>>,
        options: MultichainContractOptions<TAbi>,
    ) {
        this.multichainClient = multichainClient;
        this.clients = clients;
        this.options = options;
        this.chainIds = multichainClient.chainIds;
    }

    /**
     * Returns the per-chain `ContractClient`.
     *
     * @param {TChainId} chainId Target chain identifier.
     * @returns {ContractClient<TAbi>} Contract client bound to `chainId`.
     * @throws {UnsupportedChain} Thrown when `chainId` is not configured.
     */
    getClient(chainId: TChainId): ContractClient<TAbi> {
        const client = this.clients.get(chainId);
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
     * @param {number} chainId Chain identifier to test.
     * @returns {boolean} `true` when a client is configured for the chain.
     */
    hasChain(chainId: number): boolean {
        return this.multichainClient.hasChain(chainId);
    }

    /**
     * Returns a new immutable multichain contract with one additional chain.
     *
     * @template TNewChainId New chain ID literal type.
     * @param {PublicClient<Transport, Chain> | ChainTransportConfig} input Existing client or config used to create one.
     * @returns {MultichainContract<TAbi, TChainId | TNewChainId>} New instance including the added chain.
     * @throws {Error} Propagates viem client-construction errors when creating from config.
     */
    withChain<TNewChainId extends number>(
        input: PublicClient<Transport, Chain> | ChainTransportConfig,
    ): MultichainContract<TAbi, TChainId | TNewChainId> {
        const publicClient =
            "request" in input
                ? input
                : createPublicClient({
                      chain: resolveChainFromConfig(input),
                      transport: input.transport,
                  });

        const newMultichainClient = this.multichainClient.withChain<TNewChainId>(publicClient);
        const newContractClient = new ContractClient<TAbi>({
            abi: this.options.abi,
            publicClient,
            errorDecoder: this.options.errorDecoder,
            multicallBatchSize: this.options.multicallBatchSize,
        });
        const newClients = new Map<TChainId | TNewChainId, ContractClient<TAbi>>(this.clients);
        newClients.set(publicClient.chain.id as TNewChainId, newContractClient);
        return new MultichainContract(newMultichainClient, newClients, this.options);
    }

    /**
     * Executes grouped read batches across multiple chains.
     *
     * Each chain is processed independently; failures are collected in `failedChains`
     * and do not reject the whole operation.
     *
     * @param {ReadonlyArray<{ chainId: TChainId; address: Address; functionName: string; args?: ReadonlyArray<unknown> }>} calls Cross-chain read calls.
     * @returns {Promise<CrossChainBatchResult<BatchResult<unknown>>>} Successful results and per-chain failures.
     */
    async readAcrossChains(
        calls: ReadonlyArray<{
            chainId: TChainId;
            address: Address;
            functionName: string;
            args?: ReadonlyArray<unknown>;
        }>,
    ): Promise<CrossChainBatchResult<BatchResult<unknown>>> {
        const grouped = new Map<
            TChainId,
            Array<{ address: Address; functionName: string; args?: ReadonlyArray<unknown> }>
        >();
        for (const call of calls) {
            const existing = grouped.get(call.chainId) ?? [];
            existing.push({
                address: call.address,
                functionName: call.functionName,
                args: call.args,
            });
            grouped.set(call.chainId, existing);
        }

        const entries = [...grouped.entries()];
        const settled = await Promise.allSettled(
            entries.map(async ([chainId, chainCalls]) => {
                const client = this.getClient(chainId);
                return client.readBatch(chainCalls);
            }),
        );

        const resultsByChain = new Map<number, BatchResult<unknown>>();
        const failedChains: Array<{ chainId: number; error: Error }> = [];

        for (let i = 0; i < settled.length; i++) {
            const item = settled[i]!;
            const [chainId] = entries[i]!;
            if (item.status === "fulfilled") {
                resultsByChain.set(chainId, item.value);
            } else {
                failedChains.push({
                    chainId,
                    error:
                        item.reason instanceof Error ? item.reason : new Error(String(item.reason)),
                });
            }
        }

        return { resultsByChain, failedChains };
    }
}

function buildContractClients<TAbi extends Abi, TChainId extends number>(
    multichainClient: MultichainClient<TChainId>,
    options: MultichainContractOptions<TAbi>,
): ReadonlyMap<TChainId, ContractClient<TAbi>> {
    const map = new Map<TChainId, ContractClient<TAbi>>();
    for (const chainId of multichainClient.chainIds) {
        const publicClient = multichainClient.getPublicClient(chainId);
        map.set(
            chainId,
            new ContractClient({
                abi: options.abi,
                publicClient,
                errorDecoder: options.errorDecoder,
                multicallBatchSize: options.multicallBatchSize,
            }),
        );
    }
    return map;
}

/**
 * Creates a `MultichainContract` from an existing `MultichainClient`.
 *
 * @template TAbi ABI type shared across chains.
 * @template TChainId Literal chain ID union of the input multichain client.
 * @param {MultichainContractOptions<TAbi> & { multichainClient: MultichainClient<TChainId> }} options Multichain contract options.
 * @returns {MultichainContract<TAbi, TChainId>} New multichain contract facade.
 * @throws {Error} Propagates errors from underlying contract client construction.
 */
export function createMultichainContract<TAbi extends Abi, TChainId extends number>(
    options: MultichainContractOptions<TAbi> & { multichainClient: MultichainClient<TChainId> },
): MultichainContract<TAbi, TChainId>;

/**
 * Creates a `MultichainContract` from pre-built public clients.
 *
 * @template TAbi ABI type shared across chains.
 * @template TClients Readonly tuple of public clients with literal chain IDs.
 * @param {MultichainContractOptions<TAbi> & { clients: TClients }} options Multichain contract options.
 * @returns {MultichainContract<TAbi, TClients[number]["chain"]["id"]>} New multichain contract facade.
 * @throws {Error} Propagates duplicate-chain and client-construction failures.
 */
export function createMultichainContract<
    TAbi extends Abi,
    const TClients extends readonly PublicClient<Transport, Chain>[],
>(
    options: MultichainContractOptions<TAbi> & { clients: TClients },
): MultichainContract<TAbi, TClients[number]["chain"]["id"]>;

/**
 * Creates a `MultichainContract` from chain transport configs.
 *
 * @template TAbi ABI type shared across chains.
 * @template TConfigs Readonly tuple of transport configs with literal chain IDs.
 * @param {MultichainContractOptions<TAbi> & { configs: TConfigs }} options Multichain contract options.
 * @returns {MultichainContract<TAbi, TConfigs[number]["chain"]["id"]>} New multichain contract facade.
 * @throws {Error} Propagates duplicate-chain and client-construction failures.
 */
export function createMultichainContract<
    TAbi extends Abi,
    const TConfigs extends readonly ChainTransportConfig[],
>(
    options: MultichainContractOptions<TAbi> & { configs: TConfigs },
): MultichainContract<TAbi, TConfigs[number]["chain"]["id"]>;

export function createMultichainContract<TAbi extends Abi, TChainId extends number>(
    options: MultichainContractOptions<TAbi> & {
        multichainClient?: MultichainClient<TChainId>;
        clients?: readonly PublicClient<Transport, Chain>[];
        configs?: readonly ChainTransportConfig[];
    },
): MultichainContract<TAbi, TChainId> {
    let multichainClient: MultichainClient<TChainId>;

    if (options.multichainClient) {
        multichainClient = options.multichainClient;
    } else if (options.clients) {
        multichainClient = createMultichainClient(options.clients) as MultichainClient<TChainId>;
    } else if (options.configs) {
        multichainClient = createMultichainClient(options.configs) as MultichainClient<TChainId>;
    } else {
        throw new Error(
            "createMultichainContract requires one of: multichainClient, clients, or configs",
        );
    }

    const clients = buildContractClients(multichainClient, options);
    return new MultichainContract(multichainClient, clients, options);
}
