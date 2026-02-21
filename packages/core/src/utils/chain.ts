import type { Chain } from "viem";

import type { ChainTransportConfig } from "../types/config.js";

export function resolveChainFromConfig(config: ChainTransportConfig): Chain {
    if (!config.multicallAddress) {
        return config.chain;
    }

    return {
        ...config.chain,
        contracts: {
            ...config.chain.contracts,
            multicall3: {
                ...config.chain.contracts?.multicall3,
                address: config.multicallAddress,
            },
        },
    };
}
