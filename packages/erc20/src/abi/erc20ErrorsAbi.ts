/**
 * OpenZeppelin v5 ERC20 custom error ABI fragments.
 * Used by ERC20ErrorDecoder to decode on-chain reverts.
 */
export const erc20ErrorsAbi = [
    {
        type: "error",
        name: "ERC20InsufficientBalance",
        inputs: [
            { name: "sender", type: "address" },
            { name: "balance", type: "uint256" },
            { name: "needed", type: "uint256" },
        ],
    },
    {
        type: "error",
        name: "ERC20InsufficientAllowance",
        inputs: [
            { name: "spender", type: "address" },
            { name: "allowance", type: "uint256" },
            { name: "needed", type: "uint256" },
        ],
    },
    {
        type: "error",
        name: "ERC20InvalidSender",
        inputs: [{ name: "sender", type: "address" }],
    },
    {
        type: "error",
        name: "ERC20InvalidReceiver",
        inputs: [{ name: "receiver", type: "address" }],
    },
    {
        type: "error",
        name: "ERC20InvalidApprover",
        inputs: [{ name: "approver", type: "address" }],
    },
    {
        type: "error",
        name: "ERC20InvalidSpender",
        inputs: [{ name: "spender", type: "address" }],
    },
] as const;

/**
 * Type alias for the ERC20 custom error ABI literal.
 */
export type ERC20ErrorsAbi = typeof erc20ErrorsAbi;
