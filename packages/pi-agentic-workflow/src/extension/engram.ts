/**
 * Engram MCP provisioning (feature 66, P4 — AC3, decision D3).
 *
 * The memory substrate's registration is **ask-first and reversible**, which is
 * why it goes through Pi's own consent surface instead of writing a
 * machine-global `mcp.json` behind the operator's back:
 *
 *  - `pi.registerMcpServer(name, config)` is session-scoped and NOT persisted
 *    (Pi's contract), so the package registers on every load and nothing
 *    outlives the session unless the operator asks for it.
 *  - Registration happens only when the `engram` binary actually resolves — a
 *    registered-but-broken server would surface as an extension error on every
 *    session, which is a worse default than not registering.
 *  - A server the operator already declared in `mcp.json` wins (Pi gives it
 *    precedence), so the package reports that and does not shadow it.
 *  - The operator's `memory.engram` config key is the consent switch: absent or
 *    `false` registers nothing. This module never provisions without it.
 *
 * Every outcome is reported verbatim — "exactly what was written" is the rule
 * the sibling `init-workspace` consent flow already follows, and a
 * provisioning step the operator cannot read back is one they cannot trust.
 *
 * The install route is `pi install npm:gentle-engram@latest`. The CLI's own
 * setup subcommand is deliberately NOT the documented route: it pins whatever
 * version it ran with and keeps serving it until it is run again, so an updated
 * binary can sit unused behind a stale registration.
 *
 * Pi-free by construction — the binary lookup, the environment, the "already
 * declared" names and the register callback are all injected, so every branch
 * is tested with no Pi session, no PATH and no real binary.
 */

import { accessSync, constants, readFileSync } from "node:fs";
import { delimiter, join } from "node:path";

/** The name the server is registered under, and what `mcp.json` would declare. */
export const ENGRAM_SERVER_NAME = "engram";

/** The argv the workflow's runners use (pi's own registration, measured). */
export const ENGRAM_ARGS = ["mcp", "--tools=agent"] as const;

/** The one documented install route (D3). */
export const ENGRAM_INSTALL_ROUTE = "pi install npm:gentle-engram@latest";

export type EngramStatus =
  | "registered"
  | "not-consented"
  | "binary-missing"
  | "already-declared"
  | "unsupported-host";

export interface EngramServerConfig {
  command: string;
  args: string[];
}

export interface EngramProvisionInput {
  /** The operator's consent: `config.memory.engram`. Absent means no. */
  consented: boolean;
  /** Absolute path of the resolved `engram` binary, or null when not found. */
  binaryPath: string | null;
  /** Server names the operator already declared (a `mcp.json` name wins). */
  declaredNames: readonly string[];
  /** Pi's registrar, injected so this module never imports Pi. `null` when the
   *  host's ExtensionAPI predates `registerMcpServer` — the package's peer floor
   *  is a range, so an older host degrades instead of throwing. */
  register: ((name: string, config: EngramServerConfig) => void) | null;
}

export interface EngramReport {
  status: EngramStatus;
  /** Present only when `status === "registered"`: exactly what was written. */
  server?: { name: string } & EngramServerConfig;
  /** One line an operator can read back; states what was written or why not. */
  message: string;
}

/**
 * The server names an operator already declared in an `mcp.json` file. Pi gives
 * a declared server precedence over an extension registration, so the caller
 * passes this in and the module reports rather than shadows. Unreadable or
 * malformed JSON yields `[]`: a file this module cannot parse is not evidence
 * of a declaration, and refusing to register on it would be a silent gap.
 */
export function readDeclaredServerNames(path: string): string[] {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return [];
    const servers = (parsed as { mcpServers?: unknown }).mcpServers;
    if (typeof servers !== "object" || servers === null) return [];
    return Object.keys(servers);
  } catch {
    return [];
  }
}

/**
 * Resolve `engram` on `PATH` without a shell, honouring `PATHEXT` on Windows.
 * Injected `exists`/`env` keep the lookup testable; the production caller takes
 * the defaults.
 */
export function resolveEngramBinary({
  env = process.env,
  exists = isExecutable,
  platform = process.platform,
}: {
  env?: Record<string, string | undefined>;
  exists?: (path: string) => boolean;
  platform?: NodeJS.Platform;
} = {}): string | null {
  const pathValue = env.PATH ?? env.Path ?? "";
  if (pathValue === "") return null;
  const extensions = platform === "win32" ? splitExtensions(env.PATHEXT) : [""];
  for (const dir of pathValue.split(delimiter)) {
    if (dir === "") continue;
    for (const extension of extensions) {
      const candidate = join(dir, `${ENGRAM_SERVER_NAME}${extension}`);
      if (exists(candidate)) return candidate;
    }
  }
  return null;
}

function splitExtensions(pathext: string | undefined): string[] {
  const raw = (pathext ?? ".EXE;.CMD;.BAT;.COM").split(";").filter((value) => value !== "");
  return [...raw, ""];
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decide and perform the registration, in the order that makes the outcome
 * truthful: consent first (never provision unasked), then the binary (never
 * register a server that cannot start), then the operator's own declaration
 * (never shadow it). Returns the report; it never throws and never mutates
 * anything beyond the injected `register` call.
 */
export function provisionEngram(input: EngramProvisionInput): EngramReport {
  const { consented, binaryPath, declaredNames, register } = input;

  if (!consented) {
    return {
      status: "not-consented",
      message:
        `pi-agentic-workflow: Engram not registered — set "memory": { "engram": true } in ` +
        `pi-agentic-workflow.json to opt in (nothing was written).`,
    };
  }

  if (binaryPath === null) {
    return {
      status: "binary-missing",
      message:
        `pi-agentic-workflow: Engram not registered — no "engram" binary on PATH, so ` +
        `nothing was written. Install it with: ${ENGRAM_INSTALL_ROUTE}`,
    };
  }

  if (register === null) {
    return {
      status: "unsupported-host",
      message:
        `pi-agentic-workflow: Engram not registered — this Pi host exposes no ` +
        `registerMcpServer, so the server was not added (nothing was written).`,
    };
  }

  if (declaredNames.includes(ENGRAM_SERVER_NAME)) {
    return {
      status: "already-declared",
      message:
        `pi-agentic-workflow: Engram not registered — "${ENGRAM_SERVER_NAME}" is already ` +
        `declared in mcp.json, which takes precedence (nothing was written).`,
    };
  }

  const config: EngramServerConfig = { command: binaryPath, args: [...ENGRAM_ARGS] };
  register(ENGRAM_SERVER_NAME, config);
  return {
    status: "registered",
    server: { name: ENGRAM_SERVER_NAME, ...config },
    message:
      `pi-agentic-workflow: registered MCP server "${ENGRAM_SERVER_NAME}" → ` +
      `${binaryPath} ${ENGRAM_ARGS.join(" ")} (session-scoped; Pi does not persist it)`,
  };
}
