import type { CrossChainBatchResult } from "@0xtan0/chain-utils/core";
import type { Address } from "viem";

import type { BatchAllowanceResult, BatchBalanceResult } from "../types/query.js";
import type { TokenBalance } from "../types/token.js";

/**
 * A token definition bound to a multichain client.
 * Allows calling read operations without passing addresses each time.
 * Implementation provided by future tasks.
 */
export interface ERC20Token<TChainId extends number> {
    readonly symbol: string;
    readonly name: string;
    readonly decimals: number;
    readonly chainIds: ReadonlyArray<TChainId>;

    getAddress(chainId: TChainId): Address;

    getBalance(
        holder: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>>;

    getBalances(
        holders: ReadonlyArray<Address>,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    getAllowance(
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>>;
}
