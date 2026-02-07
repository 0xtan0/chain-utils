# 26 - ERC20 Multichain Client Implementation

## Description

Implement `ERC20MultichainClientImpl` and `createERC20MultichainClient` factory. This composes a `MultichainContract<ERC20Abi, TChainId>` and routes requests to per-chain `ERC20ReadClient` instances.

## Testable Outcome

- `getClient(chainId)` returns the correct `ERC20ReadClient`
- `getBalanceAcrossChains` queries the same token on multiple chains in parallel
- `getBalances` groups queries by chain and dispatches in parallel
- `getAllowances` groups queries by chain and dispatches in parallel
- `getTokenBalance` resolves addresses from `TokenDefinition` per chain
- `getTokenAllowance` resolves addresses from `TokenDefinition`
- `forToken` returns a bound `ERC20Token`
- Factory overloads work from `PublicClient[]` and `ChainTransportConfig[]`

## Prompt

> Implement `ERC20MultichainClientImpl` and `createERC20MultichainClient` in `packages/erc20/src/client/erc20MultichainClient.ts` as defined in tech design sections 4.7 and 4.8. The class manages one `ERC20ReadClient` per chain. Cross-chain methods use `Promise.allSettled` for parallel dispatch. `getTokenBalance` and `getTokenAllowance` resolve per-chain addresses from `TokenDefinition`, only querying chains present in both the client and the definition. `forToken` creates an `ERC20Token` using `ERC20TokenBuilder`. Two factory overloads. Write tests covering all cross-chain methods, partial chain failures, token definition address resolution, and the `forToken` flow.
