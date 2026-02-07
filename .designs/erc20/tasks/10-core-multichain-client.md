# 10 - Core MultichainClient

## Description

Implement `MultichainClient<TChainId>` class and `createMultichainClient` factory in `packages/core/src/client/multichainClient.ts`. This is the ABI-agnostic container that holds one `PublicClient` per chain.

## Testable Outcome

- `getPublicClient(chainId)` returns the correct client
- `getPublicClient` throws `UnsupportedChain` for unconfigured chains
- `hasChain` returns correct boolean
- `withChain` returns a new instance with the added chain (immutable)
- Factory creates from both `PublicClient[]` and `ChainTransportConfig[]`

## Prompt

> Implement `MultichainClient<TChainId>` and `createMultichainClient` in `packages/core/src/client/multichainClient.ts` as defined in the tech design section 3.5. The class stores clients in a `ReadonlyMap<TChainId, PublicClient>`. `getPublicClient` throws `UnsupportedChain` if the chain is not found. `withChain` returns a new `MultichainClient` with the union type. The factory has two overloads: from `PublicClient[]` (extracting `chain.id`) and from `ChainTransportConfig[]` (creating PublicClients via `createPublicClient`). Export from `external.ts`. Write tests using mock PublicClients for all methods and error cases.
