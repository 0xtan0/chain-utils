# 19 - ERC20 Error Classes

## Description

Implement all ERC20-specific error classes: `InvalidAddress` and `NotERC20Contract` (in `errors/contract.ts`), and `InsufficientBalance`, `InsufficientAllowance`, `InvalidSender`, `InvalidReceiver`, `InvalidApprover`, `InvalidSpender` (in `errors/revert.ts`).

## Testable Outcome

- `InvalidAddress` and `NotERC20Contract` extend `ChainUtilsFault`
- All 6 revert errors extend `ContractReverted` (from core)
- Each error has correct `name` and domain-specific fields
- `instanceof` checks work through the full hierarchy
- Error messages are descriptive

## Prompt

> Implement ERC20 errors in `packages/erc20/src/errors/contract.ts` and `packages/erc20/src/errors/revert.ts` as defined in tech design sections 7.4. `InvalidAddress` extends `ChainUtilsFault` with `address: string`. `NotERC20Contract` extends `ChainUtilsFault` with `address: Address` and `chainId: number`. The 6 revert errors extend `ContractReverted`: `InsufficientBalance` (sender, balance, needed), `InsufficientAllowance` (spender, allowance, needed), `InvalidSender`, `InvalidReceiver`, `InvalidApprover`, `InvalidSpender`. Export all from `external.ts`. Write tests for construction, properties, and inheritance chain.
