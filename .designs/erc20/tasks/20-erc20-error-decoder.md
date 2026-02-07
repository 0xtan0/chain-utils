# 20 - ERC20 Error Decoder

## Description

Implement `ERC20ErrorDecoder` in `packages/erc20/src/decoder/erc20ErrorDecoder.ts`. It decodes raw revert data against known ERC20 error selectors, mapping to typed error classes.

## Testable Outcome

- Decodes OZ v5 custom errors (e.g., `ERC20InsufficientBalance` -> `InsufficientBalance`)
- Decodes custom error ABI fragments (user-provided)
- Decodes legacy string revert messages (e.g., `"ERC20: transfer amount exceeds balance"`)
- Returns `null` for unrecognized data
- Implements the `ErrorDecoder` interface from core

## Prompt

> Implement `ERC20ErrorDecoder` in `packages/erc20/src/decoder/erc20ErrorDecoder.ts` as defined in tech design sections 4.9 and 8. It implements the `ErrorDecoder` interface. The `decode(rawData)` method tries in order: 1) decode against `erc20ErrorsAbi` mapping to typed errors, 2) decode against optional `customErrorAbi`, 3) decode as legacy string revert matching known ERC20 patterns. Returns `null` if unrecognized. Use viem's `decodeErrorResult` for ABI-based decoding. Write tests with encoded error data for each OZ v5 error, legacy string reverts, custom errors, and unrecognized data.
