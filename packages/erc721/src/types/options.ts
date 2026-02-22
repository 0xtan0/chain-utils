import type { ErrorDecoder } from "@0xtan0/chain-utils-core";
import type { Abi, Address, Chain, PublicClient, Transport, WalletClient } from "viem";

/**
 * Options for creating a single-chain ERC721 read client.
 *
 * @property {PublicClient<Transport, Chain>} client viem public client used for read operations.
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC721 decoding.
 * @property {Abi} [customErrorAbi] Optional custom error ABI for project-specific revert decoding.
 * @property {number} [multicallBatchSize] Optional multicall chunk size for large batches.
 */
export interface ERC721ClientOptions {
    readonly client: PublicClient<Transport, Chain>;
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly multicallBatchSize?: number;
}

/**
 * Options for creating a single-chain ERC721 write client.
 *
 * @property {PublicClient<Transport, Chain>} client viem public client used for reads and transaction submission.
 * @property {WalletClient} walletClient viem wallet client used for signing transactions.
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC721 decoding.
 * @property {Abi} [customErrorAbi] Optional custom error ABI for project-specific revert decoding.
 * @property {number} [multicallBatchSize] Optional multicall chunk size for large batches.
 */
export interface ERC721WriteClientOptions extends ERC721ClientOptions {
    readonly walletClient: WalletClient;
}

/**
 * Options for creating a collection-bound ERC721 reader.
 *
 * @property {Address} collection ERC721 collection address to bind.
 * @property {PublicClient<Transport, Chain>} client viem public client used for read operations.
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC721 decoding.
 * @property {Abi} [customErrorAbi] Optional custom error ABI for project-specific revert decoding.
 * @property {number} [multicallBatchSize] Optional multicall chunk size for large batches.
 */
export interface ERC721CollectionReaderOptions extends ERC721ClientOptions {
    readonly collection: Address;
}

/**
 * Options for creating a collection-bound ERC721 writer.
 *
 * @property {Address} collection ERC721 collection address to bind.
 * @property {PublicClient<Transport, Chain>} client viem public client used for reads and transaction submission.
 * @property {WalletClient} walletClient viem wallet client used for signing transactions.
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC721 decoding.
 * @property {Abi} [customErrorAbi] Optional custom error ABI for project-specific revert decoding.
 * @property {number} [multicallBatchSize] Optional multicall chunk size for large batches.
 */
export interface ERC721CollectionWriterOptions extends ERC721WriteClientOptions {
    readonly collection: Address;
}

/**
 * Options for creating a multichain ERC721 client.
 *
 * @property {ErrorDecoder} [errorDecoder] Optional fallback decoder chained after ERC721 decoding on every chain.
 * @property {Abi} [customErrorAbi] Optional custom error ABI shared by all chain clients.
 * @property {number} [defaultMulticallBatchSize] Optional default multicall chunk size for all read clients.
 */
export interface ERC721MultichainClientOptions {
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly defaultMulticallBatchSize?: number;
}
