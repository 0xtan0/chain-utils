# 04 - Core Multicall Types

## Description

Implement multicall result types in `packages/core/src/types/multicall.ts`: `MulticallItemResult<T>` discriminated union, `BatchResult<T>`, and `CrossChainBatchResult<T>`.

## Testable Outcome

- Types compile correctly
- Discriminated union narrows correctly on `status` field
- `CrossChainBatchResult` uses `ReadonlyMap` and `ReadonlyArray`

## Prompt

> Implement `MulticallItemResult<T>`, `BatchResult<T>`, and `CrossChainBatchResult<T>` in `packages/core/src/types/multicall.ts` as defined in the tech design section 3.3. `MulticallItemResult<T>` is a discriminated union with `status: "success"` or `status: "failure"`. `BatchResult<T>` has `chainId` and `results` array. `CrossChainBatchResult<T>` has `resultsByChain: ReadonlyMap` and `failedChains` array. Export all from `external.ts`. Write tests verifying discriminated union narrowing works correctly.
