import { erc20Abi } from "@/abi/erc20Abi.js";
import { describe, expect, it } from "vitest";

describe("erc20Abi", () => {
    it("has 11 entries (6 functions + 3 state-changing + 2 events)", () => {
        expect(erc20Abi).toHaveLength(11);
    });

    it("contains all view functions", () => {
        const viewFns = erc20Abi.filter(
            (item) => item.type === "function" && item.stateMutability === "view",
        );
        const names = viewFns.map((fn) => fn.name);
        expect(names).toEqual([
            "name",
            "symbol",
            "decimals",
            "totalSupply",
            "balanceOf",
            "allowance",
        ]);
    });

    it("contains all state-changing functions", () => {
        const mutateFns = erc20Abi.filter(
            (item) => item.type === "function" && item.stateMutability === "nonpayable",
        );
        const names = mutateFns.map((fn) => fn.name);
        expect(names).toEqual(["approve", "transfer", "transferFrom"]);
    });

    it("contains Transfer and Approval events", () => {
        const events = erc20Abi.filter((item) => item.type === "event");
        const names = events.map((e) => e.name);
        expect(names).toEqual(["Transfer", "Approval"]);
    });

    it("is typed as const (readonly tuple)", () => {
        // If the const assertion works, length is a literal type
        const length: 11 = erc20Abi.length;
        expect(length).toBe(11);
    });
});
