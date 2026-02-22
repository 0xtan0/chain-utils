import { describe, expect, it } from "vitest";

/**
 * Smoke test: verify all public API symbols are importable
 * from the package entry point (external.ts via index.ts).
 */
describe("public API", () => {
    it("exports all ABI symbols", async () => {
        const mod = await import("@/index.js");
        expect(mod.erc20Abi).toBeDefined();
        expect(mod.erc20ErrorsAbi).toBeDefined();
    });

    it("exports client implementations", async () => {
        const mod = await import("@/index.js");
        expect(mod.ERC20ReadClient).toBeDefined();
        expect(mod.createERC20Client).toBeDefined();
        expect(mod.ERC20WriteClientImpl).toBeDefined();
        expect(mod.createERC20WriteClient).toBeDefined();
        expect(mod.ERC20MultichainClient).toBeDefined();
        expect(mod.createERC20MultichainClient).toBeDefined();
    });

    it("exports token builders and definitions", async () => {
        const mod = await import("@/index.js");
        expect(mod.TokenDefinition).toBeDefined();
        expect(mod.TokenBuilder).toBeDefined();
        expect(mod.defineToken).toBeDefined();
        expect(mod.ERC20BoundToken).toBeDefined();
        expect(mod.ERC20TokenBuilder).toBeDefined();
    });

    it("exports pre-built token definitions", async () => {
        const mod = await import("@/index.js");
        expect(mod.USDC).toBeDefined();
        expect(mod.USDT).toBeDefined();
        expect(mod.WETH).toBeDefined();
    });

    it("exports error decoder", async () => {
        const mod = await import("@/index.js");
        expect(mod.ERC20ErrorDecoder).toBeDefined();
    });

    it("exports error classes", async () => {
        const mod = await import("@/index.js");
        expect(mod.InvalidAddress).toBeDefined();
        expect(mod.NotERC20Contract).toBeDefined();
        expect(mod.InsufficientBalance).toBeDefined();
        expect(mod.InsufficientAllowance).toBeDefined();
        expect(mod.InvalidSender).toBeDefined();
        expect(mod.InvalidReceiver).toBeDefined();
        expect(mod.InvalidApprover).toBeDefined();
        expect(mod.InvalidSpender).toBeDefined();
    });
});
