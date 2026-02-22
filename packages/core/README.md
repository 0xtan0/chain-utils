# @0xtan0/chain-utils/core

Low-level multichain client primitives for [viem](https://viem.sh/). It handles RPC connections, contract reads/writes, multicall batching, and the `prepare -> sign -> send` pipeline.

This package is the foundation for higher-level packages (like `@0xtan0/chain-utils/erc20`) and is designed for both application developers and autonomous agents.

## Install

```bash
pnpm add @0xtan0/chain-utils/core viem
```

## Highlights

-   `createMultichainClient` keeps chain wiring in one typed object instead of scattered per-chain conditionals.
-   `ContractClient.readBatch` is multicall-first by default on chains with Multicall3, then falls back to sequential reads if needed.
-   A single write flow (`prepare`, `sign`, `send`, `waitForReceipt`) removes ad-hoc transaction plumbing.
-   Chain IDs and ABI function signatures are enforced at compile time.

## TypeScript Safety

```ts
import { createContractClient, createMultichainClient } from "@0xtan0/chain-utils/core";
import { createPublicClient, http } from "viem";
import { arbitrum, mainnet, optimism } from "viem/chains";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });
const contractAddress = "0x0000000000000000000000000000000000000000";

const multichain = createMultichainClient([
    createPublicClient({ chain: mainnet, transport: http() }),
    createPublicClient({ chain: optimism, transport: http() }),
] as const);

// @ts-expect-error Chain 42161 is not configured in this multichain client
multichain.getPublicClient(arbitrum.id);

const counterAbi = [
    {
        type: "function",
        name: "count",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "increment",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
] as const;

const client = createContractClient({ abi: counterAbi, publicClient });

await client.read(contractAddress, "count"); // ok

// @ts-expect-error count() takes no arguments
await client.read(contractAddress, "count", [1n]);
```

### Example

Manual reads usually mean repeated `readContract` calls and custom error handling:

```ts
const [tokenABalance, tokenBBalance] = await Promise.all([
    publicClient.readContract({
        abi: erc20Abi,
        address: tokenA,
        functionName: "balanceOf",
        args: [account],
    }),
    publicClient.readContract({
        abi: erc20Abi,
        address: tokenB,
        functionName: "balanceOf",
        args: [account],
    }),
]);
```

With `core`, the same flow is one typed batch call:

```ts
const client = createContractClient({
    abi: erc20Abi,
    publicClient,
});

const batch = await client.readBatch([
    { address: tokenA, functionName: "balanceOf", args: [account] },
    { address: tokenB, functionName: "balanceOf", args: [account] },
]);
```

## Usage

### Multichain client

A typed collection of `PublicClient`s keyed by chain ID. Chain IDs are captured at the type level, so invalid references are compile-time errors.

```ts
import { createMultichainClient } from "@0xtan0/chain-utils/core";
import { createPublicClient, http } from "viem";
import { arbitrum, mainnet, optimism } from "viem/chains";

const multichain = createMultichainClient([
    createPublicClient({ chain: mainnet, transport: http() }),
    createPublicClient({ chain: optimism, transport: http() }),
    createPublicClient({ chain: arbitrum, transport: http() }),
]);

multichain.chainIds; // [1, 10, 42161]
multichain.getPublicClient(1); // PublicClient for mainnet
multichain.hasChain(137); // false
```

You can also create from transport configs:

```ts
const multichain = createMultichainClient([
    { chain: mainnet, transport: http() },
    { chain: optimism, transport: http() },
]);
```

Immutably add chains after creation:

```ts
const expanded = multichain.withChain(polygonClient);
```

### Contract client

Type-safe wrapper around viem's contract interactions. Supports reads, batched multicall, and the full write pipeline.

```ts
import { createContractClient } from "@0xtan0/chain-utils/core";

const client = createContractClient({
    abi: myAbi,
    publicClient,
    walletClient, // optional, required for writes
});
```

**Read a single function:**

```ts
const value = await client.read(contractAddress, "balanceOf", [account]);
```

**Batch reads via multicall:**

```ts
const batch = await client.readBatch([
    { address: tokenA, functionName: "balanceOf", args: [account] },
    { address: tokenB, functionName: "balanceOf", args: [account] },
]);
// batch.results[0].status === "success" | "failure"
```

**One-shot write (simulate + sign + send + optional wait):**

```ts
const receipt = await client.execute(address, "transfer", [to, amount], {
    waitForReceipt: true,
});
```

**Granular write pipeline:**

```ts
const prepared = await client.prepare(address, "transfer", [to, amount]);
const signed = await client.sign(prepared);
const hash = await client.send(signed);
const receipt = await client.waitForReceipt(hash);
```

### Error decoding

Attach a custom `ErrorDecoder` to translate raw revert data into typed errors.

```ts
const client = createContractClient({
    abi: myAbi,
    publicClient,
    errorDecoder: myDecoder,
});
```

Built-in error classes: `ChainUtilsFault`, `UnsupportedChain`, `RpcFailure`, `ContractReverted`, `MulticallPartialFailure`, `MulticallBatchFailure`.

## API Summary

| Export                     | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `createMultichainClient`   | Build a typed multichain RPC collection                  |
| `MultichainClient`         | Class backing the multichain collection                  |
| `createContractClient`     | Build a type-safe contract client                        |
| `ContractClient`           | Class with read, readBatch, prepare, sign, send, execute |
| `createMultichainContract` | Contract client across multiple chains                   |
| `CompositeErrorDecoder`    | Combine multiple error decoders                          |

## License

MIT
