import type { Hex } from "viem";

import { ChainUtilsFault } from "./base.js";

export class ContractReverted extends ChainUtilsFault {
    override readonly name = "ContractReverted";
    readonly rawData?: Hex;
    readonly decodedMessage?: string;

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
