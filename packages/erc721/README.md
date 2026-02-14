# @0xtan0/chain-utils/erc721

Type-safe ERC-721 utilities for [viem](https://viem.sh/) that turn NFT reads/writes into small, predictable primitives.

If your codebase currently spreads raw `readContract`/`writeContract` calls across services, this package gives you one typed client with:

-   consistent NFT domain objects (collection, owner, token URI, approvals)
-   multicall batch reads with partial-failure reporting
-   one-shot write methods plus full prepare/sign/send control
-   decoded ERC-721 revert errors instead of opaque hex reverts

Built on top of `@0xtan0/chain-utils/core`.

## Install

```bash
pnpm add @0xtan0/chain-utils/erc721 viem
```

## What Problem It Solves

Production NFT apps usually hit the same issues:

-   duplicated ABI call logic in every service or route
-   brittle ad-hoc batching with unclear failure handling
-   weak typing between read models and write flows
-   hard-to-debug revert data when transfers/approvals fail

`@0xtan0/chain-utils/erc721` centralizes those concerns so your app code focuses on product logic (who owns what, who can transfer, what to display) rather than low-level RPC wiring.

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

## API Summary

| Export                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `createERC721Client`      | Single-chain read client (owner, balances, approvals, metadata)   |
| `createERC721WriteClient` | Single-chain write client (approve, setApprovalForAll, transfers) |
| `ERC721ReadClient`        | Class implementation behind the read factory                      |
| `ERC721WriteClient`       | Class implementation behind the write factory                     |
| `ERC721ErrorDecoder`      | Decodes ERC-721 custom errors and legacy string reverts           |

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
