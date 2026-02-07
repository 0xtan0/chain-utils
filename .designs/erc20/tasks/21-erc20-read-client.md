# 21 - ERC20 Read Client Implementation

## Description

Implement `ERC20ReadClientImpl` and `createERC20Client` factory in `packages/erc20/src/client/erc20ReadClient.ts`. This class composes a `ContractClient<ERC20Abi>` and provides typed, domain-specific read operations.

## Testable Outcome

- `getTokenMetadata` fetches name, symbol, decimals via multicall/sequential reads
- `getBalance` returns a `TokenBalance` with correct fields
- `getAllowance` returns a `TokenAllowance`
- `getTotalSupply` returns a `bigint`
- `getBalances` dispatches batch queries via `readBatch`
- `getAllowances` dispatches batch queries via `readBatch`
- `getTokenMetadataBatch` fetches metadata for multiple tokens
- Invalid addresses throw `InvalidAddress`

## Prompt

> Implement `ERC20ReadClientImpl` and `createERC20Client` factory in `packages/erc20/src/client/erc20ReadClient.ts` as defined in tech design sections 4.5 and 4.8. The class composes a `ContractClient<ERC20Abi>` (created internally). Single reads delegate to `contract.read()` and wrap results in domain types (`TokenMetadata`, `TokenBalance`, `TokenAllowance`). Batch reads build multicall arrays and delegate to `contract.readBatch()`. Validate addresses before calling. Wire `ERC20ErrorDecoder` into the `ContractClient`. Write tests with mocked `PublicClient` for all read methods, both single and batch, including error cases.
