import { erc721Abi } from "@/abi/erc721Abi.js";
import { describe, expect, it } from "vitest";

describe("erc721Abi", () => {
    it("has 19 entries (11 view + 5 state-changing + 3 events)", () => {
        expect(erc721Abi).toHaveLength(19);
    });

    it("contains all view functions", () => {
        const viewFns = erc721Abi.filter(
            (item) => item.type === "function" && item.stateMutability === "view",
        );
        const names = viewFns.map((fn) => fn.name);
        expect(names).toEqual([
            "supportsInterface",
            "balanceOf",
            "ownerOf",
            "getApproved",
            "isApprovedForAll",
            "name",
            "symbol",
            "tokenURI",
            "totalSupply",
            "tokenByIndex",
            "tokenOfOwnerByIndex",
        ]);
    });

    it("contains all state-changing functions", () => {
        const mutateFns = erc721Abi.filter(
            (item) => item.type === "function" && item.stateMutability === "nonpayable",
        );
        const names = mutateFns.map((fn) => fn.name);
        expect(names).toEqual([
            "approve",
            "setApprovalForAll",
            "transferFrom",
            "safeTransferFrom",
            "safeTransferFrom",
        ]);
    });

    it("contains safeTransferFrom overloads", () => {
        const safeTransfers = erc721Abi.filter(
            (item) => item.type === "function" && item.name === "safeTransferFrom",
        );
        expect(safeTransfers).toHaveLength(2);
        expect(safeTransfers[0]!.inputs.map((input) => input.type)).toEqual([
            "address",
            "address",
            "uint256",
        ]);
        expect(safeTransfers[1]!.inputs.map((input) => input.type)).toEqual([
            "address",
            "address",
            "uint256",
            "bytes",
        ]);
    });

    it("contains Transfer, Approval, and ApprovalForAll events", () => {
        const events = erc721Abi.filter((item) => item.type === "event");
        const names = events.map((e) => e.name);
        expect(names).toEqual(["Transfer", "Approval", "ApprovalForAll"]);
    });

    it("is typed as const (readonly tuple)", () => {
        const length: 19 = erc721Abi.length;
        expect(length).toBe(19);
    });
});
