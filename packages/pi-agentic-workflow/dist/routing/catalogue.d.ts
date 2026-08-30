import type { WorkflowCommand } from "./types.js";
export interface SkillMeta {
    /** Directory name inside the bundle — the fallback when `name:` is absent. */
    dir: string;
    name: string;
    description?: string;
    userInvocable: boolean;
}
/**
 * Minimal frontmatter reader: `name`, `description`, `user-invocable` only.
 *
 * `user-invocable` must say `true` to count: this repository's own rule
 * (CLAUDE.md — the key "REQUIRED for it to appear in the agent's /command menu")
 * makes absence mean internal, and `scripts/bundle-skills.mjs` reads it the same
 * way. The two scanners agree because the rule is stated once per scanner and
 * pinned by `test/alias-coverage.test.mjs`, not because either default is safe.
 */
export declare function readSkillMeta(text: string, dir: string): SkillMeta;
export interface CatalogueIssue {
    dir: string;
    message: string;
}
export interface Catalogue {
    commands: WorkflowCommand[];
    /** Skills present but unusable as commands (missing file, duplicate name). */
    issues: CatalogueIssue[];
    /** Every scanned skill that is callable, used by the alias-coverage assertions. */
    invocable: SkillMeta[];
}
/**
 * Read a bundled skills directory. A duplicate `name:` is reported instead of
 * silently shadowing an alias: two skills claiming one command is a packaging
 * bug the operator must see.
 */
export declare function readCatalogue(skillsDir: string, readFile?: (path: string) => string): Catalogue;
