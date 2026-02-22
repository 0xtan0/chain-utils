---
"@0xtan0/chain-utils-core": minor
---

Initial release of the core package with multichain client primitives for viem.

-   Configuration types (`ChainTransportConfig`, `ChainInput`) for defining chain/transport pairs
-   Transaction types (`PreparedTransaction`, `SignedTransaction`, `WriteOptions`) for the full write pipeline
-   Multicall types (`MulticallItemResult<T>`, `BatchResult<T>`, `CrossChainBatchResult<T>`) for batched reads
-   Error system with `ChainUtilsFault` base class, chain errors, multicall errors (`MulticallPartialFailure`, `MulticallBatchFailure`), and contract revert errors (`ContractReverted`)
-   Composite error decoder for typed error decoding across ABIs
-   Multichain client: typed collection of `PublicClient`s keyed by chain ID
-   Contract client with single reads, batch reads via multicall (multicall-first with sequential fallback), and full write pipeline (prepare → sign → send → wait)
-   Multichain contract for cross-chain contract interactions
-   Multisend support for bundled contract calls
