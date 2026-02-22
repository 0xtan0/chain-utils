import type { Hex } from "viem";
import { erc20ErrorsAbi } from "@/abi/erc20ErrorsAbi.js";
import { ERC20ErrorDecoder } from "@/decoder/erc20ErrorDecoder.js";
import {
    InsufficientAllowance,
    InsufficientBalance,
    InvalidApprover,
    InvalidReceiver,
    InvalidSender,
    InvalidSpender,
} from "@/errors/revert.js";
import { ContractReverted } from "@0xtan0/chain-utils-core";
import { encodeAbiParameters, encodeErrorResult, getAddress } from "viem";
import { describe, expect, it } from "vitest";

const address = getAddress("0x1234567890abcdef1234567890abcdef12345678");

function encodeLegacyRevert(message: string): Hex {
    // Error(string) selector: 0x08c379a0
    const encoded = encodeAbiParameters([{ type: "string" }], [message]);
    return `0x08c379a0${encoded.slice(2)}` as Hex;
}

describe("ERC20ErrorDecoder", () => {
    const decoder = new ERC20ErrorDecoder();

    describe("standard OZ v5 errors", () => {
        it("decodes ERC20InsufficientBalance", () => {
            const rawData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InsufficientBalance",
                args: [address, 100n, 200n],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InsufficientBalance);
            const err = result as InsufficientBalance;
            expect(err.sender).toBe(address);
            expect(err.balance).toBe(100n);
            expect(err.needed).toBe(200n);
            expect(err.rawData).toBe(rawData);
        });

        it("decodes ERC20InsufficientAllowance", () => {
            const rawData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InsufficientAllowance",
                args: [address, 50n, 100n],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InsufficientAllowance);
            const err = result as InsufficientAllowance;
            expect(err.spender).toBe(address);
            expect(err.allowance).toBe(50n);
            expect(err.needed).toBe(100n);
        });

        it("decodes ERC20InvalidSender", () => {
            const rawData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InvalidSender",
                args: [address],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidSender);
            expect((result as InvalidSender).sender).toBe(address);
        });

        it("decodes ERC20InvalidReceiver", () => {
            const rawData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InvalidReceiver",
                args: [address],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidReceiver);
            expect((result as InvalidReceiver).receiver).toBe(address);
        });

        it("decodes ERC20InvalidApprover", () => {
            const rawData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InvalidApprover",
                args: [address],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidApprover);
            expect((result as InvalidApprover).approver).toBe(address);
        });

        it("decodes ERC20InvalidSpender", () => {
            const rawData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InvalidSpender",
                args: [address],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidSpender);
            expect((result as InvalidSpender).spender).toBe(address);
        });
    });

    describe("custom error ABI", () => {
        const customAbi = [
            {
                type: "error" as const,
                name: "MyCustomPaused",
                inputs: [{ name: "reason", type: "string" as const }],
            },
        ];
        const decoderWithCustom = new ERC20ErrorDecoder(customAbi);

        it("decodes custom errors as ContractReverted", () => {
            const rawData = encodeErrorResult({
                abi: customAbi,
                errorName: "MyCustomPaused",
                args: ["maintenance"],
            });
            const result = decoderWithCustom.decode(rawData);
            expect(result).toBeInstanceOf(ContractReverted);
            expect((result as ContractReverted).decodedMessage).toContain("MyCustomPaused");
            expect((result as ContractReverted).decodedMessage).toContain("maintenance");
        });

        it("standard errors take priority over custom", () => {
            const rawData = encodeErrorResult({
                abi: erc20ErrorsAbi,
                errorName: "ERC20InsufficientBalance",
                args: [address, 100n, 200n],
            });
            const result = decoderWithCustom.decode(rawData);
            expect(result).toBeInstanceOf(InsufficientBalance);
        });

        it("formats complex custom error args with nested tuples and arrays", () => {
            const complexCustomAbi = [
                {
                    type: "error" as const,
                    name: "ComplexFailure",
                    inputs: [
                        { name: "account", type: "address" as const },
                        { name: "amounts", type: "uint256[]" as const },
                        {
                            name: "details",
                            type: "tuple" as const,
                            components: [
                                { name: "id", type: "uint256" as const },
                                { name: "active", type: "bool" as const },
                                { name: "note", type: "string" as const },
                            ],
                        },
                        {
                            name: "history",
                            type: "tuple[]" as const,
                            components: [
                                { name: "amount", type: "uint256" as const },
                                { name: "ok", type: "bool" as const },
                            ],
                        },
                    ],
                },
            ];
            const complexDecoder = new ERC20ErrorDecoder(complexCustomAbi);
            const rawData = encodeErrorResult({
                abi: complexCustomAbi,
                errorName: "ComplexFailure",
                args: [
                    address,
                    [1n, 2n],
                    { id: 9n, active: true, note: "nested" },
                    [{ amount: 4n, ok: false }],
                ],
            });

            const result = complexDecoder.decode(rawData);

            expect(result).toBeInstanceOf(ContractReverted);
            const decodedMessage = (result as ContractReverted).decodedMessage;
            expect(decodedMessage).toContain("ComplexFailure (");
            expect(decodedMessage).toContain(`"${address}"`);
            expect(decodedMessage).toContain("[1n, 2n]");
            expect(decodedMessage).toContain('{ active: true, id: 9n, note: "nested" }');
            expect(decodedMessage).toContain("[{ amount: 4n, ok: false }]");
        });
    });

    describe("legacy string reverts", () => {
        it("decodes 'ERC20: transfer amount exceeds balance' as InsufficientBalance", () => {
            const rawData = encodeLegacyRevert("ERC20: transfer amount exceeds balance");
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InsufficientBalance);
        });

        it("decodes 'ERC20: insufficient allowance' as InsufficientAllowance", () => {
            const rawData = encodeLegacyRevert("ERC20: insufficient allowance");
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InsufficientAllowance);
        });

        it("decodes other string reverts as ContractReverted", () => {
            const rawData = encodeLegacyRevert("some unknown error");
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(ContractReverted);
            expect((result as ContractReverted).decodedMessage).toBe("some unknown error");
        });
    });

    describe("unrecognized data", () => {
        it("returns null for unrecognized data", () => {
            const result = decoder.decode("0xdeadbeef");
            expect(result).toBeNull();
        });

        it("returns null for empty data", () => {
            const result = decoder.decode("0x");
            expect(result).toBeNull();
        });
    });
});
