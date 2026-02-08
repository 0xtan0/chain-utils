# @0xtan0/chain-utils/erc20

Type-safe ERC-20 utilities for [viem](https://viem.sh/). Define a token once, query balances across every chain, and execute transfers with full type safety.

Built on top of `@0xtan0/chain-utils/core`.

## Install

```bash
pnpm add @0xtan0/chain-utils/erc20 viem
```

## Usage

### Define a token

A `TokenDefinition` is pure data — no RPC, no side effects. Define it once and import it everywhere.

```ts
import { defineToken } from "@0xtan0/chain-utils/erc20";
import { arbitrum, mainnet, optimism } from "viem/chains";

const WETH = defineToken("WETH", { name: "Wrapped Ether", decimals: 18 })
    .onChain(mainnet, "0xC02a...6Cc2")
    .onChain(optimism, "0x4200...0006")
    .onChain(arbitrum, "0x82aF...5C02")
    .build();
```

Common tokens ship out of the box:

```ts
import { USDC, USDT } from "@0xtan0/chain-utils/erc20";
```

### Single-chain reads

```ts
import { createERC20Client } from "@0xtan0/chain-utils/erc20";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const rpc = createPublicClient({ chain: mainnet, transport: http() });
const client = createERC20Client({ client: rpc });

const meta = await client.getTokenMetadata(address);
const supply = await client.getTotalSupply(address);
const balance = await client.getBalance(address, account);
const allow = await client.getAllowance(address, owner, spender);
```

### Multichain reads

One client, multiple chains. All RPC calls fire in parallel.

```ts
import { createERC20MultichainClient } from "@0xtan0/chain-utils/erc20";

const multichain = createERC20MultichainClient([mainnetRpc, opRpc, arbRpc]);

const balances = await multichain.getTokenBalance(WETH, account);

for (const [chainId, bal] of balances.resultsByChain) {
    console.log(`Chain ${chainId}: ${bal.balance}`);
}
```

Per-chain metadata:

```ts
for (const chainId of multichain.chainIds) {
    const client = multichain.getClient(chainId);
    const meta = await client.getTokenMetadata(WETH.address(chainId));
    console.log(`${meta.symbol} on chain ${chainId}`);
}
```

### Bound tokens

Attach RPC connections to a token definition for zero-config reads.

```ts
const weth = multichain.forToken(WETH);

weth.symbol; // "WETH"
weth.chainIds; // [1, 10, 42161]

// One holder, all chains
const balances = await weth.getBalance(account);

// Multiple holders, all chains
const all = await weth.getBalances([alice, bob]);
```

### Transfers

One call handles simulate, estimate gas, sign, broadcast, and wait.

```ts
import { createERC20WriteClient } from "@0xtan0/chain-utils/erc20";
import { createWalletClient, http } from "viem";

const wallet = createWalletClient({ chain: mainnet, transport: http(), account });
const writer = createERC20WriteClient({ client: rpc, walletClient: wallet });

const receipt = await writer.transfer(address, to, amount, {
    waitForReceipt: true,
});
```

### Approve + TransferFrom

```ts
await aliceWriter.approve(address, spender, amount, { waitForReceipt: true });

const { allowance } = await client.getAllowance(address, alice, spender);

await spenderWriter.transferFrom(address, alice, spender, amount, {
    waitForReceipt: true,
});
```

### Granular transaction control

Full prepare / sign / send / wait pipeline for maximum control.

```ts
const prepared = await writer.prepareTransferFrom(address, from, to, amount);
const signed = await writer.signTransaction(prepared);
const hash = await writer.sendTransaction(signed);
const receipt = await writer.waitForReceipt(hash);
```

## API Summary

| Export                        | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `defineToken`                 | Builder for chain-agnostic token definitions                |
| `USDC`, `USDT`                | Pre-built token definitions for common tokens               |
| `createERC20Client`           | Single-chain read client (balance, allowance, metadata)     |
| `createERC20WriteClient`      | Single-chain write client (transfer, approve, transferFrom) |
| `createERC20MultichainClient` | Multichain client with parallel cross-chain queries         |
| `ERC20BoundToken`             | Token + RPC connections for zero-config reads               |
| `ERC20ErrorDecoder`           | Decodes ERC-20 revert errors into typed exceptions          |

## Errors

The package throws typed errors for common ERC-20 failures:

-   `InsufficientBalance` / `InsufficientAllowance`
-   `InvalidSender` / `InvalidReceiver`
-   `InvalidApprover` / `InvalidSpender`
-   `InvalidAddress` / `NotERC20Contract`

## License

MIT
