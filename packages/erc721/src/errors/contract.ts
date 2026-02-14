import type { Address } from "viem";
import { ChainUtilsFault } from "@0xtan0/chain-utils/core";

export class InvalidAddress extends ChainUtilsFault {
    override readonly name = "InvalidAddress";
    readonly address: string;

    constructor(address: string) {
        super(`Invalid address: ${address}`, {
            metaMessages: [`Address: ${address}`],
        });
        this.address = address;
    }
}

export class NotERC721Contract extends ChainUtilsFault {
    override readonly name = "NotERC721Contract";
    readonly address: Address;
    readonly chainId: number;

    constructor(address: Address, chainId: number, options?: { cause?: Error }) {
        super(`Contract at ${address} on chain ${chainId} is not an ERC721 token`, {
            cause: options?.cause,
            metaMessages: [`Address: ${address}`, `Chain ID: ${chainId}`],
        });
        this.address = address;
        this.chainId = chainId;
    }
}

export class NotERC721Enumerable extends ChainUtilsFault {
    override readonly name = "NotERC721Enumerable";
    readonly address: Address;
    readonly chainId: number;

    constructor(address: Address, chainId: number, options?: { cause?: Error }) {
        super(`Contract at ${address} on chain ${chainId} does not support ERC721Enumerable`, {
            cause: options?.cause,
            metaMessages: [`Address: ${address}`, `Chain ID: ${chainId}`],
        });
        this.address = address;
        this.chainId = chainId;
    }
}
