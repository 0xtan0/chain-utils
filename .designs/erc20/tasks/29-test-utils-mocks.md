# 29 - Test Utils Mock Factories

## Description

Implement mock factories: `createMockPublicClient`, `createMockWalletClient`, and `createMockERC20Responses` with `toReadContractOverrides`. These enable unit testing ERC20 clients without real RPC calls.

## Testable Outcome

- `createMockPublicClient` returns a mock that responds to `readContract` and `multicall`
- Read contract responses are keyed by `${address}:${functionName}`
- `multicall` delegates to the override or auto-generates from read overrides
- `supportsMulticall3` controls whether `chain.contracts.multicall3` is present
- `createMockWalletClient` returns a mock with configurable sign/send results
- `createMockERC20Responses` generates default token metadata, balances, allowances
- `toReadContractOverrides` converts a response set into the map format

## Prompt

> Implement `createMockPublicClient` in `packages/erc20-test-utils/src/mocks/mockPublicClient.ts`, `createMockWalletClient` in `mockWalletClient.ts`, and `createMockERC20Responses`/`toReadContractOverrides` in `mockERC20Responses.ts` as defined in tech design section 5.1. The mock PublicClient should intercept `readContract` calls using a key-based lookup map, support `multicall` override, and configure multicall3 support. The mock WalletClient should return configurable results. Write tests verifying each mock factory returns working mocks that respond correctly.
