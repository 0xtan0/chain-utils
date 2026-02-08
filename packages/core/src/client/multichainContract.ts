import type { Abi, Address, Chain, PublicClient, Transport } from "viem";
import { createPublicClient } from "viem";

import type { ErrorDecoder } from "../decoder/errorDecoder.js";
import type { ChainTransportConfig } from "../types/config.js";
import type { BatchResult, CrossChainBatchResult } from "../types/multicall.js";
import { UnsupportedChain } from "../errors/chain.js";
import { ContractClient } from "./contractClient.js";
import { createMultichainClient, MultichainClient } from "./multichainClient.js";

export interface MultichainContractOptions<TAbi extends Abi> {
    readonly abi: TAbi;
    readonly errorDecoder?: ErrorDecoder;
    readonly multicallBatchSize?: number;
}

export class MultichainContract<TAbi extends Abi, TChainId extends number> {
    readonly multichainClient: MultichainClient<TChainId>;
    readonly chainIds: ReadonlyArray<TChainId>;

    private readonly clients: ReadonlyMap<TChainId, ContractClient<TAbi>>;
    private readonly options: MultichainContractOptions<TAbi>;

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

    getClient(chainId: TChainId): ContractClient<TAbi> {
        const client = this.clients.get(chainId);
        if (!client) {
            throw new UnsupportedChain(chainId, {
                availableChainIds: [...this.chainIds],
            });
        }
        return client;
    }

    hasChain(chainId: number): boolean {
        return this.multichainClient.hasChain(chainId);
    }

    withChain<TNewChainId extends number>(
        input: PublicClient<Transport, Chain> | ChainTransportConfig,
    ): MultichainContract<TAbi, TChainId | TNewChainId> {
        const publicClient =
            "request" in input
                ? input
                : createPublicClient({ chain: input.chain, transport: input.transport });

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

/** Create from a MultichainClient. */
export function createMultichainContract<TAbi extends Abi, TChainId extends number>(
    options: MultichainContractOptions<TAbi> & { multichainClient: MultichainClient<TChainId> },
): MultichainContract<TAbi, TChainId>;

/** Create from pre-built PublicClients. */
export function createMultichainContract<
    TAbi extends Abi,
    const TClients extends readonly PublicClient<Transport, Chain>[],
>(
    options: MultichainContractOptions<TAbi> & { clients: TClients },
): MultichainContract<TAbi, TClients[number]["chain"]["id"]>;

/** Create from ChainTransportConfig array. */
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
