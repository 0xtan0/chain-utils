# 01 - Core Package Scaffold

## Description

Create the `packages/core` package with the project's standard structure (`create-package.sh` conventions). Set up `package.json`, `tsconfig.json`, `src/index.ts`, `src/external.ts`, `src/internal.ts`, and the folder skeleton for `types/`, `client/`, `errors/`, `decoder/`.

## Testable Outcome

- Package builds successfully with `tsc --noEmit`
- `src/index.ts` re-exports from `src/external.ts`
- Directory structure matches the tech design layout

## Prompt

> Create the `packages/core` package following the monorepo's `create-package.sh` conventions. The package name is `@0xtan0/chain-utils/core`. Set up `package.json` with `viem` as a dependency, `tsconfig.json` extending the root config, and the entry files (`index.ts`, `external.ts`, `internal.ts`). Create empty barrel files in `types/`, `client/`, `errors/`, `decoder/` subdirectories. Ensure `tsc --noEmit` passes. Refer to the tech design section 2.2 for the full directory layout.
