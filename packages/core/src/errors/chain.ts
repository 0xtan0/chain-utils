import { ChainUtilsFault } from "./base.js";

export class UnsupportedChain extends ChainUtilsFault {
    override readonly name = "UnsupportedChain";
    readonly chainId: number;
    readonly availableChainIds?: number[];

    constructor(chainId: number, options?: { availableChainIds?: number[] }) {
        const metaMessages = options?.availableChainIds
            ? [`Available chain IDs: ${options.availableChainIds.join(", ")}`]
            : undefined;

        super(`Chain ${chainId} is not supported`, { metaMessages });

        this.chainId = chainId;
        this.availableChainIds = options?.availableChainIds;
    }
}

export class RpcFailure extends ChainUtilsFault {
    override readonly name = "RpcFailure";
    readonly chainId: number;
    readonly rpcUrl?: string;

    constructor(message: string, options: { chainId: number; cause?: Error; rpcUrl?: string }) {
        const metaMessages = [`Chain ID: ${options.chainId}`];
        if (options.rpcUrl) {
            metaMessages.push(`RPC URL: ${options.rpcUrl}`);
        }

        super(message, { cause: options.cause, metaMessages });

        this.chainId = options.chainId;
        this.rpcUrl = options.rpcUrl;
    }
}

export class MulticallNotSupported extends ChainUtilsFault {
    override readonly name = "MulticallNotSupported";
    readonly chainId: number;

    constructor(chainId: number) {
        super(`Multicall is not supported on chain ${chainId}`);

        this.chainId = chainId;
    }
}
