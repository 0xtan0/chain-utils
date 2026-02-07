# 12 - Core ContractClient — Write Operations

## Description

Add the transaction lifecycle methods to `ContractClient<TAbi>`: `prepare()`, `sign()`, `send()`, `waitForReceipt()`, and the `execute()` convenience method that runs the full pipeline.

## Testable Outcome

- `prepare()` calls `simulateContract` and returns a `PreparedTransaction`
- `prepare()` decodes reverts through `ErrorDecoder` when simulation fails
- `sign()` delegates to `walletClient.signTransaction`
- `send()` calls `sendRawTransaction`
- `waitForReceipt()` calls `waitForTransactionReceipt`
- `execute()` runs the full pipeline and returns `Hash` or `TransactionReceipt`
- Throws if `walletClient` is not provided for write operations

## Prompt

> Add `prepare()`, `sign()`, `send()`, `waitForReceipt()`, and `execute()` methods to `ContractClient<TAbi>` as defined in the tech design section 3.6. `prepare()` uses `publicClient.simulateContract`, catches reverts, and passes raw revert data through the `ErrorDecoder` (if provided). `sign()` requires a `walletClient`. `execute()` is a convenience that calls prepare -> sign -> send, and optionally `waitForReceipt` if `WriteOptions.waitForReceipt` is true. Write tests with mocked clients for each method, including revert decoding and the full pipeline.
