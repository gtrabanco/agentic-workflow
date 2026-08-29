// src/settings/store.ts
// The real filesystem behind the settings console's save (SPEC S4, AC10).
//
// Synchronous, like the loader: these are two small JSON files, and a read that
// could not block would make the console's "what is in effect right now" view
// race the dispatcher. Config is written 0600 with its parent created, because
// the project scope's `.pi/` may not exist yet in a fresh clone.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
/** `null` when the file is absent, which the console reads as "nothing configured here". */
export function readConfigFile(path) {
    try {
        return readFileSync(path, "utf8");
    }
    catch (error) {
        if (error.code === "ENOENT")
            return null;
        throw error;
    }
}
export function writeConfigFile(path, text) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text, { mode: 0o600 });
}
