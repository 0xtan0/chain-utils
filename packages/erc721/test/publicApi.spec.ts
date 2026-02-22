import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("public API", () => {
    it("exports collection reader/writer classes and factories", async () => {
        const mod = await import("@/index.js");

        expect(mod.ERC721CollectionReader).toBeDefined();
        expect(mod.createERC721CollectionReader).toBeDefined();
        expect(mod.ERC721CollectionWriter).toBeDefined();
        expect(mod.createERC721CollectionWriter).toBeDefined();
    });

    it("defines package exports map for root resolution", async () => {
        const packageJson = JSON.parse(
            await readFile(new URL("../package.json", import.meta.url), "utf8"),
        ) as {
            exports?: {
                [key: string]: {
                    readonly types?: string;
                    readonly import?: string;
                    readonly default?: string;
                };
            };
        };

        expect(packageJson.exports?.["."]).toEqual({
            types: "./dist/src/index.d.ts",
            import: "./dist/src/index.js",
            default: "./dist/src/index.js",
        });
    });
});
