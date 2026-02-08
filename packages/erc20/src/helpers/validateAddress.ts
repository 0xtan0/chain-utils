import type { Address } from "viem";
import { isAddress } from "viem";

import { InvalidAddress } from "../errors/contract.js";

export function validateAddress(address: string): asserts address is Address {
    if (!isAddress(address)) {
        throw new InvalidAddress(address);
    }
}
