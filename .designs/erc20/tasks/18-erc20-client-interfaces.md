# 18 - ERC20 Client Interfaces & Options

## Description

Define the `ERC20ReadClient`, `ERC20WriteClient`, and `ERC20MultichainClient<TChainId>` interfaces in `packages/erc20/src/types/client.ts`, and the options types in `packages/erc20/src/types/options.ts`.

## Testable Outcome

- `ERC20WriteClient` extends `ERC20ReadClient`
- `ERC20ReadClient` exposes single reads and batch reads
- `ERC20MultichainClient` exposes cross-chain reads and `forToken()`
- Options types define all required/optional constructor parameters
- Types compile correctly

## Prompt

> Define `ERC20ReadClient`, `ERC20WriteClient`, and `ERC20MultichainClient<TChainId>` interfaces in `packages/erc20/src/types/client.ts` as defined in tech design sections 4.5, 4.6, and 4.7. Define `ERC20ClientOptions`, `ERC20WriteClientOptions`, and `ERC20MultichainClientOptions` in `packages/erc20/src/types/options.ts` as in section 4.8. The read client has single reads (`getTokenMetadata`, `getBalance`, `getAllowance`, `getTotalSupply`) and batch reads. The write client extends read and adds prepare/sign/send/wait lifecycle + convenience methods. The multichain client has cross-chain reads and `forToken()`. Export all from `external.ts`. Write type-level tests.
