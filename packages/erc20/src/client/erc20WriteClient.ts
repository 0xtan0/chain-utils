import type {
    PreparedTransaction,
    SignedTransaction,
    WriteOptions,
} from "@0xtan0/chain-utils/core";
import type { Address, Hash, TransactionReceipt } from "viem";

import type { ERC20WriteClient } from "../types/client.js";
import type { ERC20WriteClientOptions } from "../types/options.js";
import { validateAddress } from "../helpers/validateAddress.js";
import { ERC20ReadClient } from "./erc20ReadClient.js";

export class ERC20WriteClientImpl extends ERC20ReadClient implements ERC20WriteClient {
    constructor(options: ERC20WriteClientOptions) {
        super(options);
    }

    async prepareApprove(
        token: Address,
        spender: Address,
        amount: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(token);
        validateAddress(spender);
        return this.contract.prepare(token, "approve", [spender, amount]);
    }

    async prepareTransfer(
        token: Address,
        to: Address,
        amount: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(token);
        validateAddress(to);
        return this.contract.prepare(token, "transfer", [to, amount]);
    }

    async prepareTransferFrom(
        token: Address,
        from: Address,
        to: Address,
        amount: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(token);
        validateAddress(from);
        validateAddress(to);
        return this.contract.prepare(token, "transferFrom", [from, to, amount]);
    }

    async signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction> {
        return this.contract.sign(prepared);
    }

    async sendTransaction(signed: SignedTransaction): Promise<Hash> {
        return this.contract.send(signed);
    }

    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.contract.waitForReceipt(hash);
    }

    async approve(
        token: Address,
        spender: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        validateAddress(token);
        validateAddress(spender);
        return this.contract.execute(token, "approve", [spender, amount], options);
    }

    async transfer(
        token: Address,
        to: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        validateAddress(token);
        validateAddress(to);
        return this.contract.execute(token, "transfer", [to, amount], options);
    }

    async transferFrom(
        token: Address,
        from: Address,
        to: Address,
        amount: bigint,
        options?: WriteOptions,
    ): Promise<Hash | TransactionReceipt> {
        validateAddress(token);
        validateAddress(from);
        validateAddress(to);
        return this.contract.execute(token, "transferFrom", [from, to, amount], options);
    }
}

export function createERC20WriteClient(options: ERC20WriteClientOptions): ERC20WriteClient {
    return new ERC20WriteClientImpl(options);
}
