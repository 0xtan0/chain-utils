# 13 - Core MultichainContract

## Description

Implement `MultichainContract<TAbi, TChainId>` class and `createMultichainContract` factory in `packages/core/src/client/multichainContract.ts`. This routes ABI-aware operations to the correct per-chain `ContractClient`.

## Testable Outcome

- `getClient(chainId)` returns the correct `ContractClient` for that chain
- `getClient` throws `UnsupportedChain` for unconfigured chains
- `withChain` returns a new immutable instance with the additional chain
- `readAcrossChains` dispatches reads in parallel via `Promise.allSettled`
- `readAcrossChains` assembles results into `CrossChainBatchResult`
- Factory overloads work from `MultichainClient`, `PublicClient[]`, and `ChainTransportConfig[]`

## Prompt

> Implement `MultichainContract<TAbi, TChainId>` and `createMultichainContract` in `packages/core/src/client/multichainContract.ts` as defined in the tech design section 3.7. The class composes a `MultichainClient<TChainId>` and manages one `ContractClient<TAbi>` per chain. `readAcrossChains` groups calls by `chainId`, dispatches each group to its `ContractClient.readBatch()` in parallel using `Promise.allSettled`, and assembles a `CrossChainBatchResult`. Implement three factory overloads. Write tests with mocked clients covering routing, cross-chain reads, partial chain failures, and immutable `withChain`.
