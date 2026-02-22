---
"@0xtan0/chain-utils/erc20": minor
---

Initial release of the ERC-20 package with type-safe token utilities for reads, writes, and multichain operations.

-   ERC-20 error types (`InsufficientBalance`, `InsufficientAllowance`, `InvalidSender`, `InvalidReceiver`, `InvalidApprover`, `InvalidSpender`, `InvalidAddress`, `NotERC20Contract`) with typed `ERC20ErrorDecoder`
-   Read client for balance, allowance, and metadata queries with multicall batching
-   Write client for `transfer`, `approve`, and `transferFrom` operations
-   `defineToken` builder for chain-agnostic token definitions with `.onChain(chain, address).build()` pattern
-   Prebuilt common token definitions (USDC, USDT, etc.)
-   `ERC20BoundToken` for zero-config reads by binding token definitions to RPC connections
-   Multichain client (`createERC20MultichainClient`) for cross-chain parallel queries
-   Token binding validation with intersection fallback and custom errors for unsupported chains
