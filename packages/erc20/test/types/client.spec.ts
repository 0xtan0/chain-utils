import type { ERC20Abi } from "@/abi/erc20Abi.js";
import type { ERC20MultichainClient, ERC20WriteClient, IERC20Read } from "@/types/client.js";
import type { BatchAllowanceResult, BatchBalanceResult } from "@/types/query.js";
import type {
    TokenAllowance,
    TokenBalance,
    TokenMetadata,
    TokenMetadataResult,
} from "@/types/token.js";
import type {
    ContractClient,
    CrossChainBatchResult,
    MultichainContract,
    PreparedTransaction,
    SignedTransaction,
} from "@0xtan0/chain-utils/core";
import type { Hash, TransactionReceipt } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("IERC20Read interface", () => {
    it("exposes contract, chainId, and supportsMulticall", () => {
        expectTypeOf<IERC20Read["contract"]>().toEqualTypeOf<ContractClient<ERC20Abi>>();
        expectTypeOf<IERC20Read["chainId"]>().toEqualTypeOf<number>();
        expectTypeOf<IERC20Read["supportsMulticall"]>().toEqualTypeOf<boolean>();
    });

    it("has single read methods returning domain types", () => {
        expectTypeOf<IERC20Read["getTokenMetadata"]>().toBeFunction();
        expectTypeOf<IERC20Read["getBalance"]>().toBeFunction();
        expectTypeOf<IERC20Read["getAllowance"]>().toBeFunction();
        expectTypeOf<IERC20Read["getTotalSupply"]>().toBeFunction();

        type GetMetadataReturn = Awaited<ReturnType<IERC20Read["getTokenMetadata"]>>;
        expectTypeOf<GetMetadataReturn>().toEqualTypeOf<TokenMetadata>();

        type GetBalanceReturn = Awaited<ReturnType<IERC20Read["getBalance"]>>;
        expectTypeOf<GetBalanceReturn>().toEqualTypeOf<TokenBalance>();

        type GetAllowanceReturn = Awaited<ReturnType<IERC20Read["getAllowance"]>>;
        expectTypeOf<GetAllowanceReturn>().toEqualTypeOf<TokenAllowance>();

        type GetTotalSupplyReturn = Awaited<ReturnType<IERC20Read["getTotalSupply"]>>;
        expectTypeOf<GetTotalSupplyReturn>().toEqualTypeOf<bigint>();
    });

    it("has batch read methods", () => {
        type GetBalancesReturn = Awaited<ReturnType<IERC20Read["getBalances"]>>;
        expectTypeOf<GetBalancesReturn>().toEqualTypeOf<BatchBalanceResult>();

        type GetAllowancesReturn = Awaited<ReturnType<IERC20Read["getAllowances"]>>;
        expectTypeOf<GetAllowancesReturn>().toEqualTypeOf<BatchAllowanceResult>();

        type GetMetadataBatchReturn = Awaited<ReturnType<IERC20Read["getTokenMetadataBatch"]>>;
        expectTypeOf<GetMetadataBatchReturn>().toEqualTypeOf<ReadonlyArray<TokenMetadataResult>>();
    });
});

describe("ERC20WriteClient interface", () => {
    it("extends IERC20Read", () => {
        expectTypeOf<ERC20WriteClient>().toMatchTypeOf<IERC20Read>();
    });

    it("has prepare methods returning PreparedTransaction", () => {
        type PrepareApproveReturn = Awaited<ReturnType<ERC20WriteClient["prepareApprove"]>>;
        expectTypeOf<PrepareApproveReturn>().toEqualTypeOf<PreparedTransaction>();

        type PrepareTransferReturn = Awaited<ReturnType<ERC20WriteClient["prepareTransfer"]>>;
        expectTypeOf<PrepareTransferReturn>().toEqualTypeOf<PreparedTransaction>();

        type PrepareTransferFromReturn = Awaited<
            ReturnType<ERC20WriteClient["prepareTransferFrom"]>
        >;
        expectTypeOf<PrepareTransferFromReturn>().toEqualTypeOf<PreparedTransaction>();
    });

    it("has sign/send/wait lifecycle methods", () => {
        type SignReturn = Awaited<ReturnType<ERC20WriteClient["signTransaction"]>>;
        expectTypeOf<SignReturn>().toEqualTypeOf<SignedTransaction>();

        type SendReturn = Awaited<ReturnType<ERC20WriteClient["sendTransaction"]>>;
        expectTypeOf<SendReturn>().toEqualTypeOf<Hash>();

        type WaitReturn = Awaited<ReturnType<ERC20WriteClient["waitForReceipt"]>>;
        expectTypeOf<WaitReturn>().toEqualTypeOf<TransactionReceipt>();
    });

    it("has convenience methods returning Hash | TransactionReceipt", () => {
        type ApproveReturn = Awaited<ReturnType<ERC20WriteClient["approve"]>>;
        expectTypeOf<ApproveReturn>().toEqualTypeOf<Hash | TransactionReceipt>();

        type TransferReturn = Awaited<ReturnType<ERC20WriteClient["transfer"]>>;
        expectTypeOf<TransferReturn>().toEqualTypeOf<Hash | TransactionReceipt>();

        type TransferFromReturn = Awaited<ReturnType<ERC20WriteClient["transferFrom"]>>;
        expectTypeOf<TransferFromReturn>().toEqualTypeOf<Hash | TransactionReceipt>();
    });
});

describe("ERC20MultichainClient interface", () => {
    type TestClient = ERC20MultichainClient<1 | 10>;

    it("exposes multichain, chainIds, getClient, hasChain", () => {
        expectTypeOf<TestClient["multichain"]>().toEqualTypeOf<
            MultichainContract<ERC20Abi, 1 | 10>
        >();
        expectTypeOf<TestClient["chainIds"]>().toEqualTypeOf<ReadonlyArray<1 | 10>>();
        expectTypeOf<TestClient["getClient"]>().toBeFunction();
        expectTypeOf<TestClient["hasChain"]>().toBeFunction();
    });

    it("has cross-chain read methods", () => {
        type BalanceAcrossReturn = Awaited<ReturnType<TestClient["getBalanceAcrossChains"]>>;
        expectTypeOf<BalanceAcrossReturn>().toEqualTypeOf<
            CrossChainBatchResult<BatchBalanceResult>
        >();

        type BalancesReturn = Awaited<ReturnType<TestClient["getBalances"]>>;
        expectTypeOf<BalancesReturn>().toEqualTypeOf<CrossChainBatchResult<BatchBalanceResult>>();

        type AllowancesReturn = Awaited<ReturnType<TestClient["getAllowances"]>>;
        expectTypeOf<AllowancesReturn>().toEqualTypeOf<
            CrossChainBatchResult<BatchAllowanceResult>
        >();
    });

    it("has forToken method", () => {
        expectTypeOf<TestClient["forToken"]>().toBeFunction();
    });
});
