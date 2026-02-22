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

/**
 * Single-chain ERC20 write client.
 *
 * Extends `ERC20ReadClient` with prepare/sign/send helpers and
 * convenience write methods for `approve`, `transfer`, and `transferFrom`.
 *
 * @example
 * ```ts
 * const write = createERC20WriteClient({ client: publicClient, walletClient });
 * const hash = await write.transfer(token, recipient, 10n);
 * ```
 */
export class ERC20WriteClientImpl extends ERC20ReadClient implements ERC20WriteClient {
    /**
     * @param {ERC20WriteClientOptions} options Write client options including wallet client.
     * @returns {ERC20WriteClientImpl} A chain-bound ERC20 write client.
     */
    constructor(options: ERC20WriteClientOptions) {
        super(options);
    }

    /**
     * Prepares an ERC20 `approve` transaction.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} spender Spender address.
     * @param {bigint} amount Allowance amount in base units.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `token` or `spender` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation or RPC failures.
     */
    async prepareApprove(
        token: Address,
        spender: Address,
        amount: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(token);
        validateAddress(spender);
        return this.contract.prepare(token, "approve", [spender, amount]);
    }

    /**
     * Prepares an ERC20 `transfer` transaction.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when `token` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation or RPC failures.
     */
    async prepareTransfer(
        token: Address,
        to: Address,
        amount: bigint,
    ): Promise<PreparedTransaction> {
        validateAddress(token);
        validateAddress(to);
        return this.contract.prepare(token, "transfer", [to, amount]);
    }

    /**
     * Prepares an ERC20 `transferFrom` transaction.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} from Owner address tokens are transferred from.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @returns {Promise<PreparedTransaction>} Prepared transaction payload.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for decoded revert errors and write precondition faults.
     * @throws {Error} Propagates simulation or RPC failures.
     */
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

    /**
     * Signs a prepared ERC20 transaction.
     *
     * @param {PreparedTransaction} prepared Prepared payload from a `prepare*` method.
     * @returns {Promise<SignedTransaction>} Signed transaction bytes with chain metadata.
     * @throws {ChainUtilsFault} Thrown for chain mismatches or missing wallet/account.
     * @throws {Error} Propagates signer failures.
     */
    async signTransaction(prepared: PreparedTransaction): Promise<SignedTransaction> {
        return this.contract.sign(prepared);
    }

    /**
     * Broadcasts a signed transaction.
     *
     * @param {SignedTransaction} signed Signed transaction payload.
     * @returns {Promise<Hash>} Transaction hash.
     * @throws {ChainUtilsFault} Thrown when signed payload chain ID mismatches the client chain.
     * @throws {Error} Propagates broadcast failures.
     */
    async sendTransaction(signed: SignedTransaction): Promise<Hash> {
        return this.contract.send(signed);
    }

    /**
     * Waits for transaction inclusion.
     *
     * @param {Hash} hash Transaction hash.
     * @returns {Promise<TransactionReceipt>} Final transaction receipt.
     * @throws {Error} Propagates receipt polling failures.
     */
    async waitForReceipt(hash: Hash): Promise<TransactionReceipt> {
        return this.contract.waitForReceipt(hash);
    }

    /**
     * Executes ERC20 `approve` end-to-end.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} spender Spender address.
     * @param {bigint} amount Allowance amount in base units.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `token` or `spender` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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

    /**
     * Executes ERC20 `transfer` end-to-end.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when `token` or `to` is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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

    /**
     * Executes ERC20 `transferFrom` end-to-end.
     *
     * @param {Address} token ERC20 token address.
     * @param {Address} from Owner address tokens are transferred from.
     * @param {Address} to Recipient address.
     * @param {bigint} amount Transfer amount in base units.
     * @param {WriteOptions} [options] Optional execution behavior (`waitForReceipt`).
     * @returns {Promise<Hash | TransactionReceipt>} Transaction hash or mined receipt.
     * @throws {InvalidAddress} Thrown when any input address is invalid.
     * @throws {ChainUtilsFault} Thrown for chain validation, decoded revert, and wallet precondition errors.
     * @throws {Error} Propagates signer, RPC, and polling failures.
     */
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

/**
 * Factory helper for creating an ERC20 write client.
 *
 * @param {ERC20WriteClientOptions} options Write client options.
 * @returns {ERC20WriteClient} ERC20 write client interface implementation.
 */
export function createERC20WriteClient(options: ERC20WriteClientOptions): ERC20WriteClient {
    return new ERC20WriteClientImpl(options);
}
