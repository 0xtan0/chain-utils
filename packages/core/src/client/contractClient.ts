import type { Abi, Address, Chain, PublicClient, Transport, WalletClient } from "viem";

import type { ErrorDecoder } from "../decoder/errorDecoder.js";
import type { BatchResult, MulticallItemResult } from "../types/multicall.js";

export interface ContractClientOptions<TAbi extends Abi> {
    readonly abi: TAbi;
    readonly publicClient: PublicClient<Transport, Chain>;
    readonly walletClient?: WalletClient;
    readonly errorDecoder?: ErrorDecoder;
    readonly multicallBatchSize?: number;
}

export class ContractClient<TAbi extends Abi> {
    readonly abi: Abi;
    readonly chainId: number;
    readonly publicClient: PublicClient<Transport, Chain>;
    readonly walletClient?: WalletClient;
    readonly supportsMulticall: boolean;

    private readonly errorDecoder?: ErrorDecoder;
    private readonly multicallBatchSize?: number;

    constructor(options: ContractClientOptions<TAbi>) {
        this.abi = options.abi;
        this.publicClient = options.publicClient;
        this.walletClient = options.walletClient;
        this.errorDecoder = options.errorDecoder;
        this.multicallBatchSize = options.multicallBatchSize;
        this.chainId = options.publicClient.chain.id;
        this.supportsMulticall = options.publicClient.chain.contracts?.multicall3 !== undefined;
    }

    async read(
        address: Address,
        functionName: string,
        args?: ReadonlyArray<unknown>,
    ): Promise<unknown> {
        return this.publicClient.readContract({
            abi: this.abi,
            address,
            functionName,
            args: args ? [...args] : [],
        });
    }

    async readBatch(
        calls: ReadonlyArray<{
            address: Address;
            functionName: string;
            args?: ReadonlyArray<unknown>;
        }>,
    ): Promise<BatchResult<unknown>> {
        if (this.supportsMulticall) {
            return this.readBatchMulticall(calls);
        }
        return this.readBatchSequential(calls);
    }

    private async readBatchMulticall(
        calls: ReadonlyArray<{
            address: Address;
            functionName: string;
            args?: ReadonlyArray<unknown>;
        }>,
    ): Promise<BatchResult<unknown>> {
        const contracts = calls.map((call) => ({
            abi: this.abi,
            address: call.address,
            functionName: call.functionName,
            args: call.args ? [...call.args] : undefined,
        }));

        const raw = await this.publicClient.multicall({
            contracts,
            allowFailure: true,
            ...(this.multicallBatchSize ? { batchSize: this.multicallBatchSize } : {}),
        });

        const results: MulticallItemResult<unknown>[] = raw.map((item) => {
            if (item.status === "success") {
                return { status: "success" as const, result: item.result };
            }
            return { status: "failure" as const, error: item.error };
        });

        return { chainId: this.chainId, results };
    }

    private async readBatchSequential(
        calls: ReadonlyArray<{
            address: Address;
            functionName: string;
            args?: ReadonlyArray<unknown>;
        }>,
    ): Promise<BatchResult<unknown>> {
        const settled = await Promise.allSettled(
            calls.map((call) =>
                this.publicClient.readContract({
                    abi: this.abi,
                    address: call.address,
                    functionName: call.functionName,
                    args: call.args ? [...call.args] : undefined,
                }),
            ),
        );

        const results: MulticallItemResult<unknown>[] = settled.map((item) => {
            if (item.status === "fulfilled") {
                return { status: "success" as const, result: item.value };
            }
            return {
                status: "failure" as const,
                error: item.reason instanceof Error ? item.reason : new Error(String(item.reason)),
            };
        });

        return { chainId: this.chainId, results };
    }
}

export function createContractClient<TAbi extends Abi>(
    options: ContractClientOptions<TAbi>,
): ContractClient<TAbi> {
    return new ContractClient(options);
}
