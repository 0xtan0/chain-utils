import type { Hex, TransactionRequest } from "viem";

/**
 * Prepared write payload returned by `ContractClient.prepare`.
 *
 * @property {TransactionRequest} request Transaction request ready to be signed.
 * @property {bigint} gasEstimate Gas estimate used to build `request`.
 * @property {number} chainId Chain identifier that the payload is bound to.
 */
export interface PreparedTransaction {
    readonly request: TransactionRequest;
    readonly gasEstimate: bigint;
    readonly chainId: number;
}

/**
 * Signed transaction payload returned by `ContractClient.sign`.
 *
 * @property {Hex} serialized RLP-serialized transaction bytes.
 * @property {number} chainId Chain identifier that the signature is bound to.
 */
export interface SignedTransaction {
    readonly serialized: Hex;
    readonly chainId: number;
}

/**
 * Options for convenience write methods such as `ContractClient.execute`.
 *
 * @property {boolean} [waitForReceipt=false] When `true`, `execute` resolves to a mined receipt instead of a hash.
 */
export interface WriteOptions {
    /** If true, wait for the tx to be mined and return the receipt. Default: false. */
    readonly waitForReceipt?: boolean;
}
