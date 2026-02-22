# @0xtan0/chain-utils-erc721

## 0.1.0

### Minor Changes

-   29347fb: Initial release of the ERC-721 package with type-safe NFT utilities for read/write operations and collection binding.

    -   ERC-721 ABIs for standard and error contracts
    -   Error types (`InvalidAddress`, `NotERC721Contract`, `NotERC721Enumerable`, `NonexistentToken`, `IncorrectOwner`, `InsufficientApproval`, `InvalidSender`, `InvalidReceiver`, `InvalidApprover`, `InvalidOperator`) with typed `ERC721ErrorDecoder`
    -   Read client for owner queries, batch ownership checks, collection metadata, token URIs, balance/approval queries, and enumerable operations with ERC165 support detection
    -   Write client for `approve`, `setApprovalForAll`, `transferFrom`, and `safeTransferFrom` operations
    -   `ERC721CollectionReader` and `ERC721CollectionWriter` for bound single-chain collection operations
    -   Improved multicall failure mapping for enumerable operations

### Patch Changes

-   Updated dependencies [29347fb]
    -   @0xtan0/chain-utils-core@0.1.0
