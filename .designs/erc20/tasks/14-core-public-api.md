# 14 - Core Package Public API

## Description

Wire up `packages/core/src/external.ts` and `packages/core/src/index.ts` to re-export all public types, classes, and factory functions. Ensure the package is consumable by downstream packages.

## Testable Outcome

- All public symbols listed in tech design section 11.1 are importable from the package
- No internal-only symbols are exported
- `index.ts` re-exports from `external.ts`
- Package builds cleanly

## Prompt

> Configure `packages/core/src/external.ts` to re-export all public API symbols as defined in the tech design section 11.1: `MultichainClient`, `createMultichainClient`, `ContractClient`, `createContractClient`, `MultichainContract`, `createMultichainContract`, `ErrorDecoder`, `CompositeErrorDecoder`, all config/transaction/multicall types, and all error classes. `index.ts` should re-export everything from `external.ts`. Write a test that imports every public symbol and verifies it is defined (smoke test).
