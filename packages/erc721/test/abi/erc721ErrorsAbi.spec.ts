import { erc721ErrorsAbi } from "@/abi/erc721ErrorsAbi.js";
import { describe, expect, it } from "vitest";

describe("erc721ErrorsAbi", () => {
    it("has 8 error definitions", () => {
        expect(erc721ErrorsAbi).toHaveLength(8);
    });

    it("contains all OZ v5 custom error names", () => {
        const names = erc721ErrorsAbi.map((e) => e.name);
        expect(names).toEqual([
            "ERC721InvalidOwner",
            "ERC721NonexistentToken",
            "ERC721IncorrectOwner",
            "ERC721InvalidSender",
            "ERC721InvalidReceiver",
            "ERC721InsufficientApproval",
            "ERC721InvalidApprover",
            "ERC721InvalidOperator",
        ]);
    });

    it("all entries are error type", () => {
        for (const entry of erc721ErrorsAbi) {
            expect(entry.type).toBe("error");
        }
    });

    it("ERC721IncorrectOwner has sender, tokenId, owner inputs", () => {
        const entry = erc721ErrorsAbi.find((error) => error.name === "ERC721IncorrectOwner");
        expect(entry).toBeDefined();
        const inputNames = entry?.inputs.map((input) => input.name);
        expect(inputNames).toEqual(["sender", "tokenId", "owner"]);
    });

    it("is typed as const (readonly tuple)", () => {
        const length: 8 = erc721ErrorsAbi.length;
        expect(length).toBe(8);
    });
});
