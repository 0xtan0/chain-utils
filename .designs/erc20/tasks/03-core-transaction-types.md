# 03 - Core Transaction Types

## Description

Implement transaction lifecycle types in `packages/core/src/types/transaction.ts`: `PreparedTransaction`, `SignedTransaction`, and `WriteOptions`. These represent the stages of a write operation.

## Testable Outcome

- Types compile correctly
- Objects conforming to each interface can be created
- Type-level tests verify required and optional fields

## Prompt

> Implement `PreparedTransaction`, `SignedTransaction`, and `WriteOptions` in `packages/core/src/types/transaction.ts` as defined in the tech design section 3.2. All fields are `readonly`. `PreparedTransaction` has `request: TransactionRequest`, `gasEstimate: bigint`, `chainId: number`. `SignedTransaction` has `serialized: Hex`, `chainId: number`. `WriteOptions` has optional `waitForReceipt: boolean`. Export all from `external.ts`. Write unit tests verifying the type shapes.
