import { ChainUtilsFault } from "@/errors/base.js";
import { describe, expect, it } from "vitest";

describe("ChainUtilsFault", () => {
    describe("construction", () => {
        it("should create with just a shortMessage", () => {
            const error = new ChainUtilsFault("Something went wrong");

            expect(error.shortMessage).toBe("Something went wrong");
            expect(error.details).toBe("");
            expect(error.metaMessages).toBeUndefined();
            expect(error.name).toBe("ChainUtilsFault");
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ChainUtilsFault);
        });

        it("should create with details", () => {
            const error = new ChainUtilsFault("Failed", {
                details: "RPC returned 500",
            });

            expect(error.details).toBe("RPC returned 500");
            expect(error.message).toContain("Details: RPC returned 500");
        });

        it("should create with metaMessages", () => {
            const error = new ChainUtilsFault("Failed", {
                metaMessages: ["Chain: mainnet", "Block: 12345"],
            });

            expect(error.metaMessages).toEqual(["Chain: mainnet", "Block: 12345"]);
            expect(error.message).toContain("Chain: mainnet");
            expect(error.message).toContain("Block: 12345");
        });

        it("should create with cause", () => {
            const cause = new Error("original error");
            const error = new ChainUtilsFault("Wrapped", { cause });

            expect(error.cause).toBe(cause);
        });

        it("should format message with all options", () => {
            const error = new ChainUtilsFault("Operation failed", {
                details: "timeout",
                metaMessages: ["Chain ID: 1"],
            });

            expect(error.message).toBe("Operation failed\n\nChain ID: 1\n\nDetails: timeout");
        });
    });

    describe("walk() without predicate", () => {
        it("should return self when there is no cause", () => {
            const error = new ChainUtilsFault("no cause");

            expect(error.walk()).toBe(error);
        });

        it("should return deepest cause", () => {
            const deepest = new Error("root cause");
            const middle = new ChainUtilsFault("middle", { cause: deepest });
            const top = new ChainUtilsFault("top", { cause: middle });

            expect(top.walk()).toBe(deepest);
        });

        it("should handle single level cause", () => {
            const cause = new Error("cause");
            const error = new ChainUtilsFault("top", { cause });

            expect(error.walk()).toBe(cause);
        });
    });

    describe("walk() with predicate", () => {
        it("should return first matching error", () => {
            const deepest = new Error("root");
            const middle = new ChainUtilsFault("middle", { cause: deepest });
            const top = new ChainUtilsFault("top", { cause: middle });

            const result = top.walk(
                (err) => err instanceof ChainUtilsFault && err.shortMessage === "middle",
            );

            expect(result).toBe(middle);
        });

        it("should return null when no error matches", () => {
            const error = new ChainUtilsFault("test");

            const result = error.walk(() => false);

            expect(result).toBeNull();
        });

        it("should return self when self matches", () => {
            const error = new ChainUtilsFault("test");

            const result = error.walk((err) => err instanceof ChainUtilsFault);

            expect(result).toBe(error);
        });

        it("should match on nested non-ChainUtilsFault errors", () => {
            const typeError = new TypeError("bad type");
            const error = new ChainUtilsFault("wrapped", { cause: typeError });

            const result = error.walk((err) => err instanceof TypeError);

            expect(result).toBe(typeError);
        });
    });
});
