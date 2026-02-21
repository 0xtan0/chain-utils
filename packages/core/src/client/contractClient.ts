import type {
    Abi,
    Address,
    Chain,
    ContractFunctionArgs,
    ContractFunctionName,
    ContractFunctionReturnType,
    Hash,
    Hex,
    PublicClient,
    TransactionReceipt,
    Transport,
    WalletClient,
} from "viem";
import { BaseError, encodeFunctionData, isHex } from "viem";

import type { ErrorDecoder } from "../decoder/errorDecoder.js";
import type { BatchResult, MulticallItemResult } from "../types/multicall.js";
import type { PreparedTransaction, SignedTransaction, WriteOptions } from "../types/transaction.js";
import { ChainUtilsFault } from "../errors/base.js";
import { MulticallBatchFailure } from "../errors/multicall.js";

export interface ContractClientOptions<TAbi extends Abi> {
    readonly abi: TAbi;
    readonly publicClient: PublicClient<Transport, Chain>;
    readonly walletClient?: WalletClient;
    readonly errorDecoder?: ErrorDecoder;
    readonly multicallBatchSize?: number;
}

export class ContractClient<TAbi extends Abi> {
    readonly abi: TAbi;
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

    async read<TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">>(
        address: Address,
        functionName: TFunctionName,
        args?: ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
    ): Promise<ContractFunctionReturnType<TAbi, "pure" | "view", TFunctionName>> {
        return this.publicClient.readContract({
            abi: this.abi as Abi,
            address,
            functionName,
            args: (args ?? []) as unknown[],
        }) as Promise<ContractFunctionReturnType<TAbi, "pure" | "view", TFunctionName>>;
    }

    async readBatch(
        calls: ReadonlyArray<{
            address: Address;
            functionName: string;
            args?: ReadonlyArray<unknown>;
        }>,
    ): Promise<BatchResult<unknown>> {
        if (calls.length === 0) {
            return { chainId: this.chainId, results: [] };
        }

        if (this.supportsMulticall && this.multicallBatchSize !== 0) {
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
            abi: this.abi as Abi,
            address: call.address,
            functionName: call.functionName,
            args: call.args ? [...call.args] : undefined,
        }));

        let raw;
        try {
            raw = await this.publicClient.multicall({
                contracts,
                allowFailure: true,
                ...(this.multicallBatchSize ? { batchSize: this.multicallBatchSize } : {}),
            });
        } catch (error) {
            const cause =
                error instanceof Error
                    ? error
                    : new Error(typeof error === "string" ? error : String(error));
            throw new MulticallBatchFailure(this.chainId, calls.length, { cause });
        }

        const results: MulticallItemResult<unknown>[] = raw.map((item) => {
            if (item.status === "success") {
                return { status: "success" as const, result: item.result };
            }
            return { status: "failure" as const, error: item.error };
        });

        return { chainId: this.chainId, results };
    }

    async prepare(
        address: Address,
        functionName: string,
        args?: ReadonlyArray<unknown>,
    ): Promise<PreparedTransaction> {
        const resolvedArgs = args ? [...args] : [];

        try {
            await this.publicClient.simulateContract({
                abi: this.abi as Abi,
                address,
                functionName,
                args: resolvedArgs,
                account: this.walletClient?.account,
            });
        } catch (error) {
            this.throwDecodedRevert(error);
        }

        const data = encodeFunctionData({
            abi: this.abi as Abi,
            functionName,
            args: resolvedArgs,
        });

        const account = this.walletClient?.account;
        try {
            const [gasEstimate, fees, nonce] = await Promise.all([
                this.publicClient.estimateGas({
                    to: address,
                    data,
                    account,
                }),
                this.publicClient.estimateFeesPerGas(),
                account
                    ? this.publicClient.getTransactionCount({ address: account.address })
                    : Promise.resolve(undefined),
            ]);

            return {
                request: {
                    to: address,
                    data,
                    gas: gasEstimate,
                    nonce,
                    maxFeePerGas: fees.maxFeePerGas,
                    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
                },
                gasEstimate,
                chainId: this.chainId,
            };
        } catch (error) {
            this.throwDecodedRevert(error);
        }
    }

    async sign(prepared: PreparedTransaction): Promise<SignedTransaction> {
        this.assertChainConsistency(prepared.chainId, "Prepared transaction");

        const walletClient = this.requireWalletClient();
        const { account } = walletClient;
        if (!account) {
            throw new ChainUtilsFault("WalletClient must have an account for signing");
        }
        const serialized = await walletClient.signTransaction({
            ...prepared.request,
            chain: this.publicClient.chain,
            account,
        });
        return { serialized, chainId: prepared.chainId };
    }

    async send(signed: SignedTransaction): Promise<Hash> {
        this.assertChainConsistency(signed.chainId, "Signed transaction");

        return this.publicClient.sendRawTransaction({
            serializedTransaction: signed.serialized,
        });
    }

    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.publicClient.waitForTransactionReceipt({ hash });
    }

    async execute(
        address: Address,
        functionName: string,
        args?: ReadonlyArray<unknown>,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        const prepared = await this.prepare(address, functionName, args);
        const signed = await this.sign(prepared);
        const hash = await this.send(signed);

        if (options?.waitForReceipt) {
            return this.waitForReceipt(hash);
        }
        return hash;
    }

    private requireWalletClient(): WalletClient {
        if (!this.walletClient) {
            throw new ChainUtilsFault("WalletClient is required for write operations");
        }
        return this.walletClient;
    }

    private throwDecodedRevert(error: unknown): never {
        if (this.errorDecoder && error instanceof BaseError) {
            const rawData = this.extractRevertData(error);
            if (rawData) {
                const decoded = this.errorDecoder.decode(rawData);
                if (decoded) throw decoded;
            }
        }
        throw error;
    }

    private extractRevertData(error: BaseError): Hex | undefined {
        const inner = error.walk((e) => typeof e === "object" && e !== null && "data" in e);
        if (inner && "data" in inner) {
            const { data } = inner;
            if (isHex(data)) return data;
        }
        return undefined;
    }

    private assertChainConsistency(actualChainId: number, payloadLabel: string): void {
        if (actualChainId !== this.chainId) {
            throw new ChainUtilsFault(`${payloadLabel} chain ID does not match client chain ID`, {
                metaMessages: [
                    `Expected chain ID: ${this.chainId}`,
                    `Actual chain ID: ${actualChainId}`,
                ],
            });
        }
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
                    abi: this.abi as Abi,
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
