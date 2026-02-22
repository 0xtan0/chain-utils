import type { Address, Hex } from "viem";
import { ContractReverted } from "@0xtan0/chain-utils/core";

/**
 * Error thrown when transfer amount exceeds sender balance.
 */
export class InsufficientBalance extends ContractReverted {
    override readonly name = "InsufficientBalance";
    readonly sender: Address;
    readonly balance: bigint;
    readonly needed: bigint;

    /**
     * @param {Address} sender Sender address.
     * @param {bigint} balance Sender available balance.
     * @param {bigint} needed Required balance.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InsufficientBalance} Structured insufficient-balance revert.
     */
    constructor(sender: Address, balance: bigint, needed: bigint, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: sender ${sender} balance ${balance} is less than needed ${needed}`,
        });
        this.sender = sender;
        this.balance = balance;
        this.needed = needed;
    }
}

/**
 * Error thrown when requested transfer exceeds allowance.
 */
export class InsufficientAllowance extends ContractReverted {
    override readonly name = "InsufficientAllowance";
    readonly spender: Address;
    readonly allowance: bigint;
    readonly needed: bigint;

    /**
     * @param {Address} spender Spender address.
     * @param {bigint} allowance Current allowance.
     * @param {bigint} needed Required allowance.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InsufficientAllowance} Structured insufficient-allowance revert.
     */
    constructor(spender: Address, allowance: bigint, needed: bigint, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: spender ${spender} allowance ${allowance} is less than needed ${needed}`,
        });
        this.spender = spender;
        this.allowance = allowance;
        this.needed = needed;
    }
}

/**
 * Error thrown when token sender is invalid.
 */
export class InvalidSender extends ContractReverted {
    override readonly name = "InvalidSender";
    readonly sender: Address;

    /**
     * @param {Address} sender Invalid sender address.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InvalidSender} Structured invalid-sender revert.
     */
    constructor(sender: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid sender ${sender}`,
        });
        this.sender = sender;
    }
}

/**
 * Error thrown when token receiver is invalid.
 */
export class InvalidReceiver extends ContractReverted {
    override readonly name = "InvalidReceiver";
    readonly receiver: Address;

    /**
     * @param {Address} receiver Invalid receiver address.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InvalidReceiver} Structured invalid-receiver revert.
     */
    constructor(receiver: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid receiver ${receiver}`,
        });
        this.receiver = receiver;
    }
}

/**
 * Error thrown when approver address is invalid.
 */
export class InvalidApprover extends ContractReverted {
    override readonly name = "InvalidApprover";
    readonly approver: Address;

    /**
     * @param {Address} approver Invalid approver address.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InvalidApprover} Structured invalid-approver revert.
     */
    constructor(approver: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid approver ${approver}`,
        });
        this.approver = approver;
    }
}

/**
 * Error thrown when spender address is invalid.
 */
export class InvalidSpender extends ContractReverted {
    override readonly name = "InvalidSpender";
    readonly spender: Address;

    /**
     * @param {Address} spender Invalid spender address.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InvalidSpender} Structured invalid-spender revert.
     */
    constructor(spender: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid spender ${spender}`,
        });
        this.spender = spender;
    }
}
