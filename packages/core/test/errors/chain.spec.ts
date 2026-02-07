import { ChainUtilsFault } from "@/errors/base.js";
import { MulticallNotSupported, RpcFailure, UnsupportedChain } from "@/errors/chain.js";
import { describe, expect, it } from "vitest";

describe("UnsupportedChain", () => {
    it("should create with chainId", () => {
        const error = new UnsupportedChain(42161);

        expect(error.chainId).toBe(42161);
        expect(error.availableChainIds).toBeUndefined();
        expect(error.name).toBe("UnsupportedChain");
        expect(error.shortMessage).toBe("Chain 42161 is not supported");
    });

    it("should create with availableChainIds", () => {
        const error = new UnsupportedChain(999, {
            availableChainIds: [1, 10, 42161],
        });

        expect(error.chainId).toBe(999);
        expect(error.availableChainIds).toEqual([1, 10, 42161]);
        expect(error.message).toContain("Available chain IDs: 1, 10, 42161");
    });

    it("should extend ChainUtilsFault", () => {
        const error = new UnsupportedChain(1);

        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("should be walkable from a parent ChainUtilsFault", () => {
        const cause = new UnsupportedChain(1);
        const parent = new ChainUtilsFault("wrapped", { cause });

        const found = parent.walk((err) => err instanceof UnsupportedChain);
        expect(found).toBe(cause);
    });
});

describe("RpcFailure", () => {
    it("should create with chainId", () => {
        const error = new RpcFailure("Connection refused", { chainId: 1 });

        expect(error.chainId).toBe(1);
        expect(error.rpcUrl).toBeUndefined();
        expect(error.name).toBe("RpcFailure");
        expect(error.shortMessage).toBe("Connection refused");
        expect(error.message).toContain("Chain ID: 1");
    });

    it("should create with rpcUrl", () => {
        const error = new RpcFailure("Timeout", {
            chainId: 10,
            rpcUrl: "https://rpc.example.com",
        });

        expect(error.rpcUrl).toBe("https://rpc.example.com");
        expect(error.message).toContain("RPC URL: https://rpc.example.com");
    });

    it("should create with cause", () => {
        const cause = new Error("socket hang up");
        const error = new RpcFailure("Request failed", {
            chainId: 1,
            cause,
        });

        expect(error.cause).toBe(cause);
    });

    it("should extend ChainUtilsFault", () => {
        const error = new RpcFailure("fail", { chainId: 1 });

        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("should be walkable from a parent ChainUtilsFault", () => {
        const cause = new RpcFailure("fail", { chainId: 1 });
        const parent = new ChainUtilsFault("wrapped", { cause });

        const found = parent.walk((err) => err instanceof RpcFailure);
        expect(found).toBe(cause);
    });
});

describe("MulticallNotSupported", () => {
    it("should create with chainId", () => {
        const error = new MulticallNotSupported(56);

        expect(error.chainId).toBe(56);
        expect(error.name).toBe("MulticallNotSupported");
        expect(error.shortMessage).toBe("Multicall is not supported on chain 56");
    });

    it("should extend ChainUtilsFault", () => {
        const error = new MulticallNotSupported(1);

        expect(error).toBeInstanceOf(ChainUtilsFault);
        expect(error).toBeInstanceOf(Error);
    });

    it("should be walkable from a parent ChainUtilsFault", () => {
        const cause = new MulticallNotSupported(1);
        const parent = new ChainUtilsFault("wrapped", { cause });

        const found = parent.walk((err) => err instanceof MulticallNotSupported);
        expect(found).toBe(cause);
    });
});
