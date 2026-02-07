# 11 - Core ContractClient — Read Operations

## Description

Implement the read portion of `ContractClient<TAbi>` in `packages/core/src/client/contractClient.ts`: constructor, `read()`, and `readBatch()`. The batch method uses multicall when available, falling back to sequential reads.

## Testable Outcome

- `read()` delegates to `publicClient.readContract` with correct ABI/address/args
- `readBatch()` uses `publicClient.multicall` when `supportsMulticall` is true
- `readBatch()` falls back to sequential `readContract` calls when multicall is unavailable
- `supportsMulticall` is detected from `chain.contracts.multicall3`
- Partial failures in multicall return discriminated union results (not throws)

## Prompt

> Implement the constructor, `read()`, and `readBatch()` methods of `ContractClient<TAbi>` in `packages/core/src/client/contractClient.ts` as defined in the tech design section 3.6. The constructor accepts `ContractClientOptions<TAbi>` and detects multicall support from `publicClient.chain.contracts.multicall3`. `read()` calls `publicClient.readContract`. `readBatch()` uses `publicClient.multicall` with `allowFailure: true` when supported, otherwise falls back to `Promise.allSettled` with sequential `readContract` calls. Map results to `MulticallItemResult<unknown>` discriminated unions. Also implement `createContractClient` factory. Export from `external.ts`. Write tests with mocked PublicClients for both multicall and fallback paths.
