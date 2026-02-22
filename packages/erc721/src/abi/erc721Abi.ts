/**
 * Standard ERC721 ABI as a const assertion for full viem type inference.
 *
 * Includes: supportsInterface (ERC165), balanceOf, ownerOf, getApproved,
 *           isApprovedForAll, name, symbol, tokenURI,
 *           totalSupply, tokenByIndex, tokenOfOwnerByIndex (ERC721Enumerable),
 *           approve, setApprovalForAll, transferFrom,
 *           safeTransferFrom (3-arg and 4-arg overloads),
 *           Transfer, Approval, ApprovalForAll events.
 */
export const erc721Abi = [
    // ---- View functions ----
    {
        type: "function",
        name: "supportsInterface",
        stateMutability: "view",
        inputs: [{ name: "interfaceId", type: "bytes4" }],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "ownerOf",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
    },
    {
        type: "function",
        name: "getApproved",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
    },
    {
        type: "function",
        name: "isApprovedForAll",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "operator", type: "address" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        type: "function",
        name: "name",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
    {
        type: "function",
        name: "symbol",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
    {
        type: "function",
        name: "tokenURI",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
    },
    {
        type: "function",
        name: "totalSupply",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "tokenByIndex",
        stateMutability: "view",
        inputs: [{ name: "index", type: "uint256" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "tokenOfOwnerByIndex",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "index", type: "uint256" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    // ---- State-changing functions ----
    {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
            { name: "to", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "setApprovalForAll",
        stateMutability: "nonpayable",
        inputs: [
            { name: "operator", type: "address" },
            { name: "approved", type: "bool" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "transferFrom",
        stateMutability: "nonpayable",
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "safeTransferFrom",
        stateMutability: "nonpayable",
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "tokenId", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "safeTransferFrom",
        stateMutability: "nonpayable",
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "tokenId", type: "uint256" },
            { name: "data", type: "bytes" },
        ],
        outputs: [],
    },
    // ---- Events ----
    {
        type: "event",
        name: "Transfer",
        inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
        ],
    },
    {
        type: "event",
        name: "Approval",
        inputs: [
            { name: "owner", type: "address", indexed: true },
            { name: "approved", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
        ],
    },
    {
        type: "event",
        name: "ApprovalForAll",
        inputs: [
            { name: "owner", type: "address", indexed: true },
            { name: "operator", type: "address", indexed: true },
            { name: "approved", type: "bool", indexed: false },
        ],
    },
] as const;

/**
 * Type alias for the standard ERC721 ABI literal.
 */
export type ERC721Abi = typeof erc721Abi;
