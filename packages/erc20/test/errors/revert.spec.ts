import type { Address, Hex } from "viem";
import {
    InsufficientAllowance,
    InsufficientBalance,
    InvalidApprover,
    InvalidReceiver,
    InvalidSender,
    InvalidSpender,
} from "@/errors/revert.js";
import { ChainUtilsFault, ContractReverted } from "@0xtan0/chain-utils-core";
import { describe, expect, it } from "vitest";

const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;
const rawData = "0xdead" as Hex;

describe("InsufficientBalance", () => {
    it("extends ContractReverted and ChainUtilsFault", () => {
        const error = new InsufficientBalance(address, 100n, 200n);
        expect(error).toBeInstanceOf(ContractReverted);
        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("has correct name and fields", () => {
        const error = new InsufficientBalance(address, 100n, 200n, { rawData });
        expect(error.name).toBe("InsufficientBalance");
        expect(error.sender).toBe(address);
        expect(error.balance).toBe(100n);
        expect(error.needed).toBe(200n);
        expect(error.rawData).toBe(rawData);
    });
});

describe("InsufficientAllowance", () => {
    it("extends ContractReverted and ChainUtilsFault", () => {
        const error = new InsufficientAllowance(address, 50n, 100n);
        expect(error).toBeInstanceOf(ContractReverted);
        expect(error).toBeInstanceOf(ChainUtilsFault);
    });

    it("has correct name and fields", () => {
        const error = new InsufficientAllowance(address, 50n, 100n, { rawData });
        expect(error.name).toBe("InsufficientAllowance");
        expect(error.spender).toBe(address);
        expect(error.allowance).toBe(50n);
        expect(error.needed).toBe(100n);
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

describe("InvalidSpender", () => {
    it("extends ContractReverted", () => {
        const error = new InvalidSpender(address);
        expect(error).toBeInstanceOf(ContractReverted);
    });

    it("has correct name and field", () => {
        const error = new InvalidSpender(address, { rawData });
        expect(error.name).toBe("InvalidSpender");
        expect(error.spender).toBe(address);
        expect(error.rawData).toBe(rawData);
    });
});
