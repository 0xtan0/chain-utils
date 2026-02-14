import type {
    CollectionMetadata,
    CollectionReference,
    NFTReference,
    OperatorApproval,
    TokenApproval,
    TokenOwner,
    TokenURI,
    TokenURIResult,
} from "@/types/token.js";
import type { Address } from "viem";
import { describe, expectTypeOf, it } from "vitest";

describe("Token data types", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;
    const collection: CollectionReference = { address, chainId: 1 };
    const nft: NFTReference = { collection, tokenId: 1n };

    it("CollectionReference has address and chainId", () => {
        expectTypeOf(collection.address).toEqualTypeOf<Address>();
        expectTypeOf(collection.chainId).toEqualTypeOf<number>();
    });

    it("CollectionMetadata extends CollectionReference", () => {
        const meta: CollectionMetadata = {
            address,
            chainId: 1,
            name: "Wonderland",
            symbol: "WLD",
        };
        expectTypeOf(meta).toMatchTypeOf<CollectionReference>();
        expectTypeOf(meta.name).toEqualTypeOf<string>();
        expectTypeOf(meta.symbol).toEqualTypeOf<string>();
    });

    it("NFTReference has collection and tokenId", () => {
        expectTypeOf(nft.collection).toEqualTypeOf<CollectionReference>();
        expectTypeOf(nft.tokenId).toEqualTypeOf<bigint>();
    });

    it("TokenOwner has nft and owner", () => {
        const owner: TokenOwner = { nft, owner: address };
        expectTypeOf(owner.nft).toEqualTypeOf<NFTReference>();
        expectTypeOf(owner.owner).toEqualTypeOf<Address>();
    });

    it("TokenApproval has nft and approved", () => {
        const approval: TokenApproval = { nft, approved: address };
        expectTypeOf(approval.nft).toEqualTypeOf<NFTReference>();
        expectTypeOf(approval.approved).toEqualTypeOf<Address>();
    });

    it("OperatorApproval has collection, owner, operator, approved", () => {
        const approval: OperatorApproval = {
            collection,
            owner: address,
            operator: address,
            approved: true,
        };
        expectTypeOf(approval.collection).toEqualTypeOf<CollectionReference>();
        expectTypeOf(approval.owner).toEqualTypeOf<Address>();
        expectTypeOf(approval.operator).toEqualTypeOf<Address>();
        expectTypeOf(approval.approved).toEqualTypeOf<boolean>();
    });

    it("TokenURI has nft and tokenURI", () => {
        const uri: TokenURI = { nft, tokenURI: "ipfs://token" };
        expectTypeOf(uri.nft).toEqualTypeOf<NFTReference>();
        expectTypeOf(uri.tokenURI).toEqualTypeOf<string>();
    });

    it("TokenURIResult supports success and failure variants", () => {
        const success: TokenURIResult = { status: "success", data: { nft, tokenURI: "ipfs://x" } };
        const failure: TokenURIResult = {
            status: "failure",
            nft,
            errors: [new Error("missing")],
        };
        expectTypeOf(success).toMatchTypeOf<TokenURIResult>();
        expectTypeOf(failure).toMatchTypeOf<TokenURIResult>();
    });
});
