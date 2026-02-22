# @0xtan0/chain-utils/erc721

Type-safe ERC-721 utilities for [viem](https://viem.sh/) for both developers and agents.

This package provides:

-   read and write clients for single-chain ERC-721 interactions
-   typed domain objects (collection metadata, owners, approvals, token URIs)
-   batch reads with multicall-first behavior and per-item failure reporting
-   transaction helpers (`prepare`, `sign`, `send`, `wait`) and one-shot write methods
-   typed decoding for known ERC-721 custom errors

Built on top of `@0xtan0/chain-utils/core`.

## Install

```bash
pnpm add @0xtan0/chain-utils/erc721 viem
```

## Highlights

-   Typed read and write clients remove repetitive `readContract` and `writeContract` wiring.
-   Batch reads are multicall-first by default (with safe fallback behavior), and keep per-item success/failure results.
-   Collection-bound readers/writers eliminate repeated `collection` arguments when working on a single NFT contract.
-   Standard transaction helpers (`prepare`, `sign`, `send`, `wait`) keep write flows consistent.
-   Token ID and batch query shapes are checked by TypeScript.

## TypeScript Safety

```ts
import { createERC721Client } from "@0xtan0/chain-utils/erc721";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });
const reader = createERC721Client({ client: publicClient });
const collection = "0x1234567890abcdef1234567890abcdef12345678";

await reader.getOwnerOf(collection, 42n); // ok

// @ts-expect-error tokenId must be bigint
await reader.getOwnerOf(collection, 42);

await reader.getOwners([{ collection, tokenId: 1n }]); // ok

// @ts-expect-error batch tokenId must be bigint
await reader.getOwners([{ collection, tokenId: "1" }]);

const bound = reader.forCollection(collection);
await bound.getTokenURIs([1n, 2n, 3n]); // ok

// @ts-expect-error token ID lists must be bigint[]
await bound.getTokenURIs([1, 2, 3]);
```

### Example

Manual batch ownership checks usually become repeated one-by-one calls:

```ts
const tokenIds = [1n, 2n, 3n];
const owners = await Promise.all(
    tokenIds.map((tokenId) =>
        publicClient.readContract({
            abi: erc721Abi,
            address: collection,
            functionName: "ownerOf",
            args: [tokenId],
        }),
    ),
);
```

With `erc721`, the same query is a single typed batch call:

```ts
const reader = createERC721Client({ client: publicClient });
const batch = await reader.getOwners(tokenIds.map((tokenId) => ({ collection, tokenId })));

for (const result of batch.results) {
    if (result.status === "success") {
        console.log(result.result);
    }
}
```

## Scope and Behavior

This package is focused on contract interaction primitives, not indexing or marketplace logic.
It is intended for service/backend flows that need deterministic, typed RPC behavior.

-   Multicall is used when available on the chain; otherwise reads fall back to sequential calls.
-   Batch methods preserve order and return partial failures in typed result structures.
-   Enumerable reads are gated by ERC165 support checks.
-   Write helpers enforce wallet-based signing flow through `WalletClient`.

## Example: Ownership + Metadata + Transfer

This is a common backend flow for marketplaces, custodial dashboards, and ops tooling.

```ts
import {
    createERC721Client,
    createERC721WriteClient,
    NonexistentToken,
} from "@0xtan0/chain-utils/erc721";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const chain = mainnet;
const collection = "0x1234567890abcdef1234567890abcdef12345678" as const;
const tokenId = 42n;
const from = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const to = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;

const publicClient = createPublicClient({ chain, transport: http(process.env.RPC_URL) });

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
    chain,
    transport: http(process.env.RPC_URL),
    account,
});

const reader = createERC721Client({ client: publicClient });
const writer = createERC721WriteClient({ client: publicClient, walletClient });

// 1) Read collection and token state
const [metadata, owner, tokenURI] = await Promise.all([
    reader.getCollectionMetadata(collection),
    reader.getOwnerOf(collection, tokenId),
    reader.getTokenURI(collection, tokenId),
]);

console.log(`${metadata.name} (${metadata.symbol})`);
console.log(`Owner: ${owner.owner}`);
console.log(`Token URI: ${tokenURI.tokenURI}`);

// 2) Fast batch check for many token owners in one RPC round
const ownerBatch = await reader.getOwners([
    { collection, tokenId: 1n },
    { collection, tokenId: 2n },
    { collection, tokenId: 3n },
]);

for (const [i, result] of ownerBatch.results.entries()) {
    if (result.status === "success") {
        console.log(`Token ${ownerBatch.queries[i]!.tokenId} owner: ${result.result}`);
    } else {
        console.warn(`Query failed:`, ownerBatch.failures);
    }
}

// 3) Execute transfer with receipt waiting (simulate + sign + send + wait)
try {
    const receipt = await writer.transferFrom(collection, from, to, tokenId, {
        waitForReceipt: true,
    });

    console.log("Transfer mined:", receipt.transactionHash);
} catch (error) {
    if (error instanceof NonexistentToken) {
        console.error("Cannot transfer: token does not exist", error.tokenId);
    }
    throw error;
}
```

## Collection-Bound Reader/Writer

If you work with one collection repeatedly, bind it once and remove the `collection` arg from every call.

```ts
import {
    createERC721Client,
    createERC721CollectionReader,
    createERC721CollectionWriter,
    createERC721WriteClient,
} from "@0xtan0/chain-utils/erc721";

const reader = createERC721Client({ client: publicClient });
const writer = createERC721WriteClient({ client: publicClient, walletClient });

// Bind through existing clients
const coolCatsRead = reader.forCollection(collection);
const coolCatsWrite = writer.forCollection(collection);

await coolCatsRead.getOwnerOf(42n);
await coolCatsRead.getTokenURIs([1n, 2n, 3n]);
await coolCatsWrite.transferFrom(from, to, 42n, { waitForReceipt: true });

// Or construct bound objects directly
const directRead = createERC721CollectionReader({ collection, client: publicClient });
const directWrite = createERC721CollectionWriter({
    collection,
    client: publicClient,
    walletClient,
});
```

## API Summary

| Export                         | Description                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| `createERC721Client`           | Single-chain read client (owner, balances, approvals, metadata)   |
| `createERC721WriteClient`      | Single-chain write client (approve, setApprovalForAll, transfers) |
| `ERC721CollectionReader`       | Bound single-chain collection reader                              |
| `createERC721CollectionReader` | Factory for bound collection reader                               |
| `ERC721CollectionWriter`       | Bound single-chain collection writer (extends reader)             |
| `createERC721CollectionWriter` | Factory for bound collection writer                               |
| `ERC721ReadClient`             | Class implementation behind the read factory                      |
| `ERC721WriteClient`            | Class implementation behind the write factory                     |
| `ERC721ErrorDecoder`           | Decodes ERC-721 custom errors and legacy string reverts           |

## Typed Errors

Common errors are exposed as classes you can catch directly:

-   `InvalidAddress`
-   `NotERC721Contract`
-   `NotERC721Enumerable`
-   `NonexistentToken`
-   `IncorrectOwner`
-   `InsufficientApproval`
-   `InvalidSender` / `InvalidReceiver`
-   `InvalidApprover` / `InvalidOperator`

## License

MIT
