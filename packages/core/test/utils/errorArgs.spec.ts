import { formatDecodedErrorArgs } from "@/utils/errorArgs.js";
import { describe, expect, it } from "vitest";

describe("formatDecodedErrorArgs", () => {
    it("returns empty string when args are missing", () => {
        expect(formatDecodedErrorArgs(undefined)).toBe("");
    });

    it("formats primitives, bigint, and arrays", () => {
        expect(formatDecodedErrorArgs([1n, true, "ok", [2n, "x"]])).toBe(
            ' (1n, true, "ok", [2n, "x"])',
        );
    });

    it("formats nested objects deterministically", () => {
        expect(
            formatDecodedErrorArgs([
                {
                    z: 1n,
                    a: [{ c: "hello", b: false }],
                },
            ]),
        ).toBe(' ({ a: [{ b: false, c: "hello" }], z: 1n })');
    });

    it("limits recursion depth using maxDeep", () => {
        expect(
            formatDecodedErrorArgs(
                [
                    {
                        level1: {
                            level2: {
                                level3: 1n,
                            },
                        },
                    },
                ],
                2,
            ),
        ).toBe(" ({ level1: { level2: [MaxDepth] } })");
    });
});
