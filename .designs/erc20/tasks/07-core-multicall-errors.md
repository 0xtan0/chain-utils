# 07 - Core Multicall Errors

## Description

Implement multicall error classes in `packages/core/src/errors/multicall.ts`: `MulticallPartialFailure` and `MulticallBatchFailure`. Both extend `ChainUtilsFault`.

## Testable Outcome

- Each error extends `ChainUtilsFault`
- `MulticallPartialFailure` computes `failedCount` and `totalCount` from results
- `MulticallBatchFailure` stores `batchSize` and wraps the original cause

## Prompt

> Implement `MulticallPartialFailure` and `MulticallBatchFailure` in `packages/core/src/errors/multicall.ts` as defined in the tech design section 7.3. `MulticallPartialFailure` takes `chainId` and `results: ReadonlyArray<MulticallItemResult<unknown>>`, computing `failedCount` and `totalCount`. `MulticallBatchFailure` takes `chainId`, `batchSize`, and optional `cause`. Export from `external.ts`. Write tests verifying construction, computed fields, and inheritance.
