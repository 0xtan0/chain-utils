/**
 * Base error type for all chain-utils failures.
 *
 * This class normalizes error messages while preserving the original `cause`.
 * It is compatible with viem-style cause traversal through `walk`.
 *
 * @example
 * ```ts
 * throw new ChainUtilsFault("Invalid chain configuration", {
 *   details: "Missing transport for chain 1",
 *   metaMessages: ["Chain ID: 1"],
 * });
 * ```
 */
export class ChainUtilsFault extends Error {
    override readonly name: string = "ChainUtilsFault";
    readonly shortMessage: string;
    readonly details: string;
    readonly metaMessages?: string[];

    /**
     * @param {string} shortMessage Human-readable summary of the failure.
     * @param {{ cause?: Error; details?: string; metaMessages?: string[] }} [options] Extra context for debugging.
     * @returns {ChainUtilsFault} A structured chain-utils error instance.
     */
    constructor(
        shortMessage: string,
        options?: {
            cause?: Error;
            details?: string;
            metaMessages?: string[];
        },
    ) {
        const details = options?.details ?? "";
        const metaMessages = options?.metaMessages;

        const message = [
            shortMessage,
            ...(metaMessages ? ["", ...metaMessages] : []),
            ...(details ? ["", `Details: ${details}`] : []),
        ].join("\n");

        super(message, { cause: options?.cause });

        this.shortMessage = shortMessage;
        this.details = details;
        this.metaMessages = metaMessages;
    }

    /**
     * Walks the cause chain and returns the deepest nested error.
     *
     * @returns {Error} The deepest error in the cause chain.
     */
    walk(): Error;
    /**
     * Walks the cause chain and returns the first error matching a predicate.
     *
     * @param {(err: unknown) => boolean} fn Predicate used to match an error in the chain.
     * @returns {Error | null} The first matching error, or `null` when no match is found.
     */
    walk(fn: (err: unknown) => boolean): Error | null;
    walk(fn?: (err: unknown) => boolean): Error | null {
        if (!fn) {
            // No predicate: return deepest cause
            if (!(this.cause instanceof Error)) return this;
            let current: Error = this.cause;
            while (current.cause instanceof Error) {
                current = current.cause;
            }
            return current;
        }

        // With predicate: return first match
        if (fn(this)) return this;
        let current: unknown = this.cause;
        while (current instanceof Error) {
            if (fn(current)) return current;
            current = current.cause;
        }
        return null;
    }
}
