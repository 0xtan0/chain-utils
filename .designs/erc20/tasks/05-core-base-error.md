# 05 - Core Base Error (ChainUtilsFault)

## Description

Implement the `ChainUtilsFault` base error class in `packages/core/src/errors/base.ts`. This is the root of the entire error hierarchy and provides structured error info with `walk()` support.

## Testable Outcome

- `ChainUtilsFault` extends `Error`
- `name`, `shortMessage`, `details`, `metaMessages` are set correctly
- `walk()` traverses the cause chain
- `walk(fn)` returns the first error matching the predicate

## Prompt

> Implement `ChainUtilsFault` in `packages/core/src/errors/base.ts` as defined in the tech design section 7.2. It extends `Error`, has `name = "ChainUtilsFault"`, `shortMessage: string`, `details: string`, and optional `metaMessages: string[]`. The constructor accepts `shortMessage` and an optional options object with `cause`, `details`, and `metaMessages`. Implement `walk()` with two overloads: no-arg returns the deepest cause, with predicate returns the first match or null. Export from `external.ts`. Write tests for construction, property access, and both `walk()` overloads.
