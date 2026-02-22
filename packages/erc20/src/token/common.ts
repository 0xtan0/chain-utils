import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains";

import { defineToken } from "./tokenBuilder.js";

/**
 * USDC — deployed across major EVM chains.
 * Type: ITokenDefinition<1 | 10 | 42161 | 8453 | 137>
 */
export const USDC = defineToken("USDC", { name: "USD Coin", decimals: 6 })
    .onChain(mainnet, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
    .onChain(optimism, "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85")
    .onChain(arbitrum, "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")
    .onChain(base, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
    .onChain(polygon, "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359")
    .build();

/**
 * WETH — Wrapped Ether (CCIP-supported chains).
 * Type: ITokenDefinition<1 | 10 | 42161 | 8453>
 */
export const WETH = defineToken("WETH", { name: "Wrapped Ether", decimals: 18 })
    .onChain(mainnet, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    .onChain(optimism, "0x4200000000000000000000000000000000000006")
    .onChain(arbitrum, "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1")
    .onChain(base, "0x4200000000000000000000000000000000000006")
    .build();

/**
 * USDT — Tether USD.
 * Type: ITokenDefinition<1 | 10 | 42161 | 137>
 */
export const USDT = defineToken("USDT", { name: "Tether USD", decimals: 6 })
    .onChain(mainnet, "0xdAC17F958D2ee523a2206206994597C13D831ec7")
    .onChain(optimism, "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58")
    .onChain(arbitrum, "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9")
    .onChain(polygon, "0xc2132D05D31c914a87C6611C10748AEb04B58e8F")
    .build();
