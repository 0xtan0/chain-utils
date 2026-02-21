function formatDecodedErrorValue(value: unknown, maxDeep = 20, currentDeep = 0): string {
    if (currentDeep >= maxDeep) {
        return "[MaxDepth]";
    }

    if (value === null) {
        return "null";
    }

    if (value === undefined) {
        return "undefined";
    }

    if (typeof value === "bigint") {
        return `${value.toString()}n`;
    }

    if (typeof value === "string") {
        return JSON.stringify(value);
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map((item) => formatDecodedErrorValue(item, maxDeep, currentDeep + 1)).join(", ")}]`;
    }

    if (value instanceof Uint8Array) {
        const hex = [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
        return `0x${hex}`;
    }

    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !/^\d+$/.test(key))
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

        return `{ ${entries.map(([key, item]) => `${key}: ${formatDecodedErrorValue(item, maxDeep, currentDeep + 1)}`).join(", ")} }`;
    }

    return String(value);
}

export function formatDecodedErrorArgs(args: readonly unknown[] | undefined, maxDeep = 20): string {
    if (!args || args.length === 0) {
        return "";
    }

    return ` (${args.map((arg) => formatDecodedErrorValue(arg, maxDeep)).join(", ")})`;
}
