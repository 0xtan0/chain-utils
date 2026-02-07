# 25 - ERC20 Bound Token (ERC20Token & ERC20TokenBuilder)

## Description

Implement `ERC20Token<TChainId>` interface and `ERC20TokenBuilder` class. A bound token carries both per-chain addresses and RPC connections, enabling direct on-chain calls.

## Testable Outcome

- `ERC20TokenBuilder` constrains `.onChain()` to chain IDs present in the `MultichainClient`
- `.fromDefinition()` imports only overlapping chains
- Built `ERC20Token` can call `getBalance`, `getAllowance`, `getMetadata`, `getTotalSupply`
- `getBalance` dispatches to the correct chain's read client
- `getBalance` with specific chain IDs only queries those chains
- Returns `CrossChainBatchResult` with correct structure

## Prompt

> Implement `ERC20Token<TChainId>` in `packages/erc20/src/token/erc20Token.ts` and `ERC20TokenBuilder` in `packages/erc20/src/token/erc20TokenBuilder.ts` as defined in tech design sections 4.10.6 and 4.10.7. The builder takes a `MultichainClient`, constrains `onChain()` to valid chain IDs, supports `.metadata()` and `.fromDefinition()`. The bound token resolves per-chain addresses and delegates reads to the multichain client. `getBalance` and `getAllowance` accept optional chain ID subsets. `getMetadata` returns cached metadata when available. Write tests with mocked clients for builder validation, address resolution, and all read methods.
