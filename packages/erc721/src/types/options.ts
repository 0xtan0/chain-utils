import type { ErrorDecoder } from "@0xtan0/chain-utils/core";
import type { Abi, Chain, PublicClient, Transport, WalletClient } from "viem";

export interface ERC721ClientOptions {
    readonly client: PublicClient<Transport, Chain>;
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly multicallBatchSize?: number;
}

export interface ERC721WriteClientOptions extends ERC721ClientOptions {
    readonly walletClient: WalletClient;
}

export interface ERC721MultichainClientOptions {
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly defaultMulticallBatchSize?: number;
}
