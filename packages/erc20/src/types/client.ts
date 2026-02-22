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
 *
 * @example
 * ```ts
 * const read = createERC20Client({ client: publicClient });
 * const balance = await read.getBalance(token, holder);
 * ```
 */
export interface IERC20Read {
    /** The underlying generic contract client. */
    readonly contract: ContractClient<ERC20Abi>;

    /** The chain this client operates on. */
    readonly chainId: number;

    /** Whether this chain supports multicall3. */
    readonly supportsMulticall: boolean;

    // ---- Single reads ----

    /**
     * Resolves token metadata (`name`, `symbol`, `decimals`) from chain.
     *
     * @param {Address} token ERC20 token address.
     * @returns {Promise<TokenMetadata>} Token metadata bound to this client chain.
     * @throws {InvalidAddress} Thrown when `token` is not a valid EVM address.
     * @throws {ContractReverted} Thrown when the target contract call reverts.
     * @throws {Error} Propagates underlying RPC/read failures.
     */
    getTokenMetadata(token: Address): Promise<TokenMetadata>;

    /**
     * Reads a holder balance for one token.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} holder Holder wallet address.
     * @returns {Promise<TokenBalance>} Balance result with token and holder context.
     * @throws {InvalidAddress} Thrown when `token` or `holder` is not a valid EVM address.
     * @throws {ContractReverted} Thrown when the target contract call reverts.
     * @throws {Error} Propagates underlying RPC/read failures.
     */
    getBalance(token: Address, holder: Address): Promise<TokenBalance>;

    /**
     * Reads allowance for one owner/spender pair.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} owner Owner wallet address.
     * @param {Address} spender Spender wallet address.
     * @returns {Promise<TokenAllowance>} Allowance result with token and owner/spender context.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ContractReverted} Thrown when the target contract call reverts.
     * @throws {Error} Propagates underlying RPC/read failures.
     */
    getAllowance(token: Address, owner: Address, spender: Address): Promise<TokenAllowance>;

    /**
     * Reads token total supply.
     *
     * @param {Address} token ERC20 token address.
     * @returns {Promise<bigint>} Total token supply in base units.
     * @throws {InvalidAddress} Thrown when `token` is not a valid EVM address.
     * @throws {ContractReverted} Thrown when the target contract call reverts.
     * @throws {Error} Propagates underlying RPC/read failures.
     */
    getTotalSupply(token: Address): Promise<bigint>;

    // ---- Batch reads (multicall) ----

    /**
     * Reads multiple balances in a single chain-scoped batch.
     *
     * @param {ReadonlyArray<BalanceQuery>} queries Balance queries to execute.
     * @returns {Promise<BatchBalanceResult>} Raw per-query results and normalized failures.
     * @throws {InvalidAddress} Thrown when any query contains an invalid address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getBalances(queries: ReadonlyArray<BalanceQuery>): Promise<BatchBalanceResult>;

    /**
     * Reads multiple allowances in a single chain-scoped batch.
     *
     * @param {ReadonlyArray<AllowanceQuery>} queries Allowance queries to execute.
     * @returns {Promise<BatchAllowanceResult>} Raw per-query results and normalized failures.
     * @throws {InvalidAddress} Thrown when any query contains an invalid address.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
    getAllowances(queries: ReadonlyArray<AllowanceQuery>): Promise<BatchAllowanceResult>;

    /**
     * Reads metadata for multiple tokens in one batch.
     *
     * @param {ReadonlyArray<Address>} tokens Token addresses to fetch.
     * @returns {Promise<ReadonlyArray<TokenMetadataResult>>} Per-token success/failure metadata results.
     * @throws {InvalidAddress} Thrown when any token address is invalid.
     * @throws {MulticallBatchFailure} Thrown when the multicall request fails as a whole.
     */
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

    /**
     * Prepares an ERC20 `approve` transaction.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} spender Address to approve.
     * @param {bigint} amount Allowance amount in base units.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `token` or `spender` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation or RPC failures.
     */
    prepareApprove(token: Address, spender: Address, amount: bigint): Promise<PreparedTransaction>;

    /**
     * Prepares an ERC20 `transfer` transaction.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `token` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation or RPC failures.
     */
    prepareTransfer(token: Address, to: Address, amount: bigint): Promise<PreparedTransaction>;

    /**
     * Prepares an ERC20 `transferFrom` transaction.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} from Owner address tokens are transferred from.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation or RPC failures.
     */
    prepareTransferFrom(
        token: Address,
        from: Address,
        to: Address,
        amount: bigint,
    ): Promise<PreparedTransaction>;

    // ---- Sign (returns signed bytes, no broadcast) ----

    /**
     * Signs a prepared transaction.
     *
     * @param {PreparedTransaction} prepared Prepared payload from a `prepare*` method.
     * @returns {Promise<SignedTransaction>} Signed transaction bytes with chain metadata.
     * @throws {ChainUtilsFault} Thrown for chain mismatches or missing wallet/account.
     * @throws {Error} Propagates signer failures.
     */
    signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction>;

    // ---- Send (broadcast signed tx) ----

    /**
     * Broadcasts a signed transaction.
     *
     * @param {SignedTransaction} signed Signed transaction payload.
     * @returns {Promise<Hash>} Transaction hash.
     * @throws {ChainUtilsFault} Thrown when signed payload chain ID mismatches the client chain.
     * @throws {Error} Propagates broadcast failures.
     */
    sendTransaction(signed: SignedTransaction): Promise<Hash>;

    // ---- Wait (wait for tx to be mined) ----

    /**
     * Waits for transaction inclusion.
     *
     * @param {Hash} hash Transaction hash.
     * @returns {Promise<TransactionReceipt>} Final transaction receipt.
     * @throws {Error} Propagates receipt polling failures.
     */
    waitForReceipt(hash: Hash): Promise<TransactionReceipt>;

    // ---- Convenience methods (full pipeline) ----

    /**
     * Executes ERC20 `approve` end-to-end (`prepare -> sign -> send`).
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} spender Address to approve.
     * @param {bigint} amount Allowance amount in base units.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or receipt.
     * @throws {InvalidAddress} Thrown when `token` or `spender` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
    approve(
        token: Address,
        spender: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    /**
     * Executes ERC20 `transfer` end-to-end (`prepare -> sign -> send`).
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or receipt.
     * @throws {InvalidAddress} Thrown when `token` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
    transfer(
        token: Address,
        to: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt>;

    /**
     * Executes ERC20 `transferFrom` end-to-end (`prepare -> sign -> send`).
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} from Owner address tokens are transferred from.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or receipt.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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
 *
 * @template TChainId Literal union of configured chain IDs.
 */
export interface IERC20MultichainClient<TChainId extends number> {
    /** The underlying generic multichain contract. */
    readonly multichain: MultichainContract<ERC20Abi, TChainId>;

    /** All configured chain IDs. */
    readonly chainIds: ReadonlyArray<TChainId>;

    /**
     * Returns the single-chain read client for a chain.
     *
     * @param {TChainId} chainId Chain ID to resolve.
     * @returns {IERC20Read} Chain-scoped read client.
     * @throws {UnsupportedChain} Thrown when `chainId` is not configured.
     */
    getClient(chainId: TChainId): IERC20Read;

    /**
     * Checks whether a chain is configured.
     *
     * @param {number} chainId Chain ID to test.
     * @returns {boolean} `true` when chain exists in this client.
     */
    hasChain(chainId: number): boolean;

    // ---- Cross-chain reads (raw address) ----

    /**
     * Reads one holder balance for one token across multiple chains.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} holder Holder wallet address.
     * @param {ReadonlyArray<TChainId>} chainIds Target chains.
     * @returns {Promise<CrossChainBatchResult<BatchBalanceResult>>} Per-chain success/failure results.
     */
    getBalanceAcrossChains(
        token: Address,
        holder: Address,
        chainIds: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    /**
     * Executes balance queries grouped by chain.
     *
     * @param {ReadonlyArray<BalanceQuery & { chainId: TChainId }>} queries Balance queries with explicit chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchBalanceResult>>} Per-chain success/failure results.
     */
    getBalances(
        queries: ReadonlyArray<BalanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>>;

    /**
     * Executes allowance queries grouped by chain.
     *
     * @param {ReadonlyArray<AllowanceQuery & { chainId: TChainId }>} queries Allowance queries with explicit chain IDs.
     * @returns {Promise<CrossChainBatchResult<BatchAllowanceResult>>} Per-chain success/failure results.
     */
    getAllowances(
        queries: ReadonlyArray<AllowanceQuery & { chainId: TChainId }>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>>;

    // ---- Cross-chain reads (token definition) ----

    /**
     * Reads token balance across token-supported chains.
     *
     * @template TTokenChainId Token definition chain union (subset of client chains).
     * @param {ITokenDefinition<TTokenChainId>} token Token definition.
     * @param {Address} holder Holder wallet address.
     * @param {ReadonlyArray<TTokenChainId>} [chainIds] Optional target subset; defaults to overlapping chains.
     * @returns {Promise<CrossChainBatchResult<TokenBalance>>} Per-chain token balance results.
     */
    getTokenBalance<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        holder: Address,
        chainIds?: ReadonlyArray<TTokenChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>>;

    /**
     * Reads token allowance across token-supported chains.
     *
     * @template TTokenChainId Token definition chain union (subset of client chains).
     * @param {ITokenDefinition<TTokenChainId>} token Token definition.
     * @param {Address} owner Token owner address.
     * @param {Address} spender Spender address.
     * @param {ReadonlyArray<TTokenChainId>} [chainIds] Optional target subset; defaults to overlapping chains.
     * @returns {Promise<CrossChainBatchResult<BatchAllowanceResult>>} Per-chain token allowance results.
     */
    getTokenAllowance<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TTokenChainId>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>>;

    // ---- Bound token ----

    /**
     * Binds a token definition to this multichain client.
     *
     * @template TTokenChainId Token definition chain union (subset of client chains).
     * @param {ITokenDefinition<TTokenChainId>} token Token definition.
     * @param {boolean} [returnIntersectionChains] When `true`, bind only valid intersections instead of throwing for missing chains.
     * @returns {ERC20Token<TTokenChainId>} Bound token helper for chain-aware calls.
     * @throws {Error} Thrown when there are no overlapping chains or token metadata is incomplete.
     * @throws {ChainUtilsFault} Thrown when strict chain matching is required and overlap is incomplete.
     */
    forToken<TTokenChainId extends TChainId>(
        token: ITokenDefinition<TTokenChainId>,
        returnIntersectionChains?: boolean,
    ): ERC20Token<TTokenChainId>;
}
