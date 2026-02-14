import type { Address } from "viem";

/** Immutable collection identity — address + chain. */
export interface CollectionReference {
    readonly address: Address;
    readonly chainId: number;
}

/** Collection metadata fetched from the contract. */
export interface CollectionMetadata extends CollectionReference {
    readonly name: string;
    readonly symbol: string;
}

/** A specific NFT within a collection. */
export interface NFTReference {
    readonly collection: CollectionReference;
    readonly tokenId: bigint;
}

/** Ownership result for a single NFT. */
export interface TokenOwner {
    readonly nft: NFTReference;
    readonly owner: Address;
}

/** Approval result for a single NFT. */
export interface TokenApproval {
    readonly nft: NFTReference;
    readonly approved: Address;
}

/** Approval result for an operator across a collection. */
export interface OperatorApproval {
    readonly collection: CollectionReference;
    readonly owner: Address;
    readonly operator: Address;
    readonly approved: boolean;
}

/** Token URI result for a single NFT. */
export interface TokenURI {
    readonly nft: NFTReference;
    readonly tokenURI: string;
}

/** Discriminated-union result for a token URI batch. */
export type TokenURIResult =
    | { readonly status: "success"; readonly data: TokenURI }
    | {
          readonly status: "failure";
          readonly nft: NFTReference;
          readonly errors: ReadonlyArray<Error>;
      };
