# 30 - Test Utils Fixtures, Assertions & Setup

## Description

Implement test fixtures (token metadata, mock chains), assertion helpers (`expectTokenBalance`, `expectBatchSuccess`, `expectPartialFailure`), and the `setupERC20TestClient` one-liner setup factory.

## Testable Outcome

- Token fixtures (`USDC_MAINNET`, `DAI_MAINNET`, `USDT_MAINNET`, `WETH_MAINNET`) have correct metadata
- `MOCK_MAINNET` and `MOCK_ARBITRUM` are valid chain definitions with multicall3
- `expectTokenBalance` asserts correct token/holder/balance
- `expectBatchSuccess` asserts all items have `status: "success"`
- `expectPartialFailure` asserts the correct number of failures
- `setupERC20TestClient` returns a wired `ERC20ReadClient` with mock responses

## Prompt

> Implement fixtures in `packages/erc20-test-utils/src/fixtures/tokens.ts` and `chains.ts`, assertion helpers in `helpers/assertions.ts`, and `setupERC20TestClient` in `helpers/setup.ts` as defined in tech design sections 5.2, 5.3, and 5.4. Token fixtures use real addresses and metadata. Mock chains include multicall3 address. Assertion helpers use vitest's `expect()`. `setupERC20TestClient` wires a mock PublicClient into an `ERC20ReadClient` with default mock responses. Export all from `external.ts` and wire `index.ts`. Write tests verifying fixtures have correct values and assertion helpers pass/fail appropriately.
