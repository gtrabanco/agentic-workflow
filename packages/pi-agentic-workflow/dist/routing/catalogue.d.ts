import type { WorkflowCommand } from "./types.js";
export interface SkillMeta {
    /** Directory name inside the bundle — the fallback when `name:` is absent. */
    dir: string;
    name: string;
    description?: string;
    userInvocable: boolean;
}
/** Minimal frontmatter reader: `name`, `description`, `user-invocable` only. */
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
