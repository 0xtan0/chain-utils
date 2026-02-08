import type { ErrorDecoder } from "@0xtan0/chain-utils/core";
import type { Abi, Chain, PublicClient, Transport, WalletClient } from "viem";

export interface ERC20ClientOptions {
    readonly client: PublicClient<Transport, Chain>;
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly multicallBatchSize?: number;
}

export interface ERC20WriteClientOptions extends ERC20ClientOptions {
    readonly walletClient: WalletClient;
}

export interface ERC20MultichainClientOptions {
    readonly errorDecoder?: ErrorDecoder;
    readonly customErrorAbi?: Abi;
    readonly defaultMulticallBatchSize?: number;
}
