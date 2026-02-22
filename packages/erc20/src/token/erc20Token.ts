import type { CrossChainBatchResult } from "@0xtan0/chain-utils-core";
import type { Address, Chain, PublicClient, Transport } from "viem";
import { ChainUtilsFault, MultichainClient } from "@0xtan0/chain-utils-core";

import type { IERC20Read } from "../types/client.js";
import type { ERC20Token } from "../types/erc20Token.js";
import type { BatchAllowanceResult, BatchBalanceResult } from "../types/query.js";
import type { TokenBalance } from "../types/token.js";
import { ERC20ReadClient } from "../client/erc20ReadClient.js";

/**
 * Construction options for `ERC20BoundToken`.
 *
 * @template TChainId Literal union of chain IDs where the token is bound.
 * @property {string} symbol Token symbol.
 * @property {string} name Token name.
 * @property {number} decimals Token decimals.
 * @property {ReadonlyMap<TChainId, Address>} addresses Chain-to-address map.
 * @property {MultichainClient<TChainId>} multichainClient Public-client registry used for lazy reader creation.
 * @property {ReadonlyMap<TChainId, IERC20Read>} [readClients] Optional pre-built read clients per chain.
 */
export interface ERC20BoundTokenOptions<TChainId extends number> {
    readonly symbol: string;
    readonly name: string;
    readonly decimals: number;
    readonly addresses: ReadonlyMap<TChainId, Address>;
    readonly multichainClient: MultichainClient<TChainId>;
    readonly readClients?: ReadonlyMap<TChainId, IERC20Read>;
}

/**
 * Bound ERC20 token helper.
 *
 * Combines chain-specific addresses with multichain RPC access and exposes
 * chain-aware read operations.
 *
 * @template TChainId Literal union of chain IDs where the token is bound.
 *
 * @example
 * ```ts
 * const usdc = multichainClient.forToken(USDC);
 * const balances = await usdc.getBalance(holder);
 * ```
 */
export class ERC20BoundToken<TChainId extends number> implements ERC20Token<TChainId> {
    readonly symbol: string;
    readonly name: string;
    readonly decimals: number;
    readonly chainIds: ReadonlyArray<TChainId>;

    readonly #addresses: ReadonlyMap<TChainId, Address>;
    readonly #multichainClient: MultichainClient<TChainId>;
    readonly #readClients?: ReadonlyMap<TChainId, IERC20Read>;
    readonly #clients: Map<TChainId, IERC20Read> = new Map();

    /**
     * @param {ERC20BoundTokenOptions<TChainId>} options Bound token options.
     * @returns {ERC20BoundToken<TChainId>} Bound token instance.
     */
    constructor(options: ERC20BoundTokenOptions<TChainId>) {
        this.symbol = options.symbol;
        this.name = options.name;
        this.decimals = options.decimals;
        this.#addresses = options.addresses;
        this.#multichainClient = options.multichainClient;
        this.#readClients = options.readClients;
        this.chainIds = [...options.addresses.keys()];
    }

    /**
     * Returns token address for a chain.
     *
     * @param {TChainId} chainId Target chain ID.
     * @returns {Address} Token address.
     * @throws {ChainUtilsFault} Thrown when the token is not bound on `chainId`.
     */
    getAddress(chainId: TChainId): Address {
        const addr = this.#addresses.get(chainId);
        if (addr === undefined) {
            throw new ChainUtilsFault(
                `Token ${this.symbol} is not bound on chain ${String(chainId)}`,
                {
                    metaMessages: [
                        `Symbol: ${this.symbol}`,
                        `Requested chain: ${String(chainId)}`,
                        `Bound chains: ${this.chainIds.join(", ")}`,
                    ],
                },
            );
        }
        return addr;
    }

    /**
     * Reads holder balance across bound chains.
     *
     * @param {Address} holder Holder wallet address.
     * @param {ReadonlyArray<TChainId>} [chainIds] Optional chain subset; defaults to all bound chains.
     * @returns {Promise<CrossChainBatchResult<TokenBalance>>} Per-chain success/failure balance results.
     */
    async getBalance(
        holder: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<TokenBalance>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) =>
            client.getBalance(this.getAddress(chainId), holder),
        );
    }

    /**
     * Reads balances for multiple holders across bound chains.
     *
     * @param {ReadonlyArray<Address>} holders Holder wallet addresses.
     * @param {ReadonlyArray<TChainId>} [chainIds] Optional chain subset; defaults to all bound chains.
     * @returns {Promise<CrossChainBatchResult<BatchBalanceResult>>} Per-chain success/failure batch results.
     */
    async getBalances(
        holders: ReadonlyArray<Address>,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchBalanceResult>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) => {
            const tokenAddress = this.getAddress(chainId);
            const queries = holders.map((holder) => ({ token: tokenAddress, holder }));
            return client.getBalances(queries);
        });
    }

    /**
     * Reads allowance across bound chains.
     *
     * @param {Address} owner Token owner address.
     * @param {Address} spender Spender address.
     * @param {ReadonlyArray<TChainId>} [chainIds] Optional chain subset; defaults to all bound chains.
     * @returns {Promise<CrossChainBatchResult<BatchAllowanceResult>>} Per-chain success/failure allowance results.
     */
    async getAllowance(
        owner: Address,
        spender: Address,
        chainIds?: ReadonlyArray<TChainId>,
    ): Promise<CrossChainBatchResult<BatchAllowanceResult>> {
        const targets = chainIds ?? this.chainIds;
        return this.#runAcrossChains(targets, (client, chainId) => {
            const tokenAddress = this.getAddress(chainId);
            return client.getAllowances([{ token: tokenAddress, owner, spender }]);
        });
    }

    #getReadClient(chainId: TChainId): IERC20Read {
        let client = this.#clients.get(chainId);
        if (!client) {
            client = this.#readClients?.get(chainId);
            if (!client) {
                const publicClient = this.#multichainClient.getPublicClient(
                    chainId,
                ) as PublicClient<Transport, Chain>;
                client = new ERC20ReadClient({ client: publicClient });
            }
            this.#clients.set(chainId, client);
        }
        return client;
    }

    async #runAcrossChains<T>(
        chainIds: ReadonlyArray<TChainId>,
        fn: (client: IERC20Read, chainId: TChainId) => Promise<T>,
    ): Promise<CrossChainBatchResult<T>> {
        const resultsByChain = new Map<number, T>();
        const failedChains: Array<{ readonly chainId: number; readonly error: Error }> = [];

        const settled = await Promise.allSettled(
            chainIds.map(async (chainId) => {
                const client = this.#getReadClient(chainId);
                const result = await fn(client, chainId);
                return { chainId, result };
            }),
        );

        for (let i = 0; i < settled.length; i++) {
            const entry = settled[i]!;
            if (entry.status === "fulfilled") {
                resultsByChain.set(entry.value.chainId, entry.value.result);
            } else {
                failedChains.push({
                    chainId: chainIds[i]!,
                    error:
                        entry.reason instanceof Error
                            ? entry.reason
                            : new Error(String(entry.reason)),
                });
            }
        }

        return { resultsByChain, failedChains };
    }
}
