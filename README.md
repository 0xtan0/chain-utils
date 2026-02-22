# @0xtan0/chain-utils

Type-safe EVM utilities for [viem](https://viem.sh/) with focused packages for core primitives, ERC-20, and ERC-721.
Built for both developers and agents that need readable code and predictable, low-overhead RPC execution.

## Motivation

Most teams start with direct `viem` calls, then quickly run into repeated ABI boilerplate, chain-by-chain branching, and unnecessary RPC fan-out for common reads. This library was built to keep the same low-level control while making multichain flows feel like application code, with multicall-first batch reads by default (when supported) to reduce request volume and cost.

## Highlights

-   Multicall-first batch reads on supported chains, with automatic fallback when multicall is unavailable.
-   Typed multichain orchestration so one call can query many chains in parallel.
-   Deterministic result and error shapes that are easy for services and agents to reason about.
-   TypeScript-first APIs that catch invalid chain/token usage at compile time.

## TypeScript Safety

```ts
import { createERC20MultichainClient, defineToken, USDC } from "@0xtan0/chain-utils/erc20";
import { createPublicClient, http } from "viem";
import { arbitrum, mainnet, optimism } from "viem/chains";

const mainnetRpc = createPublicClient({ chain: mainnet, transport: http() });
const opRpc = createPublicClient({ chain: optimism, transport: http() });
const arbRpc = createPublicClient({ chain: arbitrum, transport: http() });

const multichain = createERC20MultichainClient([mainnetRpc, opRpc, arbRpc]);
const usdc = multichain.forToken(USDC);

await usdc.getBalances([alice, bob]); // one call, all configured chains

multichain.getClient(mainnet.id); // ok

const WETH_TYPED = defineToken("WETH", { name: "Wrapped Ether", decimals: 18 })
    .onChain(mainnet, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    .onChain(optimism, "0x4200000000000000000000000000000000000006")
    .build();

WETH_TYPED.address(mainnet.id); // ok

// @ts-expect-error This token definition has no Arbitrum mapping
WETH_TYPED.address(arbitrum.id);
```

## Example

Without a shared multichain abstraction, balance checks for multiple holders quickly become repetitive per-chain contract reads:

```ts
const [
    mainnetAliceBalance,
    mainnetBobBalance,
    opAliceBalance,
    opBobBalance,
    arbAliceBalance,
    arbBobBalance,
] = await Promise.all([
    mainnetClient.readContract({
        address: USDC_MAINNET,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [alice],
    }),
    mainnetClient.readContract({
        address: USDC_MAINNET,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [bob],
    }),
    optimismClient.readContract({
        address: USDC_OPTIMISM,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [alice],
    }),
    optimismClient.readContract({
        address: USDC_OPTIMISM,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [bob],
    }),
    arbitrumClient.readContract({
        address: USDC_ARBITRUM,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [alice],
    }),
    arbitrumClient.readContract({
        address: USDC_ARBITRUM,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [bob],
    }),
]);
```

With `chain-utils`, the token definition and chain mapping live in one place, and batch/multichain flows are built in:

```ts
import { createERC20MultichainClient, USDC } from "@0xtan0/chain-utils/erc20";

const multichain = createERC20MultichainClient([mainnetRpc, opRpc, arbRpc]);
const usdc = multichain.forToken(USDC);

const balances = await usdc.getBalances([alice, bob]);
```

## Packages

| Package                      | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `@0xtan0/chain-utils/core`   | Shared multichain client primitives                              |
| `@0xtan0/chain-utils/erc20`  | ERC-20 read/write clients, token definitions, multichain queries |
| `@0xtan0/chain-utils/erc721` | ERC-721 read/write clients with bound collection reader/writer   |

## Install

```bash
pnpm add @0xtan0/chain-utils/erc20 viem
```

## Quick Start

### Use a token definition

A `TokenDefinition` is pure data — no RPC, no side effects. For common tokens, import a prebuilt definition:

```ts
import { USDC, USDT } from "@0xtan0/chain-utils/erc20";
```

Or define your own token mapping:

```ts
import { defineToken } from "@0xtan0/chain-utils/erc20";
import { arbitrum, mainnet, optimism } from "viem/chains";

const WETH = defineToken("WETH", { name: "Wrapped Ether", decimals: 18 })
    .onChain(mainnet, "0xC02a...6Cc2")
    .onChain(optimism, "0x4200...0006")
    .onChain(arbitrum, "0x82aF...5C02")
    .build();
```

### Single-chain reads

Create a read client for one chain and query balances, allowances, and metadata.

```ts
import { createERC20Client, USDC } from "@0xtan0/chain-utils/erc20";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const rpc = createPublicClient({ chain: mainnet, transport: http() });
const client = createERC20Client({ client: rpc });

const tokenAddress = USDC.address(mainnet.id);

const metadata = await client.getTokenMetadata(tokenAddress);
const supply = await client.getTotalSupply(tokenAddress);
const balance = await client.getBalance(tokenAddress, alice);
const allowance = await client.getAllowance(tokenAddress, owner, spender);
```

### Multichain reads

One client, multiple chains. All RPC calls fire in parallel.

```ts
import { createERC20MultichainClient, USDC } from "@0xtan0/chain-utils/erc20";

const multichain = createERC20MultichainClient([mainnetRpc, opRpc, arbRpc]);

// Single holder, all chains at once
const balances = await multichain.getTokenBalance(USDC, alice);

for (const [chainId, balance] of balances.resultsByChain) {
    console.log(`Chain ${chainId}: ${balance.balance}`);
}
```

### Bound tokens

Attach RPC connections to a token definition for zero-config reads.

```ts
const usdc = multichain.forToken(USDC);

console.log(usdc.symbol); // "USDC"
console.log(usdc.chainIds); // [1, 10, 42161]

// Balance across all bound chains
const balances = await usdc.getBalance(alice);

// Multiple holders at once
const all = await usdc.getBalances([alice, bob]);
```

### Transfers (convenience)

One call handles the full lifecycle: simulate, estimate gas, sign, broadcast, and wait.

```ts
import { createERC20WriteClient } from "@0xtan0/chain-utils/erc20";
import { createWalletClient, http } from "viem";

const wallet = createWalletClient({
    chain: mainnet,
    transport: http(),
    account,
});

const writer = createERC20WriteClient({
    client: rpc,
    walletClient: wallet,
});

const receipt = await writer.transfer(tokenAddress, bob, amount, {
    waitForReceipt: true,
});
```

### Approve + TransferFrom

```ts
// Alice approves Bob
await aliceWriter.approve(tokenAddress, bob, amount, {
    waitForReceipt: true,
});

// Check allowance
const { allowance } = await client.getAllowance(tokenAddress, alice, bob);

// Bob spends the allowance
await bobWriter.transferFrom(tokenAddress, alice, bob, amount, {
    waitForReceipt: true,
});
```

### Granular transaction control

For full control, use the prepare / sign / send / wait pipeline.

```ts
// 1. Prepare — simulate + estimate gas
const prepared = await writer.prepareTransferFrom(tokenAddress, from, to, amount);

// 2. Sign — produce signed bytes (no broadcast)
const signed = await writer.signTransaction(prepared);

// 3. Send — broadcast the raw transaction
const hash = await writer.sendTransaction(signed);

// 4. Wait — poll until mined
const receipt = await writer.waitForReceipt(hash);
```

## Prerequisites

-   Node 22
-   pnpm 10+

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT — see [`LICENSE`](./LICENSE).
