# 23 - ERC20 Token Definition & Builder

## Description

Implement `TokenDefinition<TChainId>` interface and `TokenBuilder<TChainId>` in `packages/erc20/src/token/`, along with the `defineToken()` factory function. This provides type-safe token address mapping across chains.

## Testable Outcome

- `defineToken("USDC").onChain(mainnet, addr).build()` produces a `TokenDefinition<1>`
- Chaining `.onChain()` accumulates chain IDs in the type
- `.address(chainId)` returns the correct address for configured chains
- `.address(chainId)` throws for unconfigured chains
- `.hasChain()` returns correct boolean
- `.toTokenReference()` and `.toTokenMetadata()` produce correct objects
- `.build()` with no chains throws

## Prompt

> Implement `TokenDefinition<TChainId>` interface in `packages/erc20/src/token/tokenDefinition.ts`, `TokenBuilder<TChainId>` and `defineToken()` factory in `packages/erc20/src/token/tokenBuilder.ts` as defined in tech design sections 4.10.2 and 4.10.3. The builder uses a fluent API: `defineToken(symbol, options?).onChain(chain, address).build()`. `onChain` has two overloads: accepting a viem `Chain` object or a numeric chain ID. The built `TokenDefinition` stores addresses in a `ReadonlyMap`, implements `address()`, `hasChain()`, `toTokenReference()`, `toTokenMetadata()`. Write tests for the builder pattern, type-safe chain ID tracking, and all `TokenDefinition` methods.
