import type { ERC20Abi } from "@/abi/erc20Abi.js";
import type { ERC20MultichainClient, ERC20ReadClient, ERC20WriteClient } from "@/types/client.js";
import type { BatchAllowanceResult, BatchBalanceResult } from "@/types/query.js";
import type { TokenAllowance, TokenBalance, TokenMetadata } from "@/types/token.js";
import type {
    ContractClient,
    CrossChainBatchResult,
    MultichainContract,
    PreparedTransaction,
    SignedTransaction,
} from "@0xtan0/chain-utils/core";
import type { Hash, TransactionReceipt } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("ERC20ReadClient interface", () => {
    it("exposes contract, chainId, and supportsMulticall", () => {
        expectTypeOf<ERC20ReadClient["contract"]>().toEqualTypeOf<ContractClient<ERC20Abi>>();
        expectTypeOf<ERC20ReadClient["chainId"]>().toEqualTypeOf<number>();
        expectTypeOf<ERC20ReadClient["supportsMulticall"]>().toEqualTypeOf<boolean>();
    });

    it("has single read methods returning domain types", () => {
        expectTypeOf<ERC20ReadClient["getTokenMetadata"]>().toBeFunction();
        expectTypeOf<ERC20ReadClient["getBalance"]>().toBeFunction();
        expectTypeOf<ERC20ReadClient["getAllowance"]>().toBeFunction();
        expectTypeOf<ERC20ReadClient["getTotalSupply"]>().toBeFunction();

        type GetMetadataReturn = Awaited<ReturnType<ERC20ReadClient["getTokenMetadata"]>>;
        expectTypeOf<GetMetadataReturn>().toEqualTypeOf<TokenMetadata>();

        type GetBalanceReturn = Awaited<ReturnType<ERC20ReadClient["getBalance"]>>;
        expectTypeOf<GetBalanceReturn>().toEqualTypeOf<TokenBalance>();

        type GetAllowanceReturn = Awaited<ReturnType<ERC20ReadClient["getAllowance"]>>;
        expectTypeOf<GetAllowanceReturn>().toEqualTypeOf<TokenAllowance>();

        type GetTotalSupplyReturn = Awaited<ReturnType<ERC20ReadClient["getTotalSupply"]>>;
        expectTypeOf<GetTotalSupplyReturn>().toEqualTypeOf<bigint>();
    });

    it("has batch read methods", () => {
        type GetBalancesReturn = Awaited<ReturnType<ERC20ReadClient["getBalances"]>>;
        expectTypeOf<GetBalancesReturn>().toEqualTypeOf<BatchBalanceResult>();

        type GetAllowancesReturn = Awaited<ReturnType<ERC20ReadClient["getAllowances"]>>;
        expectTypeOf<GetAllowancesReturn>().toEqualTypeOf<BatchAllowanceResult>();

        type GetMetadataBatchReturn = Awaited<ReturnType<ERC20ReadClient["getTokenMetadataBatch"]>>;
        expectTypeOf<GetMetadataBatchReturn>().toEqualTypeOf<
            ReadonlyArray<TokenMetadata | Error>
        >();
    });
});

describe("ERC20WriteClient interface", () => {
    it("extends ERC20ReadClient", () => {
        expectTypeOf<ERC20WriteClient>().toMatchTypeOf<ERC20ReadClient>();
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
