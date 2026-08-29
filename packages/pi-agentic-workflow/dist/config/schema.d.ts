import type { ConfigFile, ConfigIssue } from "./types.js";
/** The split Pi performs when resolving a reference: provider before the first slash. */
export interface ModelParts {
    provider: string;
    id: string;
}
/** Same rule as `isModelReference`, plus the split Pi performs when resolving. */
export declare function parseModelReference(value: unknown): ModelParts | undefined;
export type ParseResult = {
    ok: true;
    config: ConfigFile;
} | {
    ok: false;
    issues: ConfigIssue[];
};
/**
 * Parse and validate one config file's text. A blank file is an empty config so
 * the loader can treat "nothing declared" like "nothing present" without a
 * second read.
 */
export declare function parseConfigFile(text: string): ParseResult;
