import type { Address } from "viem";

/**
 * Immutable token identity.
 *
 * @property {Address} address Token contract address.
 * @property {number} chainId Chain where the token address is deployed.
 */
export interface TokenReference {
    readonly address: Address;
    readonly chainId: number;
}

/**
 * Token metadata resolved from the chain or from a trusted definition.
 *
 * @property {Address} address Token contract address.
 * @property {number} chainId Chain where metadata applies.
 * @property {string} name Token display name.
 * @property {string} symbol Token ticker symbol.
 * @property {number} decimals Decimal precision used by the token.
 */
export interface TokenMetadata extends TokenReference {
    readonly name: string;
    readonly symbol: string;
    readonly decimals: number;
}

/**
 * Balance result for one holder and token.
 *
 * @property {TokenReference} token Token identity.
 * @property {Address} holder Wallet address queried for balance.
 * @property {bigint} balance Raw token balance (base units).
 */
export interface TokenBalance {
    readonly token: TokenReference;
    readonly holder: Address;
    readonly balance: bigint;
}

/**
 * Result item for token metadata batch reads.
 *
 * `success` contains decoded metadata.
 * `failure` contains token identity plus decode/read errors.
 */
export type TokenMetadataResult =
    | { readonly status: "success"; readonly data: TokenMetadata }
    | {
          readonly status: "failure";
          readonly token: TokenReference;
          readonly errors: ReadonlyArray<Error>;
      };

/**
 * Allowance result for one owner/spender/token tuple.
 *
 * @property {TokenReference} token Token identity.
 * @property {Address} owner Token owner granting spending permission.
 * @property {Address} spender Address authorized to spend tokens.
 * @property {bigint} allowance Raw allowance amount (base units).
 */
export interface TokenAllowance {
    readonly token: TokenReference;
    readonly owner: Address;
    readonly spender: Address;
    readonly allowance: bigint;
}
