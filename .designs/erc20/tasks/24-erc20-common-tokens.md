# 24 - ERC20 Pre-Built Common Token Definitions

## Description

Define pre-built `TokenDefinition` instances for USDC, USDT, DAI, and WETH with their real contract addresses across mainnet, optimism, arbitrum, base, and polygon.

## Testable Outcome

- Each token has the correct symbol, name, and decimals
- Each token has addresses for the correct set of chains
- Addresses match the real deployed contract addresses
- Types capture the correct chain ID unions (e.g., `USDC` is `TokenDefinition<1 | 10 | 42161 | 8453 | 137>`)

## Prompt

> Define `USDC`, `USDT`, `DAI`, and `WETH` in `packages/erc20/src/token/common.ts` using the `defineToken()` builder as defined in tech design section 4.10.4. Use the real deployed addresses from the design. USDC and DAI have 5 chains (mainnet, optimism, arbitrum, base, polygon). USDT has 4 chains (no base). WETH has 5 chains. Set correct name and decimals. Export all from `external.ts`. Write tests verifying each token's symbol, decimals, chain count, and that `address()` returns the correct address per chain.
