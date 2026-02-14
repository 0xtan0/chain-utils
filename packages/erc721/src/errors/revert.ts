import type { Address, Hex } from "viem";
import { ContractReverted } from "@0xtan0/chain-utils/core";

export class InvalidOwner extends ContractReverted {
    override readonly name = "InvalidOwner";
    readonly owner: Address;

    constructor(owner: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: invalid owner ${owner}`,
        });
        this.owner = owner;
    }
}

export class NonexistentToken extends ContractReverted {
    override readonly name = "NonexistentToken";
    readonly tokenId: bigint;

    constructor(tokenId: bigint, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: nonexistent token ${tokenId}`,
        });
        this.tokenId = tokenId;
    }
}

export class IncorrectOwner extends ContractReverted {
    override readonly name = "IncorrectOwner";
    readonly sender: Address;
    readonly tokenId: bigint;
    readonly owner: Address;

    constructor(sender: Address, tokenId: bigint, owner: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: incorrect owner for token ${tokenId} (sender ${sender}, owner ${owner})`,
        });
        this.sender = sender;
        this.tokenId = tokenId;
        this.owner = owner;
    }
}

export class InvalidSender extends ContractReverted {
    override readonly name = "InvalidSender";
    readonly sender: Address;

    constructor(sender: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: invalid sender ${sender}`,
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
            decodedMessage: `ERC721: invalid receiver ${receiver}`,
        });
        this.receiver = receiver;
    }
}

export class InsufficientApproval extends ContractReverted {
    override readonly name = "InsufficientApproval";
    readonly operator: Address;
    readonly tokenId: bigint;

    constructor(operator: Address, tokenId: bigint, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: insufficient approval for token ${tokenId} (operator ${operator})`,
        });
        this.operator = operator;
        this.tokenId = tokenId;
    }
}

export class InvalidApprover extends ContractReverted {
    override readonly name = "InvalidApprover";
    readonly approver: Address;

    constructor(approver: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: invalid approver ${approver}`,
        });
        this.approver = approver;
    }
}

export class InvalidOperator extends ContractReverted {
    override readonly name = "InvalidOperator";
    readonly operator: Address;

    constructor(operator: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: invalid operator ${operator}`,
        });
        this.operator = operator;
    }
}
