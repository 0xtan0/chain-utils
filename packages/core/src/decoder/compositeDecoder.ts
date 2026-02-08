import type { Hex } from "viem";

import type { ChainUtilsFault } from "../errors/base.js";
import type { ErrorDecoder } from "./errorDecoder.js";
import { ContractReverted } from "../errors/revert.js";

/**
 * Chains multiple ErrorDecoders together.
 * Tries each decoder in order; returns the first non-null result.
 * Falls back to ContractReverted if all decoders return null.
 */
export class CompositeErrorDecoder implements ErrorDecoder {
    constructor(readonly decoders: ReadonlyArray<ErrorDecoder>) {}

    decode(rawData: Hex): ChainUtilsFault {
        for (const decoder of this.decoders) {
            const result = decoder.decode(rawData);
            if (result !== null) return result;
        }
        return new ContractReverted({ rawData });
    }
}
