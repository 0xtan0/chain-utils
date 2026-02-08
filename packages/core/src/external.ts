// ---- Configuration Types ----
export type { ChainTransportConfig, ChainInput } from "./types/config.js";

// ---- Transaction Types ----
export type { PreparedTransaction, SignedTransaction, WriteOptions } from "./types/transaction.js";

// ---- Multicall Types ----
export type { MulticallItemResult, BatchResult, CrossChainBatchResult } from "./types/multicall.js";

// ---- Errors ----
export { ChainUtilsFault } from "./errors/base.js";
export { UnsupportedChain, RpcFailure, MulticallNotSupported } from "./errors/chain.js";
export { MulticallPartialFailure, MulticallBatchFailure } from "./errors/multicall.js";
export { ContractReverted } from "./errors/revert.js";

// ---- Decoder ----
export type { ErrorDecoder } from "./decoder/errorDecoder.js";
export { CompositeErrorDecoder } from "./decoder/compositeDecoder.js";
