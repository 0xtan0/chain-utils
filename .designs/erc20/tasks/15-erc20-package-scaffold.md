# 15 - ERC20 Package Scaffold

## Description

Create the `packages/erc20` package with the standard structure. Set up `package.json` (depends on `@0xtan0/chain-utils/core` and `viem`), `tsconfig.json`, entry files, and the folder skeleton for `abi/`, `types/`, `client/`, `errors/`, `decoder/`, `token/`.

## Testable Outcome

- Package builds successfully with `tsc --noEmit`
- `src/index.ts` re-exports from `src/external.ts`
- Dependency on `@0xtan0/chain-utils/core` is declared

## Prompt

> Create the `packages/erc20` package following the monorepo's `create-package.sh` conventions. The package name is `@0xtan0/chain-utils/erc20`. Set up `package.json` with dependencies on `@0xtan0/chain-utils/core` and `viem`, `tsconfig.json` extending the root config, and entry files (`index.ts`, `external.ts`, `internal.ts`). Create empty barrel files in `abi/`, `types/`, `client/`, `errors/`, `decoder/`, `token/` subdirectories. Ensure `tsc --noEmit` passes.
