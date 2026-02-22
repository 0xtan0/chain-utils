import type { Hex } from "viem";
import { erc721ErrorsAbi } from "@/abi/erc721ErrorsAbi.js";
import { ERC721ErrorDecoder } from "@/decoder/erc721ErrorDecoder.js";
import {
    IncorrectOwner,
    InsufficientApproval,
    InvalidApprover,
    InvalidOperator,
    InvalidOwner,
    InvalidReceiver,
    InvalidSender,
    NonexistentToken,
} from "@/errors/revert.js";
import { ContractReverted } from "@0xtan0/chain-utils-core";
import { encodeAbiParameters, encodeErrorResult, getAddress } from "viem";
import { describe, expect, it } from "vitest";

const owner = getAddress("0x1234567890abcdef1234567890abcdef12345678");
const sender = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const operator = getAddress("0x1111111111111111111111111111111111111111");
const receiver = getAddress("0x2222222222222222222222222222222222222222");
const tokenId = 42n;

function encodeLegacyRevert(message: string): Hex {
    // Error(string) selector: 0x08c379a0
    const encoded = encodeAbiParameters([{ type: "string" }], [message]);
    return `0x08c379a0${encoded.slice(2)}` as Hex;
}

describe("ERC721ErrorDecoder", () => {
    const decoder = new ERC721ErrorDecoder();

    describe("standard OZ v5 errors", () => {
        it("decodes ERC721InvalidOwner", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721InvalidOwner",
                args: [owner],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidOwner);
            const err = result as InvalidOwner;
            expect(err.owner).toBe(owner);
            expect(err.rawData).toBe(rawData);
        });

        it("decodes ERC721NonexistentToken", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721NonexistentToken",
                args: [tokenId],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(NonexistentToken);
            expect((result as NonexistentToken).tokenId).toBe(tokenId);
        });

        it("decodes ERC721IncorrectOwner", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721IncorrectOwner",
                args: [sender, tokenId, owner],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(IncorrectOwner);
            const err = result as IncorrectOwner;
            expect(err.sender).toBe(sender);
            expect(err.tokenId).toBe(tokenId);
            expect(err.owner).toBe(owner);
        });

        it("decodes ERC721InvalidSender", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721InvalidSender",
                args: [sender],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidSender);
            expect((result as InvalidSender).sender).toBe(sender);
        });

        it("decodes ERC721InvalidReceiver", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721InvalidReceiver",
                args: [receiver],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidReceiver);
            expect((result as InvalidReceiver).receiver).toBe(receiver);
        });

        it("decodes ERC721InsufficientApproval", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721InsufficientApproval",
                args: [operator, tokenId],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InsufficientApproval);
            const err = result as InsufficientApproval;
            expect(err.operator).toBe(operator);
            expect(err.tokenId).toBe(tokenId);
        });

        it("decodes ERC721InvalidApprover", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721InvalidApprover",
                args: [owner],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidApprover);
            expect((result as InvalidApprover).approver).toBe(owner);
        });

        it("decodes ERC721InvalidOperator", () => {
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721InvalidOperator",
                args: [operator],
            });
            const result = decoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidOperator);
            expect((result as InvalidOperator).operator).toBe(operator);
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
        const decoderWithCustom = new ERC721ErrorDecoder(customAbi);

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

        it("standard errors take priority over custom ABI", () => {
            const overlappingAbi = [
                {
                    type: "error" as const,
                    name: "ERC721InvalidOwner",
                    inputs: [{ name: "owner", type: "address" as const }],
                },
            ];
            const overlappingDecoder = new ERC721ErrorDecoder(overlappingAbi);
            const rawData = encodeErrorResult({
                abi: erc721ErrorsAbi,
                errorName: "ERC721InvalidOwner",
                args: [owner],
            });
            const result = overlappingDecoder.decode(rawData);
            expect(result).toBeInstanceOf(InvalidOwner);
        });

        it("formats complex custom error args with nested tuples and arrays", () => {
            const complexCustomAbi = [
                {
                    type: "error" as const,
                    name: "ComplexFailure",
                    inputs: [
                        { name: "account", type: "address" as const },
                        { name: "tokenIds", type: "uint256[]" as const },
                        {
                            name: "details",
                            type: "tuple" as const,
                            components: [
                                { name: "id", type: "uint256" as const },
                                { name: "approved", type: "bool" as const },
                                { name: "reason", type: "string" as const },
                            ],
                        },
                        {
                            name: "history",
                            type: "tuple[]" as const,
                            components: [
                                { name: "operator", type: "address" as const },
                                { name: "ok", type: "bool" as const },
                            ],
                        },
                    ],
                },
            ];
            const complexDecoder = new ERC721ErrorDecoder(complexCustomAbi);
            const rawData = encodeErrorResult({
                abi: complexCustomAbi,
                errorName: "ComplexFailure",
                args: [
                    owner,
                    [41n, 42n],
                    { id: 42n, approved: false, reason: "blocked" },
                    [{ operator, ok: true }],
                ],
            });

            const result = complexDecoder.decode(rawData);

            expect(result).toBeInstanceOf(ContractReverted);
            const decodedMessage = (result as ContractReverted).decodedMessage;
            expect(decodedMessage).toContain("ComplexFailure (");
            expect(decodedMessage).toContain(`"${owner}"`);
            expect(decodedMessage).toContain("[41n, 42n]");
            expect(decodedMessage).toContain('{ approved: false, id: 42n, reason: "blocked" }');
            expect(decodedMessage).toContain(`[{ ok: true, operator: "${operator}" }]`);
        });
    });

    describe("legacy string reverts", () => {
        it("decodes string reverts as ContractReverted", () => {
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
