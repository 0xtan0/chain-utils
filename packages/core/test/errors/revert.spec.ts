import { ChainUtilsFault } from "@/errors/base.js";
import { ContractReverted } from "@/errors/revert.js";
import { describe, expect, it } from "vitest";

describe("ContractReverted", () => {
    it("should create with no options", () => {
        const error = new ContractReverted();

        expect(error.name).toBe("ContractReverted");
        expect(error.shortMessage).toBe("Contract reverted");
        expect(error.rawData).toBeUndefined();
        expect(error.decodedMessage).toBeUndefined();
    });

    it("should create with rawData only", () => {
        const error = new ContractReverted({
            rawData: "0xdeadbeef",
        });

        expect(error.rawData).toBe("0xdeadbeef");
        expect(error.decodedMessage).toBeUndefined();
        expect(error.shortMessage).toBe("Contract reverted");
        expect(error.message).toContain("Raw data: 0xdeadbeef");
    });

    it("should create with decodedMessage only", () => {
        const error = new ContractReverted({
            decodedMessage: "ERC20: transfer amount exceeds balance",
        });

        expect(error.decodedMessage).toBe("ERC20: transfer amount exceeds balance");
        expect(error.rawData).toBeUndefined();
        expect(error.shortMessage).toBe("ERC20: transfer amount exceeds balance");
        expect(error.message).toContain("Decoded message: ERC20: transfer amount exceeds balance");
    });

    it("should create with both rawData and decodedMessage", () => {
        const error = new ContractReverted({
            rawData: "0x08c379a0",
            decodedMessage: "Insufficient balance",
        });

        expect(error.rawData).toBe("0x08c379a0");
        expect(error.decodedMessage).toBe("Insufficient balance");
        expect(error.shortMessage).toBe("Insufficient balance");
        expect(error.message).toContain("Raw data: 0x08c379a0");
        expect(error.message).toContain("Decoded message: Insufficient balance");
    });

    it("should create with cause", () => {
        const cause = new Error("rpc error");
        const error = new ContractReverted({ cause });

        expect(error.cause).toBe(cause);
    });

    it("should create with all options", () => {
        const cause = new Error("call reverted");
        const error = new ContractReverted({
            rawData: "0xabcdef",
            decodedMessage: "Not enough tokens",
            cause,
        });

        expect(error.rawData).toBe("0xabcdef");
        expect(error.decodedMessage).toBe("Not enough tokens");
        expect(error.cause).toBe(cause);
        expect(error.shortMessage).toBe("Not enough tokens");
    });

    it("should extend ChainUtilsFault", () => {
        const error = new ContractReverted();

        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("should be walkable from a parent ChainUtilsFault", () => {
        const cause = new ContractReverted({ rawData: "0x01" });
        const parent = new ChainUtilsFault("wrapped", { cause });

        const found = parent.walk((err) => err instanceof ContractReverted);
        expect(found).toBe(cause);
    });
});
