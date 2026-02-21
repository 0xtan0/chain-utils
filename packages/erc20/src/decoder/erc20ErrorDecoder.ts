import type { ChainUtilsFault, ErrorDecoder } from "@0xtan0/chain-utils/core";
import type { Abi, Hex } from "viem";
import { ContractReverted, formatDecodedErrorArgs } from "@0xtan0/chain-utils/core";
import { decodeErrorResult } from "viem";

import { erc20ErrorsAbi } from "../abi/erc20ErrorsAbi.js";
import {
    InsufficientAllowance,
    InsufficientBalance,
    InvalidApprover,
    InvalidReceiver,
    InvalidSender,
    InvalidSpender,
} from "../errors/revert.js";

/**
 * Decodes raw revert data against known ERC20 error selectors.
 *
 * Decoding order:
 *   1. Standard ERC20 errors (OZ v5 custom errors via erc20ErrorsAbi)
 *   2. Custom error ABI (user-provided)
 *   3. Legacy string revert messages
 *   4. Returns null if unrecognized
 */
export class ERC20ErrorDecoder implements ErrorDecoder {
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
                abi: erc20ErrorsAbi,
                data: rawData,
            });

            switch (decoded.errorName) {
                case "ERC20InsufficientBalance":
                    return new InsufficientBalance(
                        decoded.args[0],
                        decoded.args[1],
                        decoded.args[2],
                        { rawData },
                    );
                case "ERC20InsufficientAllowance":
                    return new InsufficientAllowance(
                        decoded.args[0],
                        decoded.args[1],
                        decoded.args[2],
                        { rawData },
                    );
                case "ERC20InvalidSender":
                    return new InvalidSender(decoded.args[0], { rawData });
                case "ERC20InvalidReceiver":
                    return new InvalidReceiver(decoded.args[0], { rawData });
                case "ERC20InvalidApprover":
                    return new InvalidApprover(decoded.args[0], { rawData });
                case "ERC20InvalidSpender":
                    return new InvalidSpender(decoded.args[0], { rawData });
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

            const argsStr = formatDecodedErrorArgs(decoded.args);
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

            if (message === "ERC20: transfer amount exceeds balance") {
                // Legacy pattern — no specific args available, use zero-address placeholders
                return new InsufficientBalance(
                    "0x0000000000000000000000000000000000000000",
                    0n,
                    0n,
                    { rawData },
                );
            }

            if (message === "ERC20: insufficient allowance") {
                return new InsufficientAllowance(
                    "0x0000000000000000000000000000000000000000",
                    0n,
                    0n,
                    { rawData },
                );
            }

            // Other string revert — wrap in ContractReverted
            return new ContractReverted({ rawData, decodedMessage: message });
        } catch {
            return null;
        }
    }
}
