# 27 - ERC20 Package Public API

## Description

Wire up `packages/erc20/src/external.ts` and `packages/erc20/src/index.ts` to re-export all public types, classes, factories, ABIs, token definitions, and error classes.

## Testable Outcome

- All public symbols listed in tech design section 11.2 are importable
- No internal-only symbols are exported
- Package builds cleanly
- Downstream packages can import from `@0xtan0/chain-utils/erc20`

## Prompt

> Configure `packages/erc20/src/external.ts` to re-export all public API symbols as defined in tech design section 11.2: ABIs, client interfaces, client factories and classes, options types, data types, token definition/builder/common tokens, bound token types, error decoder, and all error classes. `index.ts` re-exports from `external.ts`. Write a smoke test importing every public symbol.
