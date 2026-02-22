import type { Address, Hex } from "viem";
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
import { ChainUtilsFault, ContractReverted } from "@0xtan0/chain-utils-core";
import { describe, expect, it } from "vitest";

const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;
const otherAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address;
const rawData = "0xdead" as Hex;
const tokenId = 42n;

describe("InvalidOwner", () => {
    it("extends ContractReverted and ChainUtilsFault", () => {
        const error = new InvalidOwner(address);
        expect(error).toBeInstanceOf(ContractReverted);
        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("has correct name and fields", () => {
        const error = new InvalidOwner(address, { rawData });
        expect(error.name).toBe("InvalidOwner");
        expect(error.owner).toBe(address);
        expect(error.rawData).toBe(rawData);
    });
});

describe("NonexistentToken", () => {
    it("extends ContractReverted", () => {
        const error = new NonexistentToken(tokenId);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and fields", () => {
        const error = new NonexistentToken(tokenId, { rawData });
        expect(error.name).toBe("NonexistentToken");
        expect(error.tokenId).toBe(tokenId);
        expect(error.rawData).toBe(rawData);
    });
});

describe("IncorrectOwner", () => {
    it("extends ContractReverted", () => {
        const error = new IncorrectOwner(address, tokenId, otherAddress);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and fields", () => {
        const error = new IncorrectOwner(address, tokenId, otherAddress, { rawData });
        expect(error.name).toBe("IncorrectOwner");
        expect(error.sender).toBe(address);
        expect(error.tokenId).toBe(tokenId);
        expect(error.owner).toBe(otherAddress);
        expect(error.rawData).toBe(rawData);
    });
});

describe("InvalidSender", () => {
    it("extends ContractReverted", () => {
        const error = new InvalidSender(address);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and field", () => {
        const error = new InvalidSender(address, { rawData });
        expect(error.name).toBe("InvalidSender");
        expect(error.sender).toBe(address);
        expect(error.rawData).toBe(rawData);
    });
});

describe("InvalidReceiver", () => {
    it("extends ContractReverted", () => {
        const error = new InvalidReceiver(address);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and field", () => {
        const error = new InvalidReceiver(address, { rawData });
        expect(error.name).toBe("InvalidReceiver");
        expect(error.receiver).toBe(address);
        expect(error.rawData).toBe(rawData);
    });
});

describe("InsufficientApproval", () => {
    it("extends ContractReverted", () => {
        const error = new InsufficientApproval(address, tokenId);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and fields", () => {
        const error = new InsufficientApproval(address, tokenId, { rawData });
        expect(error.name).toBe("InsufficientApproval");
        expect(error.operator).toBe(address);
        expect(error.tokenId).toBe(tokenId);
        expect(error.rawData).toBe(rawData);
    });
});

describe("InvalidApprover", () => {
    it("extends ContractReverted", () => {
        const error = new InvalidApprover(address);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and field", () => {
        const error = new InvalidApprover(address, { rawData });
        expect(error.name).toBe("InvalidApprover");
        expect(error.approver).toBe(address);
        expect(error.rawData).toBe(rawData);
    });
});

describe("InvalidOperator", () => {
    it("extends ContractReverted", () => {
        const error = new InvalidOperator(address);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and field", () => {
        const error = new InvalidOperator(address, { rawData });
        expect(error.name).toBe("InvalidOperator");
        expect(error.operator).toBe(address);
        expect(error.rawData).toBe(rawData);
    });
});
