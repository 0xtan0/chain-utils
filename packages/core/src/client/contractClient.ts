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

import type { ErrorDecoder } from "../types/errorDecoder.js";
import type { BatchResult, MulticallItemResult } from "../types/multicall.js";
import type { PreparedTransaction, SignedTransaction, WriteOptions } from "../types/transaction.js";
import { ChainUtilsFault } from "../errors/base.js";
import { MulticallBatchFailure } from "../errors/multicall.js";

/**
 * Configuration for constructing a `ContractClient`.
 *
 * @template TAbi ABI type handled by the client.
 * @property {TAbi} abi Contract ABI used for read/write encoding and decoding.
 * @property {PublicClient<Transport, Chain>} publicClient Chain-specific viem public client.
 * @property {WalletClient} [walletClient] Optional wallet client required for signing/write operations.
 * @property {ErrorDecoder} [errorDecoder] Optional decoder used to map raw revert data to typed errors.
 * @property {number} [multicallBatchSize] Optional batch size hint for multicall reads.
 */
export interface ContractClientOptions<TAbi extends Abi> {
    readonly abi: TAbi;
    readonly publicClient: PublicClient<Transport, Chain>;
    readonly walletClient?: WalletClient;
    readonly errorDecoder?: ErrorDecoder;
    readonly multicallBatchSize?: number;
}

/**
 * Single-chain contract client with typed read and write helpers.
 *
 * Reads can run one-by-one or through multicall (when available), while writes
 * follow a `prepare -> sign -> send` flow.
 *
 * @template TAbi ABI type handled by the client.
 *
 * @example
 * ```ts
 * const client = createContractClient({
 *   abi: erc20Abi,
 *   publicClient,
 *   walletClient,
 * });
 *
 * const symbol = await client.read(tokenAddress, "symbol");
 * const txHash = await client.execute(tokenAddress, "transfer", [to, 1n]);
 * ```
 */
export class ContractClient<TAbi extends Abi> {
    readonly abi: TAbi;
    readonly chainId: number;
    readonly publicClient: PublicClient<Transport, Chain>;
    readonly walletClient?: WalletClient;
    readonly supportsMulticall: boolean;

    private readonly errorDecoder?: ErrorDecoder;
    private readonly multicallBatchSize?: number;

    /**
     * @param {ContractClientOptions<TAbi>} options Contract client dependencies and behavior options.
     * @returns {ContractClient<TAbi>} A chain-bound contract client instance.
     */
    constructor(options: ContractClientOptions<TAbi>) {
        this.abi = options.abi;
        this.publicClient = options.publicClient;
        this.walletClient = options.walletClient;
        this.errorDecoder = options.errorDecoder;
        this.multicallBatchSize = options.multicallBatchSize;
        this.chainId = options.publicClient.chain.id;
        this.supportsMulticall = options.publicClient.chain.contracts?.multicall3 !== undefined;
    }

    /**
     * Executes a single read-only contract function.
     *
     * @template TFunctionName Read function name constrained by ABI.
     * @param {Address} address Target contract address.
     * @param {TFunctionName} functionName Read function name.
     * @param {ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>} [args] Positional function arguments.
     * @returns {Promise<ContractFunctionReturnType<TAbi, "pure" | "view", TFunctionName>>} Decoded contract return value.
     * @throws {Error} Propagates read errors from viem/RPC providers.
     */
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

    /**
     * Executes multiple read calls on the same chain.
     *
     * Uses multicall when supported and enabled; otherwise falls back to
     * sequential reads collected through `Promise.allSettled`.
     *
     * @param {ReadonlyArray<{ address: Address; functionName: string; args?: ReadonlyArray<unknown> }>} calls Read call descriptors.
     * @returns {Promise<BatchResult<unknown>>} Per-call success/failure results for this chain.
     * @throws {MulticallBatchFailure} Thrown when the multicall RPC request fails as a whole.
     */
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

    /**
     * Simulates and prepares a write transaction request.
     *
     * @param {Address} address Target contract address.
     * @param {string} functionName Contract write function name.
     * @param {ReadonlyArray<unknown>} [args] Positional write arguments.
     * @returns {Promise<PreparedTransaction>} Prepared transaction request with gas and chain metadata.
     * @throws {ChainUtilsFault} Throws decoded chain-utils faults when `errorDecoder` recognizes revert data.
     * @throws {Error} Propagates simulation or fee-estimation failures from viem/RPC providers.
     */
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

    /**
     * Signs a previously prepared transaction.
     *
     * @param {PreparedTransaction} prepared Prepared transaction payload from `prepare`.
     * @returns {Promise<SignedTransaction>} Signed serialized transaction bytes.
     * @throws {ChainUtilsFault} Thrown when chain IDs mismatch, wallet client is missing, or wallet account is missing.
     * @throws {Error} Propagates signing failures from viem wallet clients.
     */
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

    /**
     * Broadcasts a signed transaction.
     *
     * @param {SignedTransaction} signed Signed transaction payload.
     * @returns {Promise<Hash>} Transaction hash.
     * @throws {ChainUtilsFault} Thrown when signed payload chain ID does not match the client chain.
     * @throws {Error} Propagates broadcast failures from viem/RPC providers.
     */
    async send(signed: SignedTransaction): Promise<Hash> {
        this.assertChainConsistency(signed.chainId, "Signed transaction");

        return this.publicClient.sendRawTransaction({
            serializedTransaction: signed.serialized,
        });
    }

    /**
     * Waits for a transaction to be mined.
     *
     * @param {Hash} hash Transaction hash to track.
     * @returns {Promise<TransactionReceipt>} Final mined transaction receipt.
     * @throws {Error} Propagates receipt polling failures from viem/RPC providers.
     */
    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.publicClient.waitForTransactionReceipt({ hash });
    }

    /**
     * Convenience helper to prepare, sign, send, and optionally wait for receipt.
     *
     * @param {Address} address Target contract address.
     * @param {string} functionName Contract write function name.
     * @param {ReadonlyArray<unknown>} [args] Positional write arguments.
     * @param {WriteOptions} [options] Execution options controlling return behavior.
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash, or receipt when `waitForReceipt` is `true`.
     * @throws {ChainUtilsFault} Propagates chain-utils failures from `prepare`, `sign`, and `send`.
     * @throws {Error} Propagates any underlying viem/RPC/wallet errors.
     *
     * @example
     * ```ts
     * const receipt = await client.execute(
     *   tokenAddress,
     *   "approve",
     *   [spender, 1_000n],
     *   { waitForReceipt: true },
     * );
     * ```
     */
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

/**
 * Factory helper for creating a `ContractClient`.
 *
 * @template TAbi ABI type handled by the client.
 * @param {ContractClientOptions<TAbi>} options Contract client options.
 * @returns {ContractClient<TAbi>} New chain-bound contract client.
 */
export function createContractClient<TAbi extends Abi>(
    options: ContractClientOptions<TAbi>,
): ContractClient<TAbi> {
    return new ContractClient(options);
}
