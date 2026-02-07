/**
 * Base error for all chain-utils errors.
 * Provides structured error info compatible with viem's error.walk() pattern.
 */
export class ChainUtilsFault extends Error {
    override readonly name = "ChainUtilsFault";
    readonly shortMessage: string;
    readonly details: string;
    readonly metaMessages?: string[];

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

    /** Walk the cause chain, returning the deepest cause. */
    walk(): Error;
    /** Walk the cause chain, returning the first error matching the predicate. */
    walk(fn: (err: unknown) => boolean): Error | null;
    walk(fn?: (err: unknown) => boolean): Error | null {
        if (!fn) {
            // No predicate: return deepest cause
            let current: Error = this;
            while (current.cause instanceof Error) {
                current = current.cause;
            }
            return current;
        }

        // With predicate: return first match
        let current: unknown = this;
        while (current instanceof Error) {
            if (fn(current)) return current;
            current = current.cause;
        }
        return null;
    }
}
