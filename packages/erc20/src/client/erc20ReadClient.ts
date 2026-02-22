import type { ContractClient, MulticallItemResult } from "@0xtan0/chain-utils-core";
import type { Address, WalletClient } from "viem";
import { CompositeErrorDecoder, createContractClient } from "@0xtan0/chain-utils-core";

import type { ERC20Abi } from "../abi/erc20Abi.js";
import type { IERC20Read } from "../types/client.js";
import type { ERC20ClientOptions } from "../types/options.js";
import type {
    AllowanceQuery,
    BalanceQuery,
    BatchAllowanceResult,
    BatchBalanceResult,
    BatchFailure,
} from "../types/query.js";
import type {
    TokenAllowance,
    TokenBalance,
    TokenMetadata,
    TokenMetadataResult,
} from "../types/token.js";
import { erc20Abi } from "../abi/erc20Abi.js";
import { ERC20ErrorDecoder } from "../decoder/erc20ErrorDecoder.js";
import { validateAddress } from "../helpers/validateAddress.js";

/**
 * Single-chain ERC20 read client.
 *
 * Wraps a generic `ContractClient<ERC20Abi>` with ERC20-specific read helpers.
 *
 * @example
 * ```ts
 * const read = new ERC20ReadClient({ client: publicClient });
 * const supply = await read.getTotalSupply(token);
 * ```
 */
export class ERC20ReadClient implements IERC20Read {
    readonly contract: ContractClient<ERC20Abi>;
    readonly chainId: number;
    readonly supportsMulticall: boolean;

    /**
     * @param {ERC20ClientOptions & { walletClient?: WalletClient }} options Read client options and optional wallet for shared contract client creation.
     * @returns {ERC20ReadClient} A chain-bound ERC20 read client.
     */
    constructor(options: ERC20ClientOptions & { walletClient?: WalletClient }) {
        const erc20Decoder = new ERC20ErrorDecoder(options.customErrorAbi);
        const errorDecoder = options.errorDecoder
            ? new CompositeErrorDecoder([erc20Decoder, options.errorDecoder])
            : erc20Decoder;

        this.contract = createContractClient({
            abi: erc20Abi,
            publicClient: options.client,
            walletClient: options.walletClient,
            errorDecoder,
            multicallBatchSize: options.multicallBatchSize,
        });
        this.chainId = this.contract.chainId;
        this.supportsMulticall = this.contract.supportsMulticall;
    }

    /**
     * Resolves token metadata (`name`, `symbol`, `decimals`).
     *
     * @param {Address} token ERC20 token address.
     * @returns {Promise<TokenMetadata>} Token metadata scoped to this chain.
     * @throws {InvalidAddress} Thrown when `token` is invalid.
     * @throws {ContractReverted} Thrown when one of the contract reads reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getTokenMetadata(token: Address): Promise<TokenMetadata> {
        validateAddress(token);

        const [name, symbol, decimals] = await Promise.all([
            this.contract.read(token, "name"),
            this.contract.read(token, "symbol"),
            this.contract.read(token, "decimals"),
        ]);

        return { address: token, chainId: this.chainId, name, symbol, decimals };
    }

    /**
     * Reads token balance for one holder.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} holder Holder wallet address.
     * @returns {Promise<TokenBalance>} Balance result with token and holder context.
     * @throws {InvalidAddress} Thrown when `token` or `holder` is invalid.
     * @throws {ContractReverted} Thrown when the contract read reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getBalance(token: Address, holder: Address): Promise<TokenBalance> {
        validateAddress(token);
        validateAddress(holder);

        const balance = await this.contract.read(token, "balanceOf", [holder]);

        return {
            token: { address: token, chainId: this.chainId },
            holder,
            balance,
        };
    }

    /**
     * Reads allowance for one owner/spender pair.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} owner Token owner address.
     * @param {Address} spender Approved spender address.
     * @returns {Promise<TokenAllowance>} Allowance result with token and owner/spender context.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ContractReverted} Thrown when the contract read reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getAllowance(token: Address, owner: Address, spender: Address): Promise<TokenAllowance> {
        validateAddress(token);
        validateAddress(owner);
        validateAddress(spender);

        const allowance = await this.contract.read(token, "allowance", [owner, spender]);

        return {
            token: { address: token, chainId: this.chainId },
            owner,
            spender,
            allowance,
        };
    }

    /**
     * Reads token total supply.
     *
     * @param {Address} token ERC20 token address.
     * @returns {Promise<bigint>} Total supply in base units.
     * @throws {InvalidAddress} Thrown when `token` is invalid.
     * @throws {ContractReverted} Thrown when the contract read reverts.
     * @throws {Error} Propagates RPC/read failures.
     */
    async getTotalSupply(token: Address): Promise<bigint> {
        validateAddress(token);
        return this.contract.read(token, "totalSupply");
    }

    /**
     * Reads multiple balances in one batch.
     *
     * @param {ReadonlyArray<BalanceQuery>} queries Balance queries.
     * @returns {Promise<BatchBalanceResult>} Batch response including raw per-query results and failures.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when multicall fails as a whole.
     */
    async getBalances(queries: ReadonlyArray<BalanceQuery>): Promise<BatchBalanceResult> {
        const calls = queries.map((q) => {
            validateAddress(q.token);
            validateAddress(q.holder);
            return {
                address: q.token,
                functionName: "balanceOf",
                args: [q.holder],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults(batch.results, queries);

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads multiple allowances in one batch.
     *
     * @param {ReadonlyArray<AllowanceQuery>} queries Allowance queries.
     * @returns {Promise<BatchAllowanceResult>} Batch response including raw per-query results and failures.
     * @throws {InvalidAddress} Thrown when any query contains invalid addresses.
     * @throws {MulticallBatchFailure} Thrown when multicall fails as a whole.
     */
    async getAllowances(queries: ReadonlyArray<AllowanceQuery>): Promise<BatchAllowanceResult> {
        const calls = queries.map((q) => {
            validateAddress(q.token);
            validateAddress(q.owner);
            validateAddress(q.spender);
            return {
                address: q.token,
                functionName: "allowance",
                args: [q.owner, q.spender],
            };
        });

        const batch = await this.contract.readBatch(calls);
        const { results, failures } = this.toBatchResults(batch.results, queries);

        return { chainId: batch.chainId, results, queries, failures };
    }

    /**
     * Reads metadata for multiple tokens in one batch.
     *
     * @param {ReadonlyArray<Address>} tokens Token addresses.
     * @returns {Promise<ReadonlyArray<TokenMetadataResult>>} Per-token metadata success/failure results.
     * @throws {InvalidAddress} Thrown when any token address is invalid.
     * @throws {MulticallBatchFailure} Thrown when multicall fails as a whole.
     *
     * @example
     * ```ts
     * const metadata = await readClient.getTokenMetadataBatch([usdc, usdt]);
     * ```
     */
    async getTokenMetadataBatch(
        tokens: ReadonlyArray<Address>,
    ): Promise<ReadonlyArray<TokenMetadataResult>> {
        for (const token of tokens) {
            validateAddress(token);
        }

        const calls = tokens.flatMap((token) => [
            { address: token, functionName: "name" },
            { address: token, functionName: "symbol" },
            { address: token, functionName: "decimals" },
        ]);

        const { results } = await this.contract.readBatch(calls);

        return tokens.map((token, i) =>
            this.toTokenMetadata(token, results.slice(i * 3, i * 3 + 3)),
        );
    }

    private toTokenMetadata(
        token: Address,
        [name, symbol, decimals]: ReadonlyArray<MulticallItemResult<unknown>>,
    ): TokenMetadataResult {
        if (
            name?.status === "success" &&
            symbol?.status === "success" &&
            decimals?.status === "success"
        ) {
            return {
                status: "success",
                data: {
                    address: token,
                    chainId: this.chainId,
                    name: name.result as string,
                    symbol: symbol.result as string,
                    decimals: decimals.result as number,
                },
            };
        }

        const errors = [name, symbol, decimals]
            .filter(
                (r): r is { readonly status: "failure"; readonly error: Error } =>
                    r?.status === "failure",
            )
            .map((r) => r.error);

        return {
            status: "failure",
            token: { address: token, chainId: this.chainId },
            errors:
                errors.length > 0 ? errors : [new Error(`Failed to fetch metadata for ${token}`)],
        };
    }

    private toBatchResults<TQuery>(
        raw: ReadonlyArray<MulticallItemResult<unknown>>,
        queries: ReadonlyArray<TQuery>,
    ): {
        results: ReadonlyArray<MulticallItemResult<bigint>>;
        failures: ReadonlyArray<BatchFailure<TQuery>>;
    } {
        const results: MulticallItemResult<bigint>[] = [];
        const failures: BatchFailure<TQuery>[] = [];

        for (let i = 0; i < raw.length; i++) {
            const r = raw[i]!;
            if (r.status === "success") {
                results.push({ status: "success", result: r.result as bigint });
            } else {
                results.push(r);
                failures.push({ query: queries[i]!, error: r.error });
            }
        }

        return { results, failures };
    }
}

/**
 * Factory helper for creating an ERC20 read client.
 *
 * @param {ERC20ClientOptions} options Read client options.
 * @returns {IERC20Read} ERC20 read client interface implementation.
 */
export function createERC20Client(options: ERC20ClientOptions): IERC20Read {
    return new ERC20ReadClient(options);
}
