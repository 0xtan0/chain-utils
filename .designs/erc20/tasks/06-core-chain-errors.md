# 06 - Core Chain Errors

## Description

Implement chain-related error classes in `packages/core/src/errors/chain.ts`: `UnsupportedChain`, `RpcFailure`, and `MulticallNotSupported`. All extend `ChainUtilsFault`.

## Testable Outcome

- Each error extends `ChainUtilsFault`
- Each has a unique `name` property
- Constructor sets all domain-specific fields (`chainId`, `rpcUrl`, etc.)
- `instanceof` checks work correctly through the hierarchy

## Prompt

> Implement `UnsupportedChain`, `RpcFailure`, and `MulticallNotSupported` in `packages/core/src/errors/chain.ts` as defined in the tech design section 7.3. All extend `ChainUtilsFault`. `UnsupportedChain` has `chainId` and optional `availableChainIds`. `RpcFailure` has `chainId` and optional `rpcUrl`. `MulticallNotSupported` has `chainId`. Each has a descriptive `shortMessage`. Export from `external.ts`. Write tests verifying construction, property values, inheritance chain, and `instanceof` checks.
