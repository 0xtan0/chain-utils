import type { ChainUtilsFault, ErrorDecoder } from "@0xtan0/chain-utils/core";
import type { Abi, Hex } from "viem";
import { ContractReverted } from "@0xtan0/chain-utils/core";
import { decodeErrorResult } from "viem";

import { erc721ErrorsAbi } from "../abi/erc721ErrorsAbi.js";
import {
    IncorrectOwner,
    InsufficientApproval,
    InvalidApprover,
    InvalidOperator,
    InvalidOwner,
    InvalidReceiver,
    InvalidSender,
    NonexistentToken,
} from "../errors/revert.js";

/**
 * Decodes raw revert data against known ERC721 error selectors.
 *
 * Decoding order:
 *   1. Standard ERC721 errors (OZ v5 custom errors via erc721ErrorsAbi)
 *   2. Custom error ABI (user-provided)
 *   3. Legacy string revert messages
 *   4. Returns null if unrecognized
 */
export class ERC721ErrorDecoder implements ErrorDecoder {
    private readonly customErrorAbi?: Abi;

    constructor(customErrorAbi?: Abi) {
        this.customErrorAbi = customErrorAbi;
    }

    decode(rawData: Hex): ChainUtilsFault | null {
        return (
            this.decodeStandardErrors(rawData) ??
            this.decodeCustomErrors(rawData) ??
            this.decodeLegacyStringRevert(rawData) ??
            null
        );
    }

    private decodeStandardErrors(rawData: Hex): ChainUtilsFault | null {
        try {
            const decoded = decodeErrorResult({
                abi: erc721ErrorsAbi,
                data: rawData,
            });

            switch (decoded.errorName) {
                case "ERC721InvalidOwner":
                    return new InvalidOwner(decoded.args[0], { rawData });
                case "ERC721NonexistentToken":
                    return new NonexistentToken(decoded.args[0], { rawData });
                case "ERC721IncorrectOwner":
                    return new IncorrectOwner(decoded.args[0], decoded.args[1], decoded.args[2], {
                        rawData,
                    });
                case "ERC721InvalidSender":
                    return new InvalidSender(decoded.args[0], { rawData });
                case "ERC721InvalidReceiver":
                    return new InvalidReceiver(decoded.args[0], { rawData });
                case "ERC721InsufficientApproval":
                    return new InsufficientApproval(decoded.args[0], decoded.args[1], { rawData });
                case "ERC721InvalidApprover":
                    return new InvalidApprover(decoded.args[0], { rawData });
                case "ERC721InvalidOperator":
                    return new InvalidOperator(decoded.args[0], { rawData });
                default:
                    return null;
            }
        } catch {
            return null;
        }
    }

    private decodeCustomErrors(rawData: Hex): ChainUtilsFault | null {
        if (!this.customErrorAbi) return null;

        try {
            const decoded = decodeErrorResult({
                abi: this.customErrorAbi,
                data: rawData,
            });

            const argsStr = decoded.args ? ` (${decoded.args.join(", ")})` : "";
            return new ContractReverted({
                rawData,
                decodedMessage: `${decoded.errorName}${argsStr}`,
            });
        } catch {
            return null;
        }
    }

    private decodeLegacyStringRevert(rawData: Hex): ChainUtilsFault | null {
        // Legacy string reverts are ABI-encoded as Error(string)
        // selector: 0x08c379a0
        if (!rawData.startsWith("0x08c379a0")) return null;

        try {
            const decoded = decodeErrorResult({
                abi: [
                    {
                        type: "error",
                        name: "Error",
                        inputs: [{ name: "message", type: "string" }],
                    },
                ],
                data: rawData,
            });

            const message = decoded.args[0] as string;
            return new ContractReverted({ rawData, decodedMessage: message });
        } catch {
            return null;
        }
    }
}
