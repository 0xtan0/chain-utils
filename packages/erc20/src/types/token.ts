import type { Address } from "viem";

/** Immutable token identity — what you know before calling the chain. */
export interface TokenReference {
    readonly address: Address;
    readonly chainId: number;
}

/** Full on-chain metadata, fetched from the contract. */
export interface TokenMetadata extends TokenReference {
    readonly name: string;
    readonly symbol: string;
    readonly decimals: number;
}

/** A balance result tied to a specific holder. */
export interface TokenBalance {
    readonly token: TokenReference;
    readonly holder: Address;
    readonly balance: bigint;
}

/** An allowance result tied to owner/spender. */
export interface TokenAllowance {
    readonly token: TokenReference;
    readonly owner: Address;
    readonly spender: Address;
    readonly allowance: bigint;
}
