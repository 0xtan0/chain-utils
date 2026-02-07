# 22 - ERC20 Write Client Implementation

## Description

Implement `ERC20WriteClientImpl` and `createERC20WriteClient` factory in `packages/erc20/src/client/erc20WriteClient.ts`. Extends the read client with the full transaction lifecycle for approve, transfer, and transferFrom.

## Testable Outcome

- `prepareApprove/prepareTransfer/prepareTransferFrom` delegate to `contract.prepare()`
- `signTransaction` delegates to `contract.sign()`
- `sendTransaction` delegates to `contract.send()`
- `waitForReceipt` delegates to `contract.waitForReceipt()`
- Convenience methods (`approve`, `transfer`, `transferFrom`) run the full pipeline
- Convenience methods respect `WriteOptions.waitForReceipt`
- Revert errors are decoded to typed ERC20 errors

## Prompt

> Implement `ERC20WriteClientImpl` and `createERC20WriteClient` in `packages/erc20/src/client/erc20WriteClient.ts` as defined in tech design sections 4.6 and 4.8. The class implements `ERC20WriteClient`, extending the read client functionality. Prepare methods delegate to `contract.prepare()` with the correct function name and args. Convenience methods (`approve`, `transfer`, `transferFrom`) call prepare -> sign -> send, and optionally wait for receipt. Requires a `WalletClient`. Write tests with mocked PublicClient and WalletClient for prepare, sign, send, wait, and full pipeline, including revert decoding scenarios.
