// ---- ABI ----
export { erc20Abi } from "./abi/erc20Abi.js";
export type { ERC20Abi } from "./abi/erc20Abi.js";
export { erc20ErrorsAbi } from "./abi/erc20ErrorsAbi.js";
export type { ERC20ErrorsAbi } from "./abi/erc20ErrorsAbi.js";

// ---- Client Interfaces ----
export type { IERC20Read, ERC20WriteClient, IERC20MultichainClient } from "./types/client.js";

// ---- Client Factories & Classes ----
export { ERC20ReadClient, createERC20Client } from "./client/erc20ReadClient.js";
export { ERC20WriteClientImpl, createERC20WriteClient } from "./client/erc20WriteClient.js";
export {
    ERC20MultichainClient,
    createERC20MultichainClient,
} from "./client/erc20MultichainClient.js";

// ---- Options Types ----
export type {
    ERC20ClientOptions,
    ERC20WriteClientOptions,
    ERC20MultichainClientOptions,
} from "./types/options.js";

// ---- Data Types ----
export type {
    TokenReference,
    TokenMetadata,
    TokenMetadataResult,
    TokenBalance,
    TokenAllowance,
} from "./types/token.js";
export type {
    BalanceQuery,
    AllowanceQuery,
    BatchFailure,
    BatchBalanceResult,
    BatchAllowanceResult,
} from "./types/query.js";

// ---- Token Definition (pure data, no RPC) ----
export type { ITokenDefinition } from "./types/tokenDefinition.js";
export type { ITokenBuilder, TokenBuilderOptions } from "./token/tokenBuilder.js";
export { TokenDefinition, TokenBuilder, defineToken } from "./token/tokenBuilder.js";

// ---- Bound Token (addresses + RPC, can make calls) ----
export type { ERC20Token } from "./types/erc20Token.js";
export { ERC20BoundToken } from "./token/erc20Token.js";
export { ERC20TokenBuilder } from "./token/erc20TokenBuilder.js";

// ---- Pre-Built Token Definitions ----
export { USDC, USDT } from "./token/common.js";

// ---- Error Decoder ----
export { ERC20ErrorDecoder } from "./decoder/erc20ErrorDecoder.js";

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
