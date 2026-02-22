import type { Hex } from "viem";

import { ChainUtilsFault } from "./base.js";

/**
 * Error thrown when a contract call or transaction reverts.
 */
export class ContractReverted extends ChainUtilsFault {
    override readonly name: string = "ContractReverted";
    readonly rawData?: Hex;
    readonly decodedMessage?: string;

    /**
     * @param {{ rawData?: Hex; decodedMessage?: string; cause?: Error }} [options] Optional revert payload details.
     * @returns {ContractReverted} A structured revert error with optional decoded metadata.
     */
    constructor(options?: { rawData?: Hex; decodedMessage?: string; cause?: Error }) {
        const metaMessages: string[] = [];
        if (options?.rawData) {
            metaMessages.push(`Raw data: ${options.rawData}`);
        }
        if (options?.decodedMessage) {
            metaMessages.push(`Decoded message: ${options.decodedMessage}`);
        }

        super(options?.decodedMessage ?? "Contract reverted", {
            cause: options?.cause,
            metaMessages: metaMessages.length > 0 ? metaMessages : undefined,
        });

        this.rawData = options?.rawData;
        this.decodedMessage = options?.decodedMessage;
    }
}
