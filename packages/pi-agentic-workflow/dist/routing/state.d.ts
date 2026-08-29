export declare const stateFilePath: (agentDir: string) => string;
export interface HintStore {
    /** Whether the hint still needs showing. Cached after the first read. */
    pending(): boolean;
    /** Record that the hint was shown. Returns false when persistence failed. */
    acknowledge(now?: string): boolean;
}
export interface HintStoreOptions {
    path: string;
    readFile?: (path: string) => string | null;
    writeFile?: (path: string, text: string) => void;
}
export declare function createHintStore({ path, readFile, writeFile, }: HintStoreOptions): HintStore;
