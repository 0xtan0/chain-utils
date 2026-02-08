import type { Hex } from "viem";

import type { ChainUtilsFault } from "../errors/base.js";

/**
 * Interface for decoding raw revert data into typed errors.
 * Implementations follow the chain-of-responsibility pattern:
 * try to decode, return null if unrecognized.
 */
export interface ErrorDecoder {
    decode(rawData: Hex): ChainUtilsFault | null;
}
