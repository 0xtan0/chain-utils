# @0xtan0/chain-utils-erc20

Type-safe ERC-20 utilities for [viem](https://viem.sh/). Define a token once, query balances across every chain, and execute transfers with full type safety.

Built on top of `@0xtan0/chain-utils-core` for production app code and agent-driven automation flows.

## Install

```bash
pnpm add @0xtan0/chain-utils-erc20 viem
```

## Highlights

-   `defineToken` stores symbol, metadata, and per-chain addresses in one reusable definition.
-   Batch reads (`getBalances`, `getAllowances`, `getTokenMetadataBatch`) are multicall-first by default via core.
-   `createERC20MultichainClient` runs cross-chain reads in parallel with typed chain-keyed results.
-   `forToken` binds token + RPC clients to reduce repeated arguments in every call.
-   Chain, token, and query shapes are validated by TypeScript before runtime.

## TypeScript Safety

```ts
import { createERC20MultichainClient, defineToken } from "@0xtan0/chain-utils-erc20";
import { createPublicClient, http } from "viem";
import { arbitrum, mainnet, optimism } from "viem/chains";

const client = createERC20MultichainClient([
    createPublicClient({ chain: mainnet, transport: http() }),
    createPublicClient({ chain: optimism, transport: http() }),
] as const);

const WETH_TYPED = defineToken("WETH", { name: "Wrapped Ether", decimals: 18 })
    .onChain(mainnet, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    .onChain(optimism, "0x4200000000000000000000000000000000000006")
    .build();

const holder = "0x000000000000000000000000000000000000dEaD";

await client.getTokenBalance(WETH_TYPED, holder, [mainnet.id]); // ok

// @ts-expect-error Token definition has no Arbitrum address
await client.getTokenBalance(WETH_TYPED, holder, [arbitrum.id]);

await client.getBalances([
    {
        chainId: mainnet.id,
        token: WETH_TYPED.address(mainnet.id),
        holder,
    },
]); // ok

// @ts-expect-error chainId must be one of the configured client chains (1 | 10)
await client.getBalances([
    {
        chainId: arbitrum.id,
        token: WETH_TYPED.address(mainnet.id),
        holder,
    },
]);
```

### Example

Direct `viem` usage typically duplicates token addresses and read logic per chain:

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
        abi: erc20Abi,
        address: USDC_MAINNET,
        functionName: "balanceOf",
        args: [alice],
    }),
    mainnetClient.readContract({
        abi: erc20Abi,
        address: USDC_MAINNET,
        functionName: "balanceOf",
        args: [bob],
    }),
    optimismClient.readContract({
        abi: erc20Abi,
        address: USDC_OPTIMISM,
        functionName: "balanceOf",
        args: [alice],
    }),
    optimismClient.readContract({
        abi: erc20Abi,
        address: USDC_OPTIMISM,
        functionName: "balanceOf",
        args: [bob],
    }),
    arbitrumClient.readContract({
        abi: erc20Abi,
        address: USDC_ARBITRUM,
        functionName: "balanceOf",
        args: [alice],
    }),
    arbitrumClient.readContract({
        abi: erc20Abi,
        address: USDC_ARBITRUM,
        functionName: "balanceOf",
        args: [bob],
    }),
]);
```

With `erc20`, one token definition and one call handle the same flow:

```ts
import { createERC20MultichainClient, USDC } from "@0xtan0/chain-utils-erc20";

const multichain = createERC20MultichainClient([mainnetRpc, opRpc, arbRpc]);
const usdc = multichain.forToken(USDC);

const balances = await usdc.getBalances([alice, bob]);
```

## Usage

### Use a token definition

A `TokenDefinition` is pure data — no RPC, no side effects. For common tokens, import a prebuilt definition:

```ts
import { USDC, USDT } from "@0xtan0/chain-utils-erc20";
```

Or define your own token mapping:

```ts
import { defineToken } from "@0xtan0/chain-utils-erc20";
import { arbitrum, mainnet, optimism } from "viem/chains";

const WETH = defineToken("WETH", { name: "Wrapped Ether", decimals: 18 })
    .onChain(mainnet, "0xC02a...6Cc2")
    .onChain(optimism, "0x4200...0006")
    .onChain(arbitrum, "0x82aF...5C02")
    .build();
```

### Single-chain reads

```ts
import { createERC20Client, USDC } from "@0xtan0/chain-utils-erc20";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const rpc = createPublicClient({ chain: mainnet, transport: http() });
const client = createERC20Client({ client: rpc });

const tokenAddress = USDC.address(mainnet.id);
const meta = await client.getTokenMetadata(tokenAddress);
const supply = await client.getTotalSupply(tokenAddress);
const balance = await client.getBalance(tokenAddress, account);
const allow = await client.getAllowance(tokenAddress, owner, spender);
```

### Multichain reads

One client, multiple chains. All RPC calls fire in parallel.

```ts
import { createERC20MultichainClient, USDC } from "@0xtan0/chain-utils-erc20";

const multichain = createERC20MultichainClient([mainnetRpc, opRpc, arbRpc]);

const balances = await multichain.getTokenBalance(USDC, account);

for (const [chainId, bal] of balances.resultsByChain) {
    console.log(`Chain ${chainId}: ${bal.balance}`);
}
```

Per-chain metadata:

```ts
for (const chainId of multichain.chainIds) {
    const client = multichain.getClient(chainId);
    const meta = await client.getTokenMetadata(USDC.address(chainId));
    console.log(`${meta.symbol} on chain ${chainId}`);
}
```

### Bound tokens

Attach RPC connections to a token definition for zero-config reads.

```ts
const usdc = multichain.forToken(USDC);

usdc.symbol; // "USDC"
usdc.chainIds; // [1, 10, 42161]

// One holder, all chains
const balances = await usdc.getBalance(account);

// Multiple holders, all chains
const all = await usdc.getBalances([alice, bob]);
```

### Transfers

One call handles simulate, estimate gas, sign, broadcast, and wait.

```ts
import { createERC20WriteClient, USDC } from "@0xtan0/chain-utils-erc20";
import { createWalletClient, http } from "viem";

const wallet = createWalletClient({ chain: mainnet, transport: http(), account });
const writer = createERC20WriteClient({ client: rpc, walletClient: wallet });
const usdcAddress = USDC.address(mainnet.id);

const receipt = await writer.transfer(usdcAddress, to, amount, {
    waitForReceipt: true,
});
```

### Approve + TransferFrom

```ts
await aliceWriter.approve(usdcAddress, spender, amount, { waitForReceipt: true });

const { allowance } = await client.getAllowance(usdcAddress, alice, spender);

await spenderWriter.transferFrom(usdcAddress, alice, spender, amount, {
    waitForReceipt: true,
});
```

### Granular transaction control

Full prepare / sign / send / wait pipeline for maximum control.

```ts
const prepared = await writer.prepareTransferFrom(usdcAddress, from, to, amount);
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
