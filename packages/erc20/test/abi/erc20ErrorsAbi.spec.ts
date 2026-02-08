import { erc20ErrorsAbi } from "@/abi/erc20ErrorsAbi.js";
import { describe, expect, it } from "vitest";

describe("erc20ErrorsAbi", () => {
    it("has 6 error definitions", () => {
        expect(erc20ErrorsAbi).toHaveLength(6);
    });

    it("contains all OZ v5 custom error names", () => {
        const names = erc20ErrorsAbi.map((e) => e.name);
        expect(names).toEqual([
            "ERC20InsufficientBalance",
            "ERC20InsufficientAllowance",
            "ERC20InvalidSender",
            "ERC20InvalidReceiver",
            "ERC20InvalidApprover",
            "ERC20InvalidSpender",
        ]);
    });

    it("all entries are error type", () => {
        for (const entry of erc20ErrorsAbi) {
            expect(entry.type).toBe("error");
        }
    });

    it("ERC20InsufficientBalance has sender, balance, needed inputs", () => {
        const entry = erc20ErrorsAbi[0];
        const inputNames = entry.inputs.map((i) => i.name);
        expect(inputNames).toEqual(["sender", "balance", "needed"]);
    });

    it("is typed as const (readonly tuple)", () => {
        const length: 6 = erc20ErrorsAbi.length;
        expect(length).toBe(6);
    });
});
