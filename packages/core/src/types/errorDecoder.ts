import type { Hex } from "viem";

import type { ChainUtilsFault } from "../errors/base.js";

/**
 * Decodes raw EVM revert data into a typed chain-utils error.
 *
 * Implementations should return `null` when they do not recognize the payload,
 * so decoder chains can continue trying other implementations.
 */
export interface ErrorDecoder {
    /**
     * Attempts to decode revert data from a failed contract call/transaction.
     *
     * @param {Hex} rawData Raw revert data (`0x` prefixed hex string).
     * @returns {ChainUtilsFault | null} A decoded fault when recognized, otherwise `null`.
     * @throws {Error} Implementations may throw on malformed decoder state or unexpected decode failures.
     */
    decode(rawData: Hex): ChainUtilsFault | null;
}
