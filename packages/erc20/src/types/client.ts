import type {
    ContractClient,
    CrossChainBatchResult,
    MultichainContract,
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils/core";
import type { Address, Hash, TransactionReceipt } from "viem";

import type { ERC20Abi } from "../abi/erc20Abi.js";
import type { ERC20Token } from "./erc20Token.js";
import type {
    AllowanceQuery,
    BalanceQuery,
    BatchAllowanceResult,
    BatchBalanceResult,
} from "./query.js";
import type { TokenAllowance, TokenBalance, TokenMetadata, TokenMetadataResult } from "./token.js";
import type { ITokenDefinition } from "./tokenDefinition.js";

/**
 * Single-chain ERC20 read client.
 *
 * Composes a ContractClient<ERC20Abi> and provides typed,
 * domain-specific read operations.
 */
export interface IERC20Read {
    /** The underlying generic contract client. */
    readonly contract: ContractClient<ERC20Abi>;

    /** The chain this client operates on. */
    readonly chainId: number;

    /** Whether this chain supports multicall3. */
    readonly supportsMulticall: boolean;

    // ---- Single reads ----

    getTokenMetadata(token: Address): Promise<TokenMetadata>;
    getBalance(token: Address, holder: Address): Promise<TokenBalance>;
    getAllowance(token: Address, owner: Address, spender: Address): Promise<TokenAllowance>;
    getTotalSupply(token: Address): Promise<bigint>;

    // ---- Batch reads (multicall) ----

    getBalances(queries: ReadonlyArray<BalanceQuery>): Promise<BatchBalanceResult>;
    getAllowances(queries: ReadonlyArray<AllowanceQuery>): Promise<BatchAllowanceResult>;
    getTokenMetadataBatch(
        tokens: ReadonlyArray<Address>,
    ): Promise<ReadonlyArray<TokenMetadataResult>>;
}

/**
 * Single-chain ERC20 write client.
 *
 * Extends IERC20Read. Adds full transaction lifecycle
 * for approve, transfer, and transferFrom.
 */
export interface ERC20WriteClient extends IERC20Read {
    // ---- Prepare (simulate + gas estimate, no signing) ----

    prepareApprove(token: Address, spender: Address, amount: bigint): Promise<PreparedTransaction>;

    prepareTransfer(token: Address, to: Address, amount: bigint): Promise<PreparedTransaction>;

    prepareTransferFrom(
        token: Address,
        from: Address,
        to: Address,
        amount: bigint,
    ): Promise<PreparedTransaction>;

    // ---- Sign (returns signed bytes, no broadcast) ----

    signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction>;

    // ---- Send (broadcast signed tx) ----

    sendTransaction(signed: SignedTransaction): Promise<Hash>;

    // ---- Wait (wait for tx to be mined) ----

    waitForReceipt(hash: Hash): Promise<TransactionReceipt>;

    // ---- Convenience methods (full pipeline) ----

    approve(
        token: Address,
        spender: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    transfer(
        token: Address,
        to: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    transferFrom(
        token: Address,
        from: Address,
        to: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;
}

/**
 * Multi-chain ERC20 client.
 *
 * Composes a MultichainContract<ERC20Abi, TChainId>. Routes requests
 * to the correct single-chain IERC20Read based on chain ID.
 *
 * TChainId is a union of literal chain IDs captured at creation time,
 * providing compile-time safety.
 */
export interface IERC20MultichainClient<TChainId extends number> {
    /** The underlying generic multichain contract. */
    readonly multichain: MultichainContract<ERC20Abi, TChainId>;

    /** All configured chain IDs. */
    readonly chainIds: ReadonlyArray<TChainId>;

    /** Get the single-chain read client for a specific chain. */
    getClient(chainId: TChainId): IERC20Read;

    /** Check whether a chain is configured. */
    hasChain(chainId: number): boolean;

    // ---- Cross-chain reads (raw address) ----

    getBalanceAcrossChains(
        token: Address,
        holder: Address,
        chainIds: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    getBalances(
        queries: ReadonlyArray<BalanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    getAllowances(
        queries: ReadonlyArray<AllowanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>>;

    // ---- Cross-chain reads (token definition) ----

    getTokenBalance<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        holder: Address,
        chainIds?: ReadonlyArray<TTokenChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>>;

    getTokenAllowance<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TTokenChainId>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>>;

    // ---- Bound token ----

    forToken<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
    ): ERC20Token<TTokenChainId>;
}
