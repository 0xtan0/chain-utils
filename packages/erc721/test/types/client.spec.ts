import type { ERC721Abi } from "@/abi/erc721Abi.js";
import type { ERC721WriteClient, IERC721MultichainClient, IERC721Read } from "@/types/client.js";
import type {
    BatchApprovalResult,
    BatchBalanceResult,
    BatchInterfaceSupportResult,
    BatchOperatorApprovalResult,
    BatchOwnerResult,
    BatchTokenByIndexResult,
    BatchTokenOfOwnerByIndexResult,
    BatchTokenURIResult,
    BatchTotalSupplyResult,
} from "@/types/query.js";
import type {
    CollectionMetadata,
    OperatorApproval,
    TokenApproval,
    TokenOwner,
    TokenURI,
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

describe("IERC721Read interface", () => {
    it("exposes contract, chainId, and supportsMulticall", () => {
        expectTypeOf<IERC721Read["contract"]>().toEqualTypeOf<ContractClient<ERC721Abi>>();
        expectTypeOf<IERC721Read["chainId"]>().toEqualTypeOf<number>();
        expectTypeOf<IERC721Read["supportsMulticall"]>().toEqualTypeOf<boolean>();
    });

    it("has single read methods returning domain types", () => {
        expectTypeOf<IERC721Read["supportsInterface"]>().toBeFunction();
        expectTypeOf<IERC721Read["getCollectionMetadata"]>().toBeFunction();
        expectTypeOf<IERC721Read["getOwnerOf"]>().toBeFunction();
        expectTypeOf<IERC721Read["getBalance"]>().toBeFunction();
        expectTypeOf<IERC721Read["getApproved"]>().toBeFunction();
        expectTypeOf<IERC721Read["isApprovedForAll"]>().toBeFunction();
        expectTypeOf<IERC721Read["getTokenURI"]>().toBeFunction();
        expectTypeOf<IERC721Read["getTotalSupply"]>().toBeFunction();
        expectTypeOf<IERC721Read["getTokenByIndex"]>().toBeFunction();
        expectTypeOf<IERC721Read["getTokenOfOwnerByIndex"]>().toBeFunction();

        type GetMetadataReturn = Awaited<ReturnType<IERC721Read["getCollectionMetadata"]>>;
        expectTypeOf<GetMetadataReturn>().toEqualTypeOf<CollectionMetadata>();

        type GetOwnerReturn = Awaited<ReturnType<IERC721Read["getOwnerOf"]>>;
        expectTypeOf<GetOwnerReturn>().toEqualTypeOf<TokenOwner>();

        type GetBalanceReturn = Awaited<ReturnType<IERC721Read["getBalance"]>>;
        expectTypeOf<GetBalanceReturn>().toEqualTypeOf<bigint>();

        type GetApprovedReturn = Awaited<ReturnType<IERC721Read["getApproved"]>>;
        expectTypeOf<GetApprovedReturn>().toEqualTypeOf<TokenApproval>();

        type GetApprovedForAllReturn = Awaited<ReturnType<IERC721Read["isApprovedForAll"]>>;
        expectTypeOf<GetApprovedForAllReturn>().toEqualTypeOf<OperatorApproval>();

        type GetTokenURIReturn = Awaited<ReturnType<IERC721Read["getTokenURI"]>>;
        expectTypeOf<GetTokenURIReturn>().toEqualTypeOf<TokenURI>();

        type GetTotalSupplyReturn = Awaited<ReturnType<IERC721Read["getTotalSupply"]>>;
        expectTypeOf<GetTotalSupplyReturn>().toEqualTypeOf<bigint>();

        type GetTokenByIndexReturn = Awaited<ReturnType<IERC721Read["getTokenByIndex"]>>;
        expectTypeOf<GetTokenByIndexReturn>().toEqualTypeOf<bigint>();

        type GetTokenOfOwnerByIndexReturn = Awaited<
            ReturnType<IERC721Read["getTokenOfOwnerByIndex"]>
        >;
        expectTypeOf<GetTokenOfOwnerByIndexReturn>().toEqualTypeOf<bigint>();
    });

    it("has batch read methods", () => {
        type GetOwnersReturn = Awaited<ReturnType<IERC721Read["getOwners"]>>;
        expectTypeOf<GetOwnersReturn>().toEqualTypeOf<BatchOwnerResult>();

        type GetTokenURIsReturn = Awaited<ReturnType<IERC721Read["getTokenURIs"]>>;
        expectTypeOf<GetTokenURIsReturn>().toEqualTypeOf<BatchTokenURIResult>();

        type GetApprovalsReturn = Awaited<ReturnType<IERC721Read["getApprovals"]>>;
        expectTypeOf<GetApprovalsReturn>().toEqualTypeOf<BatchApprovalResult>();

        type GetBalancesReturn = Awaited<ReturnType<IERC721Read["getBalances"]>>;
        expectTypeOf<GetBalancesReturn>().toEqualTypeOf<BatchBalanceResult>();

        type GetOperatorApprovalsReturn = Awaited<ReturnType<IERC721Read["getOperatorApprovals"]>>;
        expectTypeOf<GetOperatorApprovalsReturn>().toEqualTypeOf<BatchOperatorApprovalResult>();

        type GetInterfaceSupportsReturn = Awaited<ReturnType<IERC721Read["getInterfaceSupports"]>>;
        expectTypeOf<GetInterfaceSupportsReturn>().toEqualTypeOf<BatchInterfaceSupportResult>();

        type GetTotalSuppliesReturn = Awaited<ReturnType<IERC721Read["getTotalSupplies"]>>;
        expectTypeOf<GetTotalSuppliesReturn>().toEqualTypeOf<BatchTotalSupplyResult>();

        type GetTokenByIndexesReturn = Awaited<ReturnType<IERC721Read["getTokenByIndexes"]>>;
        expectTypeOf<GetTokenByIndexesReturn>().toEqualTypeOf<BatchTokenByIndexResult>();

        type GetTokenOfOwnerByIndexesReturn = Awaited<
            ReturnType<IERC721Read["getTokenOfOwnerByIndexes"]>
        >;
        expectTypeOf<GetTokenOfOwnerByIndexesReturn>().toEqualTypeOf<BatchTokenOfOwnerByIndexResult>();
    });
});

describe("ERC721WriteClient interface", () => {
    it("extends IERC721Read", () => {
        expectTypeOf<ERC721WriteClient>().toMatchTypeOf<IERC721Read>();
    });

    it("has prepare methods returning PreparedTransaction", () => {
        type PrepareApproveReturn = Awaited<ReturnType<ERC721WriteClient["prepareApprove"]>>;
        expectTypeOf<PrepareApproveReturn>().toEqualTypeOf<PreparedTransaction>();

        type PrepareSetApprovalReturn = Awaited<
            ReturnType<ERC721WriteClient["prepareSetApprovalForAll"]>
        >;
        expectTypeOf<PrepareSetApprovalReturn>().toEqualTypeOf<PreparedTransaction>();

        type PrepareTransferReturn = Awaited<ReturnType<ERC721WriteClient["prepareTransferFrom"]>>;
        expectTypeOf<PrepareTransferReturn>().toEqualTypeOf<PreparedTransaction>();

        type PrepareSafeTransferReturn = Awaited<
            ReturnType<ERC721WriteClient["prepareSafeTransferFrom"]>
        >;
        expectTypeOf<PrepareSafeTransferReturn>().toEqualTypeOf<PreparedTransaction>();
    });

    it("has sign/send/wait lifecycle methods", () => {
        type SignReturn = Awaited<ReturnType<ERC721WriteClient["signTransaction"]>>;
        expectTypeOf<SignReturn>().toEqualTypeOf<SignedTransaction>();

        type SendReturn = Awaited<ReturnType<ERC721WriteClient["sendTransaction"]>>;
        expectTypeOf<SendReturn>().toEqualTypeOf<Hash>();

        type WaitReturn = Awaited<ReturnType<ERC721WriteClient["waitForReceipt"]>>;
        expectTypeOf<WaitReturn>().toEqualTypeOf<TransactionReceipt>();
    });

    it("has convenience methods returning Hash | TransactionReceipt", () => {
        type ApproveReturn = Awaited<ReturnType<ERC721WriteClient["approve"]>>;
        expectTypeOf<ApproveReturn>().toEqualTypeOf<Hash | TransactionReceipt>();

        type SetApprovalReturn = Awaited<ReturnType<ERC721WriteClient["setApprovalForAll"]>>;
        expectTypeOf<SetApprovalReturn>().toEqualTypeOf<Hash | TransactionReceipt>();

        type TransferReturn = Awaited<ReturnType<ERC721WriteClient["transferFrom"]>>;
        expectTypeOf<TransferReturn>().toEqualTypeOf<Hash | TransactionReceipt>();

        type SafeTransferReturn = Awaited<ReturnType<ERC721WriteClient["safeTransferFrom"]>>;
        expectTypeOf<SafeTransferReturn>().toEqualTypeOf<Hash | TransactionReceipt>();
    });
});

describe("IERC721MultichainClient interface", () => {
    type TestClient = IERC721MultichainClient<1 | 10>;

    it("exposes multichain, chainIds, getClient, hasChain", () => {
        expectTypeOf<TestClient["multichain"]>().toEqualTypeOf<
            MultichainContract<ERC721Abi, 1 | 10>
        >();
        expectTypeOf<TestClient["chainIds"]>().toEqualTypeOf<ReadonlyArray<1 | 10>>();
        expectTypeOf<TestClient["getClient"]>().toBeFunction();
        expectTypeOf<TestClient["hasChain"]>().toBeFunction();
    });

    it("has cross-chain read methods", () => {
        type OwnersReturn = Awaited<ReturnType<TestClient["getOwners"]>>;
        expectTypeOf<OwnersReturn>().toEqualTypeOf<CrossChainBatchResult<BatchOwnerResult>>();

        type TokenURIsReturn = Awaited<ReturnType<TestClient["getTokenURIs"]>>;
        expectTypeOf<TokenURIsReturn>().toEqualTypeOf<CrossChainBatchResult<BatchTokenURIResult>>();

        type ApprovalsReturn = Awaited<ReturnType<TestClient["getApprovals"]>>;
        expectTypeOf<ApprovalsReturn>().toEqualTypeOf<CrossChainBatchResult<BatchApprovalResult>>();

        type BalancesReturn = Awaited<ReturnType<TestClient["getBalances"]>>;
        expectTypeOf<BalancesReturn>().toEqualTypeOf<CrossChainBatchResult<BatchBalanceResult>>();

        type OperatorApprovalsReturn = Awaited<ReturnType<TestClient["getOperatorApprovals"]>>;
        expectTypeOf<OperatorApprovalsReturn>().toEqualTypeOf<
            CrossChainBatchResult<BatchOperatorApprovalResult>
        >();

        type InterfaceSupportsReturn = Awaited<ReturnType<TestClient["getInterfaceSupports"]>>;
        expectTypeOf<InterfaceSupportsReturn>().toEqualTypeOf<
            CrossChainBatchResult<BatchInterfaceSupportResult>
        >();

        type TotalSuppliesReturn = Awaited<ReturnType<TestClient["getTotalSupplies"]>>;
        expectTypeOf<TotalSuppliesReturn>().toEqualTypeOf<
            CrossChainBatchResult<BatchTotalSupplyResult>
        >();

        type TokenByIndexesReturn = Awaited<ReturnType<TestClient["getTokenByIndexes"]>>;
        expectTypeOf<TokenByIndexesReturn>().toEqualTypeOf<
            CrossChainBatchResult<BatchTokenByIndexResult>
        >();

        type TokenOfOwnerByIndexesReturn = Awaited<
            ReturnType<TestClient["getTokenOfOwnerByIndexes"]>
        >;
        expectTypeOf<TokenOfOwnerByIndexesReturn>().toEqualTypeOf<
            CrossChainBatchResult<BatchTokenOfOwnerByIndexResult>
        >();
    });
});
