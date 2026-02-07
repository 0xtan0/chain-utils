# 02 - Core Configuration Types

## Description

Implement the configuration types in `packages/core/src/types/config.ts`: `ChainTransportConfig` interface and `ChainInput` union type. These are the foundational types that all client factories accept.

## Testable Outcome

- Types compile correctly
- `ChainInput` accepts both a `PublicClient` and a `ChainTransportConfig`
- Type-level tests verify that invalid inputs are rejected

## Prompt

> Implement `ChainTransportConfig` and `ChainInput` in `packages/core/src/types/config.ts` as defined in the tech design section 3.1. `ChainTransportConfig` has `chain: Chain`, `transport: Transport`, and optional `multicallAddress: Address`. `ChainInput` is a union of `PublicClient<Transport, Chain> | ChainTransportConfig`. Export both from `external.ts`. Write unit tests that verify the types compile correctly with valid inputs and that the interface shape is correct.
