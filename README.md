# @0xtan0/chain-utils

Type-safe EVM utilities for [viem](https://viem.sh/) with focused packages for core primitives, ERC-20, and ERC-721.

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

### Define a token

A `TokenDefinition` is pure data — no RPC, no side effects. Define it once in a shared module and import it everywhere.

```ts
import { defineToken } from "@0xtan0/chain-utils/erc20";
import { arbitrum, mainnet, optimism } from "viem/chains";

const WETH = defineToken("WETH", { name: "Wrapped Ether", decimals: 18 })
    .onChain(mainnet, "0xC02a...6Cc2")
    .onChain(optimism, "0x4200...0006")
    .onChain(arbitrum, "0x82aF...5C02")
    .build();
```

Common tokens like `USDC` and `USDT` are included out of the box:

```ts
import { USDC, USDT } from "@0xtan0/chain-utils/erc20";
```

### Single-chain reads

Create a read client for one chain and query balances, allowances, and metadata.

```ts
import { createERC20Client } from "@0xtan0/chain-utils/erc20";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const rpc = createPublicClient({ chain: mainnet, transport: http() });
const client = createERC20Client({ client: rpc });

const tokenAddress = WETH.address(mainnet.id);

const metadata = await client.getTokenMetadata(tokenAddress);
const supply = await client.getTotalSupply(tokenAddress);
const balance = await client.getBalance(tokenAddress, alice);
const allowance = await client.getAllowance(tokenAddress, owner, spender);
```

### Multichain reads

One client, multiple chains. All RPC calls fire in parallel.

```ts
import { createERC20MultichainClient } from "@0xtan0/chain-utils/erc20";

const multichain = createERC20MultichainClient([mainnetRpc, opRpc, arbRpc]);

// Single holder, all chains at once
const balances = await multichain.getTokenBalance(WETH, alice);

for (const [chainId, balance] of balances.resultsByChain) {
    console.log(`Chain ${chainId}: ${balance.balance}`);
}
```

### Bound tokens

Attach RPC connections to a token definition for zero-config reads.

```ts
const weth = multichain.forToken(WETH);

console.log(weth.symbol); // "WETH"
console.log(weth.chainIds); // [1, 10, 42161]

// Balance across all bound chains
const balances = await weth.getBalance(alice);

// Multiple holders at once
const all = await weth.getBalances([alice, bob]);
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
