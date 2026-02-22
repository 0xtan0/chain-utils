import type { Address, Hex } from "viem";
import { ContractReverted } from "@0xtan0/chain-utils/core";

/**
 * Error thrown when an owner parameter is invalid.
 */
export class InvalidOwner extends ContractReverted {
    override readonly name = "InvalidOwner";
    readonly owner: Address;

    /**
     * @param {Address} owner Invalid owner address.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InvalidOwner} Structured invalid-owner revert.
     */
    constructor(owner: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: invalid owner ${owner}`,
        });
        this.owner = owner;
    }
}

/**
 * Error thrown when a token ID does not exist.
 */
export class NonexistentToken extends ContractReverted {
    override readonly name = "NonexistentToken";
    readonly tokenId: bigint;

    /**
     * @param {bigint} tokenId Missing token ID.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {NonexistentToken} Structured nonexistent-token revert.
     */
    constructor(tokenId: bigint, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: nonexistent token ${tokenId}`,
        });
        this.tokenId = tokenId;
    }
}

/**
 * Error thrown when transfer sender is not the token owner.
 */
export class IncorrectOwner extends ContractReverted {
    override readonly name = "IncorrectOwner";
    readonly sender: Address;
    readonly tokenId: bigint;
    readonly owner: Address;

    /**
     * @param {Address} sender Sender address.
     * @param {bigint} tokenId Token ID.
     * @param {Address} owner Actual token owner.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {IncorrectOwner} Structured incorrect-owner revert.
     */
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

/**
 * Error thrown when sender address is invalid.
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
            decodedMessage: `ERC721: invalid sender ${sender}`,
        });
        this.sender = sender;
    }
}

/**
 * Error thrown when receiver address is invalid.
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
            decodedMessage: `ERC721: invalid receiver ${receiver}`,
        });
        this.receiver = receiver;
    }
}

/**
 * Error thrown when operator lacks approval for a token.
 */
export class InsufficientApproval extends ContractReverted {
    override readonly name = "InsufficientApproval";
    readonly operator: Address;
    readonly tokenId: bigint;

    /**
     * @param {Address} operator Operator address.
     * @param {bigint} tokenId Token ID.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InsufficientApproval} Structured insufficient-approval revert.
     */
    constructor(operator: Address, tokenId: bigint, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: insufficient approval for token ${tokenId} (operator ${operator})`,
        });
        this.operator = operator;
        this.tokenId = tokenId;
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
            decodedMessage: `ERC721: invalid approver ${approver}`,
        });
        this.approver = approver;
    }
}

/**
 * Error thrown when operator address is invalid.
 */
export class InvalidOperator extends ContractReverted {
    override readonly name = "InvalidOperator";
    readonly operator: Address;

    /**
     * @param {Address} operator Invalid operator address.
     * @param {{ rawData?: Hex }} [options] Optional raw revert payload.
     * @returns {InvalidOperator} Structured invalid-operator revert.
     */
    constructor(operator: Address, options?: { rawData?: Hex }) {
        super({
            rawData: options?.rawData,
            decodedMessage: `ERC721: invalid operator ${operator}`,
        });
        this.operator = operator;
    }
}
