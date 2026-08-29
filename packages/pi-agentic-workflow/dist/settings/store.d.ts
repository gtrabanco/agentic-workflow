/** `null` when the file is absent, which the console reads as "nothing configured here". */
export declare function readConfigFile(path: string): string | null;
export declare function writeConfigFile(path: string, text: string): void;
