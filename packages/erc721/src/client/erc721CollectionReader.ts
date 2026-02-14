import type { Address, Hex } from "viem";

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
    CollectionMetadata,
    CollectionOperatorApprovalQuery,
    CollectionTokenOfOwnerByIndexQuery,
    ERC721CollectionReaderOptions,
    IERC721CollectionReader,
    IERC721Read,
    OperatorApproval,
    TokenApproval,
    TokenOwner,
    TokenURI,
} from "../types/index.js";
import { validateAddress } from "../helpers/validateAddress.js";
import { ERC721ReadClient } from "./erc721ReadClient.js";

type ReaderInput =
    | ERC721CollectionReaderOptions
    | {
          readonly collection: Address;
          readonly readClient: IERC721Read;
      };

export class ERC721CollectionReader implements IERC721CollectionReader {
    readonly collection: Address;
    readonly chainId: number;
    readonly supportsMulticall: boolean;
    readonly readClient: IERC721Read;

    constructor(options: ReaderInput) {
        validateAddress(options.collection);
        this.collection = options.collection;

        if ("readClient" in options) {
            this.readClient = options.readClient;
        } else {
            this.readClient = new ERC721ReadClient(options);
        }

        this.chainId = this.readClient.chainId;
        this.supportsMulticall = this.readClient.supportsMulticall;
    }

    static fromClient(readClient: IERC721Read, collection: Address): IERC721CollectionReader {
        return new ERC721CollectionReader({ readClient, collection });
    }

    async supportsInterface(interfaceId: Hex): Promise<boolean> {
        return this.readClient.supportsInterface(this.collection, interfaceId);
    }

    async getCollectionMetadata(): Promise<CollectionMetadata> {
        return this.readClient.getCollectionMetadata(this.collection);
    }

    async getOwnerOf(tokenId: bigint): Promise<TokenOwner> {
        return this.readClient.getOwnerOf(this.collection, tokenId);
    }

    async getBalance(owner: Address): Promise<bigint> {
        return this.readClient.getBalance(this.collection, owner);
    }

    async getApproved(tokenId: bigint): Promise<TokenApproval> {
        return this.readClient.getApproved(this.collection, tokenId);
    }

    async isApprovedForAll(owner: Address, operator: Address): Promise<OperatorApproval> {
        return this.readClient.isApprovedForAll(this.collection, owner, operator);
    }

    async getTokenURI(tokenId: bigint): Promise<TokenURI> {
        return this.readClient.getTokenURI(this.collection, tokenId);
    }

    async getTotalSupply(): Promise<bigint> {
        return this.readClient.getTotalSupply(this.collection);
    }

    async getTokenByIndex(index: bigint): Promise<bigint> {
        return this.readClient.getTokenByIndex(this.collection, index);
    }

    async getTokenOfOwnerByIndex(owner: Address, index: bigint): Promise<bigint> {
        return this.readClient.getTokenOfOwnerByIndex(this.collection, owner, index);
    }

    async getOwners(tokenIds: ReadonlyArray<bigint>): Promise<BatchOwnerResult> {
        return this.readClient.getOwners(
            tokenIds.map((tokenId) => ({ collection: this.collection, tokenId })),
        );
    }

    async getTokenURIs(tokenIds: ReadonlyArray<bigint>): Promise<BatchTokenURIResult> {
        return this.readClient.getTokenURIs(
            tokenIds.map((tokenId) => ({ collection: this.collection, tokenId })),
        );
    }

    async getApprovals(tokenIds: ReadonlyArray<bigint>): Promise<BatchApprovalResult> {
        return this.readClient.getApprovals(
            tokenIds.map((tokenId) => ({ collection: this.collection, tokenId })),
        );
    }

    async getBalances(owners: ReadonlyArray<Address>): Promise<BatchBalanceResult> {
        return this.readClient.getBalances(
            owners.map((owner) => ({ collection: this.collection, owner })),
        );
    }

    async getOperatorApprovals(
        queries: ReadonlyArray<CollectionOperatorApprovalQuery>,
    ): Promise<BatchOperatorApprovalResult> {
        return this.readClient.getOperatorApprovals(
            queries.map((query) => ({
                collection: this.collection,
                owner: query.owner,
                operator: query.operator,
            })),
        );
    }

    async getInterfaceSupports(
        interfaceIds: ReadonlyArray<Hex>,
    ): Promise<BatchInterfaceSupportResult> {
        return this.readClient.getInterfaceSupports(
            interfaceIds.map((interfaceId) => ({
                collection: this.collection,
                interfaceId,
            })),
        );
    }

    async getTotalSupplies(): Promise<BatchTotalSupplyResult> {
        return this.readClient.getTotalSupplies([{ collection: this.collection }]);
    }

    async getTokenByIndexes(indexes: ReadonlyArray<bigint>): Promise<BatchTokenByIndexResult> {
        return this.readClient.getTokenByIndexes(
            indexes.map((index) => ({ collection: this.collection, index })),
        );
    }

    async getTokenOfOwnerByIndexes(
        queries: ReadonlyArray<CollectionTokenOfOwnerByIndexQuery>,
    ): Promise<BatchTokenOfOwnerByIndexResult> {
        return this.readClient.getTokenOfOwnerByIndexes(
            queries.map((query) => ({
                collection: this.collection,
                owner: query.owner,
                index: query.index,
            })),
        );
    }
}

export function createERC721CollectionReader(
    options: ERC721CollectionReaderOptions,
): IERC721CollectionReader {
    return new ERC721CollectionReader(options);
}
