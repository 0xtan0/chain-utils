// ---- ABI ----
export { erc20Abi } from "./abi/erc20Abi.js";
export type { ERC20Abi } from "./abi/erc20Abi.js";
export { erc20ErrorsAbi } from "./abi/erc20ErrorsAbi.js";
export type { ERC20ErrorsAbi } from "./abi/erc20ErrorsAbi.js";

// ---- Token Data Types ----
export type {
    TokenReference,
    TokenMetadata,
    TokenMetadataResult,
    TokenBalance,
    TokenAllowance,
} from "./types/token.js";

// ---- Query Types ----
export type {
    BalanceQuery,
    AllowanceQuery,
    BatchFailure,
    BatchBalanceResult,
    BatchAllowanceResult,
} from "./types/query.js";

// ---- Client Interfaces ----
export type { IERC20Read, ERC20WriteClient, ERC20MultichainClient } from "./types/client.js";

// ---- Options ----
export type {
    ERC20ClientOptions,
    ERC20WriteClientOptions,
    ERC20MultichainClientOptions,
} from "./types/options.js";

// ---- Errors ----
export { InvalidAddress, NotERC20Contract } from "./errors/contract.js";
export {
    InsufficientBalance,
    InsufficientAllowance,
    InvalidSender,
    InvalidReceiver,
    InvalidApprover,
    InvalidSpender,
} from "./errors/revert.js";

// ---- Decoder ----
export { ERC20ErrorDecoder } from "./decoder/erc20ErrorDecoder.js";

// ---- Client Implementations ----
export { ERC20ReadClient, createERC20Client } from "./client/erc20ReadClient.js";
export { ERC20WriteClientImpl, createERC20WriteClient } from "./client/erc20WriteClient.js";

// ---- Token ----
export type { ITokenDefinition } from "./types/tokenDefinition.js";
export type { ITokenBuilder, TokenBuilderOptions } from "./token/tokenBuilder.js";
export { TokenDefinition, TokenBuilder, defineToken } from "./token/tokenBuilder.js";
export type { ERC20Token } from "./types/erc20Token.js";
