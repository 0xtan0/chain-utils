import type { Hex, TransactionRequest } from "viem";

/**
 * Result of a prepare step: simulated tx + gas estimate.
 * Ready to be signed, but NOT yet signed or sent.
 */
export interface PreparedTransaction {
    readonly request: TransactionRequest;
    readonly gasEstimate: bigint;
    readonly chainId: number;
}

/**
 * A signed transaction, serialized as hex bytes.
 * Ready to be broadcast, but NOT yet sent.
 */
export interface SignedTransaction {
    readonly serialized: Hex;
    readonly chainId: number;
}

/**
 * Options for convenience write methods.
 */
export interface WriteOptions {
    /** If true, wait for the tx to be mined and return the receipt. Default: false. */
    readonly waitForReceipt?: boolean;
}
