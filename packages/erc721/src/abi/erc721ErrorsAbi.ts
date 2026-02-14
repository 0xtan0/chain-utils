/**
 * OpenZeppelin v5 ERC721 custom error ABI fragments.
 * Used by ERC721ErrorDecoder to decode on-chain reverts.
 */
export const erc721ErrorsAbi = [
    {
        type: "error",
        name: "ERC721InvalidOwner",
        inputs: [{ name: "owner", type: "address" }],
    },
    {
        type: "error",
        name: "ERC721NonexistentToken",
        inputs: [{ name: "tokenId", type: "uint256" }],
    },
    {
        type: "error",
        name: "ERC721IncorrectOwner",
        inputs: [
            { name: "sender", type: "address" },
            { name: "tokenId", type: "uint256" },
            { name: "owner", type: "address" },
        ],
    },
    {
        type: "error",
        name: "ERC721InvalidSender",
        inputs: [{ name: "sender", type: "address" }],
    },
    {
        type: "error",
        name: "ERC721InvalidReceiver",
        inputs: [{ name: "receiver", type: "address" }],
    },
    {
        type: "error",
        name: "ERC721InsufficientApproval",
        inputs: [
            { name: "operator", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
    },
    {
        type: "error",
        name: "ERC721InvalidApprover",
        inputs: [{ name: "approver", type: "address" }],
    },
    {
        type: "error",
        name: "ERC721InvalidOperator",
        inputs: [{ name: "operator", type: "address" }],
    },
] as const;

export type ERC721ErrorsAbi = typeof erc721ErrorsAbi;
