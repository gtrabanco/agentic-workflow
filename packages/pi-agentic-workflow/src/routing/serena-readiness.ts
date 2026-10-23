import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SerenaReadinessRecord, SerenaReadinessStore } from "./state.js";

/**
 * Serena readiness nudge (feature 67 P5, decision D5 / AC9).
 *
 * A pi user who installs this package gets Serena's tools, but the project
 * config is `init-workspace`'s to write (AC6: one writer, no drift). So this is
 * the only thing the package may do about a project that was never provisioned:
 * **say so, once**, and point at the command that fixes it.
 *
 * The contract, in four lines:
 *  - it reads `.serena/project.yml` and reports `missing`, `stale`, `outdated`
 *    (the bundled init-workspace moved on) or `ready`;
 *  - it announces **exactly one** message per recorded state, then latches —
 *    the latch lives in the package's own global state file, so a restart does
 *    not re-nag (the first-run hint's contract);
 *  - it writes nothing to the project and nothing to any configuration;
 *  - every failure is soft: a broken read is `missing`, a failed latch is a
 *    nuisance, and neither ever throws into a command.
 */

/** The one command that owns Serena provisioning. */
export const INIT_WORKSPACE_COMMAND = "/init-workspace";

/** What a `.serena/project.yml` says about itself — only what this check reads. */
export interface SerenaConfig {
  present: boolean;
  /** The `language_servers` entries, in file order. Empty when absent or empty. */
  languageServers: string[];
}

export type SerenaReadiness =
  | { kind: "missing" }
  | { kind: "stale"; detail: string }
  | { kind: "outdated"; recorded: string; revision: string }
  | { kind: "ready" };

/**
 * Read the two facts this check needs out of the project config. A tolerant
 * line scanner, not a YAML parser: the file is written by `init-workspace`, and
 * the only key read here is the `language_servers` list. Anything it cannot
 * understand reads as "no servers", which is the fail-closed direction — the
 * nudge fires rather than a broken config passing silently.
 */
export function inspectSerenaConfig(text: string | null | undefined): SerenaConfig {
  if (typeof text !== "string") return { present: false, languageServers: [] };

  const lines = text.split(/\r?\n/u);
  const start = lines.findIndex((line) => /^language_servers:/u.test(line));
  if (start === -1) return { present: true, languageServers: [] };

  // Inline form: `language_servers: [markdown, json]`
  const inline = /^language_servers:\s*\[(.*)\]\s*$/u.exec(lines[start]);
  if (inline) {
    return {
      present: true,
      languageServers: inline[1]
        .split(",")
        .map((entry) => entry.trim().replace(/^["']|["']$/gu, ""))
        .filter(Boolean),
    };
  }

  const languageServers: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const item = /^\s+-\s*(.+?)\s*$/u.exec(line);
    if (!item) {
      // The list ended (a new top-level key) or the line is blank/comment.
      if (line.trim() !== "" && !/^\s*#/u.test(line)) break;
      continue;
    }
    languageServers.push(item[1].replace(/^["']|["']$/gu, ""));
  }
  return { present: true, languageServers };
}

/**
 * Decide what this project needs. `recorded` is the latch's last announcement —
 * a changed shipped revision is itself a trigger, so an upgraded package can
 * tell the operator that the config predates it.
 */
export function evaluateSerenaReadiness({
  config,
  recorded,
  revision,
}: {
  config: SerenaConfig;
  recorded?: SerenaReadinessRecord;
  revision: string;
}): SerenaReadiness {
  if (!config.present) return { kind: "missing" };
  if (config.languageServers.length === 0) {
    return {
      kind: "stale",
      detail: "the project config lists no language_servers, so no server will start for it",
    };
  }
  if (recorded?.state === "ready" && recorded.revision !== revision) {
    return { kind: "outdated", recorded: recorded.revision, revision };
  }
  return { kind: "ready" };
}

/** The one notification this module may produce, or null when there is nothing to say. */
export function serenaReadinessMessage(readiness: SerenaReadiness): string | null {
  switch (readiness.kind) {
    case "missing":
      return (
        `pi-agentic-workflow: serena — this project has no .serena/project.yml, so no language server ` +
        `will start for it. Run ${INIT_WORKSPACE_COMMAND} to provision it (this is said once).`
      );
    case "stale":
      return (
        `pi-agentic-workflow: serena — ${readiness.detail}. Run ${INIT_WORKSPACE_COMMAND} to rewrite it ` +
        `(this is said once).`
      );
    case "outdated":
      return (
        `pi-agentic-workflow: serena — this project's config was provisioned by init-workspace ` +
        `${readiness.recorded}, and this package ships ${readiness.revision}. Run ${INIT_WORKSPACE_COMMAND} ` +
        `to bring it up to date (this is said once).`
      );
    case "ready":
      return null;
  }
}

export interface SerenaReadinessGate {
  /** The message to announce for this project, or null when nothing is due. */
  check(projectKey: string): string | null;
}

/**
 * The gate the two entry points share (session start and the first command
 * dispatch). One latch per extension instance, so a single session announces at
 * most once; the persisted record keeps later sessions quiet.
 */
export function createSerenaReadinessGate({
  store,
  revision,
  readProject = (projectKey: string) => {
    try {
      return readFileSync(join(projectKey, ".serena", "project.yml"), "utf8");
    } catch {
      return null;
    }
  },
  now = () => new Date().toISOString(),
}: {
  store: SerenaReadinessStore;
  revision: string;
  /** Injectable so the suite reads fixtures instead of a real project. */
  readProject?: (projectKey: string) => string | null;
  now?: () => string;
}): SerenaReadinessGate {
  let announced = false;

  return {
    check(projectKey: string): string | null {
      if (announced) return null;
      announced = true;
      const config = inspectSerenaConfig(readProject(projectKey));
      const recorded = store.record(projectKey);
      const readiness = evaluateSerenaReadiness({ config, recorded, revision });
      // The latch compares STATE KINDS, not just the presence of a record: a
      // project that was ready and lost its config is a new thing to say, while
      // a project still missing one is not.
      const due = readiness.kind !== "ready" && recorded?.state !== readiness.kind;
      // Latch second, and always: a ready project still stores its revision, so
      // a later upgrade has a baseline to compare against.
      store.latch(projectKey, { state: readiness.kind, revision, at: now() });
      if (!due) return null;
      return serenaReadinessMessage(readiness);
    },
  };
}

/** The bundled `init-workspace` revision, read from the shipped skill's frontmatter. */
export function readInitWorkspaceRevision(skillsDir: string): string {
  try {
    const text = readFileSync(join(skillsDir, "init-workspace", "SKILL.md"), "utf8");
    const match = /^version:\s*(\S+)\s*$/mu.exec(text.split("\n---", 1)[0] ?? "");
    return match ? match[1] : "unknown";
  } catch {
    return "unknown";
  }
}
