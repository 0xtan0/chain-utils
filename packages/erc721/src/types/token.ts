import type { Address } from "viem";

/**
 * Immutable collection identity.
 *
 * @property {Address} address ERC721 collection address.
 * @property {number} chainId Chain where the collection is deployed.
 */
export interface CollectionReference {
    readonly address: Address;
    readonly chainId: number;
}

/**
 * Collection metadata resolved from the chain.
 *
 * @property {Address} address ERC721 collection address.
 * @property {number} chainId Chain where metadata applies.
 * @property {string} name Collection display name.
 * @property {string} symbol Collection symbol.
 */
export interface CollectionMetadata extends CollectionReference {
    readonly name: string;
    readonly symbol: string;
}

/**
 * Reference to one NFT in a collection.
 *
 * @property {CollectionReference} collection Collection identity.
 * @property {bigint} tokenId Token ID.
 */
export interface NFTReference {
    readonly collection: CollectionReference;
    readonly tokenId: bigint;
}

/**
 * Owner result for one NFT.
 *
 * @property {NFTReference} nft NFT reference.
 * @property {Address} owner Owner address.
 */
export interface TokenOwner {
    readonly nft: NFTReference;
    readonly owner: Address;
}

/**
 * Token approval result for one NFT.
 *
 * @property {NFTReference} nft NFT reference.
 * @property {Address} approved Approved address for token-level transfer.
 */
export interface TokenApproval {
    readonly nft: NFTReference;
    readonly approved: Address;
}

/**
 * Operator approval result for an owner/collection pair.
 *
 * @property {CollectionReference} collection Collection identity.
 * @property {Address} owner Token owner address.
 * @property {Address} operator Operator address.
 * @property {boolean} approved Whether operator is approved for all owner tokens.
 */
export interface OperatorApproval {
    readonly collection: CollectionReference;
    readonly owner: Address;
    readonly operator: Address;
    readonly approved: boolean;
}

/**
 * Token URI result for one NFT.
 *
 * @property {NFTReference} nft NFT reference.
 * @property {string} tokenURI Metadata URI string.
 */
export interface TokenURI {
    readonly nft: NFTReference;
    readonly tokenURI: string;
}

/**
 * Result item for token URI batch reads.
 *
 * `success` contains resolved URI data.
 * `failure` contains NFT reference plus one or more errors.
 */
export type TokenURIResult =
    | { readonly status: "success"; readonly data: TokenURI }
    | {
          readonly status: "failure";
          readonly nft: NFTReference;
          readonly errors: ReadonlyArray<Error>;
      };
