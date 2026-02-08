import type { CrossChainBatchResult } from "@0xtan0/chain-utils/core";
import type { Address } from "viem";

import type { TokenAllowance, TokenBalance, TokenMetadata, TokenReference } from "./token.js";

/**
 * A bound ERC20 token — carries both per-chain addresses and RPC connections.
 *
 * Created via ERC20TokenBuilder or ERC20MultichainClient.forToken().
 * TChainId is a subset of the MultichainClient's supported chains.
 */
export interface ERC20Token<TChainId extends number> {
    /** Token symbol (e.g. "USDC"). */
    readonly symbol: string;

    /** Optional pre-set metadata (avoids on-chain fetch when present). */
    readonly name?: string;
    readonly decimals?: number;

    /** All chain IDs this token is bound on. */
    readonly chainIds: ReadonlyArray<TChainId>;

    /** Get the token's address on a specific chain. */
    address(chainId: TChainId): Address;

    /** Check if this token is bound on the given chain. */
    hasChain(chainId: number): boolean;

    /** Build a TokenReference for a specific chain. */
    toTokenReference(chainId: TChainId): TokenReference;

    // ---- On-chain reads (uses the bound MultichainClient RPCs) ----

    /**
     * Fetch balance across all bound chains (or a subset).
     * Uses the MultichainClient's RPC connections.
     */
    getBalance(
        holder: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>>;

    /**
     * Fetch allowance across all bound chains (or a subset).
     */
    getAllowance(
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenAllowance>>;

    /**
     * Fetch token metadata from a specific chain.
     * If name/decimals were set in the definition, returns them
     * without an RPC call.
     */
    getMetadata(chainId?: TChainId): Promise<TokenMetadata>;

    /** Fetch total supply on a specific chain. */
    getTotalSupply(chainId: TChainId): Promise<bigint>;
}
