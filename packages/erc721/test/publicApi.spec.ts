import { describe, expect, it } from "vitest";

describe("public API", () => {
    it("exports collection reader/writer classes and factories", async () => {
        const mod = await import("@/index.js");

        expect(mod.ERC721CollectionReader).toBeDefined();
        expect(mod.createERC721CollectionReader).toBeDefined();
        expect(mod.ERC721CollectionWriter).toBeDefined();
        expect(mod.createERC721CollectionWriter).toBeDefined();
    });
});
