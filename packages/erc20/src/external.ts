// ---- ABI ----
export { erc20Abi } from "./abi/erc20Abi.js";
export type { ERC20Abi } from "./abi/erc20Abi.js";
export { erc20ErrorsAbi } from "./abi/erc20ErrorsAbi.js";
export type { ERC20ErrorsAbi } from "./abi/erc20ErrorsAbi.js";

// ---- Token Data Types ----
export type { TokenReference, TokenMetadata, TokenBalance, TokenAllowance } from "./types/token.js";

// ---- Query Types ----
export type {
    BalanceQuery,
    AllowanceQuery,
    BatchBalanceResult,
    BatchAllowanceResult,
} from "./types/query.js";

// ---- Client Interfaces ----
export type { ERC20ReadClient, ERC20WriteClient, ERC20MultichainClient } from "./types/client.js";

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

// ---- Token ----
export type { TokenDefinition } from "./token/tokenDefinition.js";
export type { ERC20Token } from "./token/erc20Token.js";
