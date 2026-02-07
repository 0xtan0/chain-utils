# 16 - ERC20 ABI Definitions

## Description

Implement the ERC20 standard ABI (`erc20Abi`) and the OpenZeppelin v5 custom errors ABI (`erc20ErrorsAbi`) as `const` assertions for full viem type inference.

## Testable Outcome

- `erc20Abi` includes all standard ERC20 functions (name, symbol, decimals, totalSupply, balanceOf, allowance, approve, transfer, transferFrom) and events (Transfer, Approval)
- `erc20ErrorsAbi` includes all 6 OZ v5 custom error definitions
- Both are typed as `const` for viem ABI inference
- Type aliases `ERC20Abi` and `ERC20ErrorsAbi` are exported

## Prompt

> Implement `erc20Abi` in `packages/erc20/src/abi/erc20Abi.ts` and `erc20ErrorsAbi` in `packages/erc20/src/abi/erc20ErrorsAbi.ts` as defined in tech design sections 4.1 and 4.2. Use `as const` assertions. The standard ABI includes all ERC20 view functions, state-changing functions, and events. The errors ABI includes the 6 OpenZeppelin v5 custom errors: `ERC20InsufficientBalance`, `ERC20InsufficientAllowance`, `ERC20InvalidSender`, `ERC20InvalidReceiver`, `ERC20InvalidApprover`, `ERC20InvalidSpender`. Export type aliases `ERC20Abi` and `ERC20ErrorsAbi`. Write tests verifying the ABI arrays have the correct length and contain expected function/error names.
