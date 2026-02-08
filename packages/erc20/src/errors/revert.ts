import type { Address, Hex } from "viem";
import { ContractReverted } from "@0xtan0/chain-utils/core";

export class InsufficientBalance extends ContractReverted {
    override readonly name = "InsufficientBalance";
    readonly sender: Address;
    readonly balance: bigint;
    readonly needed: bigint;

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

export class InsufficientAllowance extends ContractReverted {
    override readonly name = "InsufficientAllowance";
    readonly spender: Address;
    readonly allowance: bigint;
    readonly needed: bigint;

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

export class InvalidSender extends ContractReverted {
    override readonly name = "InvalidSender";
    readonly sender: Address;

    constructor(sender: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid sender ${sender}`,
        });
        this.sender = sender;
    }
}

export class InvalidReceiver extends ContractReverted {
    override readonly name = "InvalidReceiver";
    readonly receiver: Address;

    constructor(receiver: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid receiver ${receiver}`,
        });
        this.receiver = receiver;
    }
}

export class InvalidApprover extends ContractReverted {
    override readonly name = "InvalidApprover";
    readonly approver: Address;

    constructor(approver: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid approver ${approver}`,
        });
        this.approver = approver;
    }
}

export class InvalidSpender extends ContractReverted {
    override readonly name = "InvalidSpender";
    readonly spender: Address;

    constructor(spender: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC20: invalid spender ${spender}`,
        });
        this.spender = spender;
    }
}
