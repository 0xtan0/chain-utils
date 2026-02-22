import type { Hex } from "viem";

import type { ChainUtilsFault } from "../errors/base.js";
import type { ErrorDecoder } from "../types/errorDecoder.js";
import { ContractReverted } from "../errors/revert.js";

/**
 * Composes multiple decoders and resolves to the first successful decode.
 *
 * Decoders are evaluated in order. When none matches, a generic
 * `ContractReverted` error is returned.
 *
 * @example
 * ```ts
 * const decoder = new CompositeErrorDecoder([erc20Decoder, erc721Decoder]);
 * const fault = decoder.decode("0x08c379a0");
 * ```
 */
export class CompositeErrorDecoder implements ErrorDecoder {
    /**
     * @param {ReadonlyArray<ErrorDecoder>} decoders Ordered decoder chain.
     */
    constructor(readonly decoders: ReadonlyArray<ErrorDecoder>) {}

    /**
     * Decodes revert data with the configured decoder chain.
     *
     * @param {Hex} rawData Raw revert data (`0x` prefixed hex string).
     * @returns {ChainUtilsFault} First decoded fault, or `ContractReverted` as fallback.
     * @throws {Error} Propagates exceptions thrown by any decoder in the chain.
     */
    decode(rawData: Hex): ChainUtilsFault {
        for (const decoder of this.decoders) {
            const result = decoder.decode(rawData);
            if (result !== null) return result;
        }
        return new ContractReverted({ rawData });
    }
}
