import { ChainUtilsFault } from "./base.js";

/**
 * Error thrown when a requested chain is not configured in the current client.
 */
export class UnsupportedChain extends ChainUtilsFault {
    override readonly name = "UnsupportedChain";
    readonly chainId: number;
    readonly availableChainIds?: number[];

    /**
     * @param {number} chainId Chain identifier that was requested.
     * @param {{ availableChainIds?: number[] }} [options] Optional list of configured chain IDs.
     * @returns {UnsupportedChain} A structured unsupported-chain error.
     */
    constructor(chainId: number, options?: { availableChainIds?: number[] }) {
        const metaMessages = options?.availableChainIds
            ? [`Available chain IDs: ${options.availableChainIds.join(", ")}`]
            : undefined;

        super(`Chain ${chainId} is not supported`, { metaMessages });

        this.chainId = chainId;
        this.availableChainIds = options?.availableChainIds;
    }
}

/**
 * Error thrown when an RPC operation fails for a specific chain.
 */
export class RpcFailure extends ChainUtilsFault {
    override readonly name = "RpcFailure";
    readonly chainId: number;
    readonly rpcUrl?: string;

    /**
     * @param {string} message Human-readable RPC failure message.
     * @param {{ chainId: number; cause?: Error; rpcUrl?: string }} options Context for the failing RPC.
     * @returns {RpcFailure} A structured RPC failure error.
     */
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

/**
 * Error thrown when multicall is requested on a chain without multicall support.
 */
export class MulticallNotSupported extends ChainUtilsFault {
    override readonly name = "MulticallNotSupported";
    readonly chainId: number;

    /**
     * @param {number} chainId Chain identifier where multicall is unavailable.
     * @returns {MulticallNotSupported} A structured multicall-support error.
     */
    constructor(chainId: number) {
        super(`Multicall is not supported on chain ${chainId}`);

        this.chainId = chainId;
    }
}
