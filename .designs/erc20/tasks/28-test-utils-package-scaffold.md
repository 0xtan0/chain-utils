# 28 - ERC20 Test Utils Package Scaffold

## Description

Create the `packages/erc20-test-utils` package with the standard structure. Set up `package.json` with `@0xtan0/chain-utils/erc20` and `vitest` as peer dependencies, and the folder skeleton for `mocks/`, `fixtures/`, `helpers/`.

## Testable Outcome

- Package builds successfully with `tsc --noEmit`
- Peer dependencies are declared correctly
- Directory structure matches the tech design layout

## Prompt

> Create the `packages/erc20-test-utils` package following monorepo conventions. The package name is `@0xtan0/chain-utils/erc20-test-utils`. Set up `package.json` with `@0xtan0/chain-utils/erc20` and `vitest` as peer dependencies, `viem` as a dependency. Create `tsconfig.json`, entry files, and empty barrel files in `mocks/`, `fixtures/`, `helpers/` subdirectories. Ensure `tsc --noEmit` passes.
