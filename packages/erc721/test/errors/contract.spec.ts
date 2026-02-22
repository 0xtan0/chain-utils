import type { Address } from "viem";
import { InvalidAddress, NotERC721Contract, NotERC721Enumerable } from "@/errors/contract.js";
import { validateAddress } from "@/helpers/validateAddress.js";
import { ChainUtilsFault } from "@0xtan0/chain-utils-core";
import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

describe("InvalidAddress", () => {
    const address = "not-a-valid-address";

    it("extends ChainUtilsFault", () => {
        const error = new InvalidAddress(address);
        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("has correct name", () => {
        const error = new InvalidAddress(address);
        expect(error.name).toBe("InvalidAddress");
    });

    it("stores the address", () => {
        const error = new InvalidAddress(address);
        expect(error.address).toBe(address);
    });

    it("has a descriptive message", () => {
        const error = new InvalidAddress(address);
        expect(error.message).toContain(address);
    });
});

describe("NotERC721Contract", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;
    const chainId = 1;

    it("extends ChainUtilsFault", () => {
        const error = new NotERC721Contract(address, chainId);
        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("has correct name", () => {
        const error = new NotERC721Contract(address, chainId);
        expect(error.name).toBe("NotERC721Contract");
    });

    it("stores address and chainId", () => {
        const error = new NotERC721Contract(address, chainId);
        expect(error.address).toBe(address);
        expect(error.chainId).toBe(chainId);
    });

    it("has a descriptive message", () => {
        const error = new NotERC721Contract(address, chainId);
        expect(error.message).toContain(address);
        expect(error.message).toContain(String(chainId));
    });

    it("accepts an optional cause", () => {
        const cause = new Error("call failed");
        const error = new NotERC721Contract(address, chainId, { cause });
        expect(error.cause).toBe(cause);
    });
});

describe("NotERC721Enumerable", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678" as Address;
    const chainId = 1;

    it("extends ChainUtilsFault", () => {
        const error = new NotERC721Enumerable(address, chainId);
        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("has correct name", () => {
        const error = new NotERC721Enumerable(address, chainId);
        expect(error.name).toBe("NotERC721Enumerable");
    });

    it("stores address and chainId", () => {
        const error = new NotERC721Enumerable(address, chainId);
        expect(error.address).toBe(address);
        expect(error.chainId).toBe(chainId);
    });

    it("has a descriptive message", () => {
        const error = new NotERC721Enumerable(address, chainId);
        expect(error.message).toContain(address);
        expect(error.message).toContain(String(chainId));
    });

    it("accepts an optional cause", () => {
        const cause = new Error("call failed");
        const error = new NotERC721Enumerable(address, chainId, { cause });
        expect(error.cause).toBe(cause);
    });
});

describe("validateAddress", () => {
    it("accepts valid addresses", () => {
        const address = getAddress("0x1234567890abcdef1234567890abcdef12345678");
        expect(() => validateAddress(address)).not.toThrow();
    });

    it("throws InvalidAddress on malformed input", () => {
        const badAddress = "0x123";
        expect(() => validateAddress(badAddress)).toThrow(InvalidAddress);
    });
});
