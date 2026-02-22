import type { ErrorDecoder } from "@0xtan0/chain-utils-core";
import type { Abi, Chain, PublicClient, Transport, WalletClient } from "viem";

/**
 * Options for creating a single-chain ERC20 read client.
 *
 * @property {PublicClient<Transport, Chain>} client viem public client used for read operations.
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC20 decoding.
 * @property {Abi} [customErrorAbi] Optional custom error ABI for project-specific revert decoding.
 * @property {number} [multicallBatchSize] Optional multicall chunk size for large batches.
 */
export interface ERC20ClientOptions {
    readonly client: PublicClient<Transport, Chain>;
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly multicallBatchSize?: number;
}

/**
 * Options for creating a single-chain ERC20 write client.
 *
 * @property {PublicClient<Transport, Chain>} client viem public client used for reads and transaction submission.
 * @property {WalletClient} wallet client used for signing transactions.
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC20 decoding.
 * @property {Abi} [customErrorAbi] Optional custom error ABI for project-specific revert decoding.
 * @property {number} [multicallBatchSize] Optional multicall chunk size for large batches.
 */
export interface ERC20WriteClientOptions extends ERC20ClientOptions {
    readonly walletClient: WalletClient;
}

/**
 * Options for creating a multichain ERC20 client.
 *
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC20 decoding on every chain.
 * @property {Abi} [customErrorAbi] Optional custom error ABI shared by all chain clients.
 * @property {number} [defaultMulticallBatchSize] Optional default multicall chunk size for all read clients.
 */
export interface ERC20MultichainClientOptions {
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly defaultMulticallBatchSize?: number;
}
