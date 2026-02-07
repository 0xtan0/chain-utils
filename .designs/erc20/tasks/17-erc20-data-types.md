# 17 - ERC20 Data Types

## Description

Implement token and query data types in `packages/erc20/src/types/`: `TokenReference`, `TokenMetadata`, `TokenBalance`, `TokenAllowance` (in `token.ts`), and `BalanceQuery`, `AllowanceQuery`, `BatchBalanceResult`, `BatchAllowanceResult` (in `query.ts`).

## Testable Outcome

- `TokenMetadata` extends `TokenReference`
- All interfaces have correct readonly fields
- `BatchBalanceResult` and `BatchAllowanceResult` reference `MulticallItemResult<bigint>` from core
- Types compile correctly with sample data

## Prompt

> Implement data types in `packages/erc20/src/types/token.ts` and `packages/erc20/src/types/query.ts` as defined in tech design sections 4.3 and 4.4. `TokenReference` has `address: Address` and `chainId: number`. `TokenMetadata` extends `TokenReference` adding `name`, `symbol`, `decimals`. `TokenBalance` has `token: TokenReference`, `holder: Address`, `balance: bigint`. `TokenAllowance` has `token`, `owner`, `spender`, `allowance`. Query types include `BalanceQuery`, `AllowanceQuery`, and their batch result wrappers. Export all from `external.ts`. Write tests verifying the types compile with valid data.
