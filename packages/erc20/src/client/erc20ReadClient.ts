import type { ContractClient, MulticallItemResult } from "@0xtan0/chain-utils/core";
import type { Address, WalletClient } from "viem";
import { CompositeErrorDecoder, createContractClient } from "@0xtan0/chain-utils/core";

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

export class ERC20ReadClient implements IERC20Read {
    readonly contract: ContractClient<ERC20Abi>;
    readonly chainId: number;
    readonly supportsMulticall: boolean;

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

    async getTokenMetadata(token: Address): Promise<TokenMetadata> {
        validateAddress(token);

        const [name, symbol, decimals] = await Promise.all([
            this.contract.read(token, "name"),
            this.contract.read(token, "symbol"),
            this.contract.read(token, "decimals"),
        ]);

        return { address: token, chainId: this.chainId, name, symbol, decimals };
    }

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

    async getTotalSupply(token: Address): Promise<bigint> {
        validateAddress(token);
        return this.contract.read(token, "totalSupply");
    }

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

export function createERC20Client(options: ERC20ClientOptions): IERC20Read {
    return new ERC20ReadClient(options);
}
