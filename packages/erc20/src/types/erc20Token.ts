import type { CrossChainBatchResult } from "@0xtan0/chain-utils/core";
import type { Address } from "viem";

import type { BatchAllowanceResult, BatchBalanceResult } from "./query.js";
import type { TokenBalance } from "./token.js";

/**
 * A bound ERC20 token — carries both per-chain addresses and RPC connections.
 *
 * Created via ERC20TokenBuilder or ERC20MultichainClient.forToken().
 * TChainId is a subset of the MultichainClient's supported chains.
 *
 * @template TChainId Literal union of chain IDs this token is bound to.
 */
export interface ERC20Token<TChainId extends number> {
    /** Token symbol (e.g. "USDC"). */
    readonly symbol: string;

    /** Token name (e.g. "USD Coin"). */
    readonly name: string;

    /** Token decimals (e.g. 6). */
    readonly decimals: number;

    /** All chain IDs this token is bound on. */
    readonly chainIds: ReadonlyArray<TChainId>;

    /**
     * Returns token address for a chain.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {Address} Token address for that chain.
     * @throws {ChainUtilsFault} Thrown when the token is not bound on the requested chain.
     */
    getAddress(chainId: TChainId): Address;

    // ---- On-chain reads (uses the bound MultichainClient RPCs) ----

    /**
     * Fetch balance across all bound chains (or a subset).
     * Uses the MultichainClient's RPC connections.
     *
     * @param {Address} holder Holder wallet address.
     * @param {ReadonlyArray<TChainId>} [chainIds] Optional chain subset. Defaults to all bound chains.
     * @returns {Promise<CrossChainBatchResult<TokenBalance>>} Per-chain success/failure balance results.
     */
    getBalance(
        holder: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>>;

    /**
     * Fetch balances for multiple holders across all bound chains (or a subset).
     *
     * @param {ReadonlyArray<Address>} holders Holder wallet addresses.
     * @param {ReadonlyArray<TChainId>} [chainIds] Optional chain subset. Defaults to all bound chains.
     * @returns {Promise<CrossChainBatchResult<BatchBalanceResult>>} Per-chain success/failure batch results.
     */
    getBalances(
        holders: ReadonlyArray<Address>,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    /**
     * Fetch allowance across all bound chains (or a subset).
     *
     * @param {Address} owner Token owner address.
     * @param {Address} spender Spender address.
     * @param {ReadonlyArray<TChainId>} [chainIds] Optional chain subset. Defaults to all bound chains.
     * @returns {Promise<CrossChainBatchResult<BatchAllowanceResult>>} Per-chain success/failure allowance results.
     */
    getAllowance(
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>>;
}
