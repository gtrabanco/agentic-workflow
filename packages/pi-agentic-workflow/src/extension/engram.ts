/**
 * Engram MCP provisioning (feature 66, P4 — AC3, decision D3).
 *
 * The memory substrate's registration is **ask-first and reversible**, which is
 * why it goes through Pi's own consent surface instead of writing a
 * machine-global `mcp.json` behind the operator's back:
 *
 *  - `pi.registerMcpServer(name, config)` is session-scoped and NOT persisted
 *    (Pi's contract), so the package registers on every session start and nothing
 *    outlives the session unless the operator asks for it.
 *  - Registration happens only when the `engram` binary actually resolves — a
 *    registered-but-broken server would surface as an extension error on every
 *    session, which is a worse default than not registering.
 *  - A server the operator already declared in an `mcp.json` Pi reads — the
 *    user file or, for a trusted project, `<cwd>/.pi/mcp.json` — wins (Pi gives
 *    it precedence), so the package reports that and does not shadow it.
 *  - The operator's `memory.engram` config key is the consent switch: absent or
 *    `false` registers nothing. This module never provisions without it.
 *
 * Every outcome is reported verbatim — "exactly what was written" is the rule
 * the sibling `init-workspace` consent flow already follows, and a
 * provisioning step the operator cannot read back is one they cannot trust.
 *
 * Issue #538: the report is a consent × runtime-health state machine, not one
 * advisory for every state. A healthy opted-in install is **silent** (the
 * advisory it used to print on every session start read as "engram is not
 * available" on a machine where memory worked), a broken one is **one error
 * naming the resolution that failed and every route that repairs it**, and a
 * session without the opt-in says nothing at all. Each report therefore carries
 * the `notice` Pi's UI should apply, and `message` is empty exactly when there
 * is nothing to say.
 *
 * The install route is `pi install npm:gentle-engram@latest` — the **Pi
 * companion**, one of three resolution surfaces the reports name. The core
 * `engram` binary (on `PATH` or named by `ENGRAM_BIN`) and a running server
 * (`ENGRAM_URL`, local or remote) are the other two; issue #531: the earlier
 * refusal printed the companion route as the fix for a missing core binary,
 * which cannot work. When the native `gentle-engram` package is installed it
 * already provides the `mem_*` tools over the HTTP server, so this module
 * registers nothing (Engram's own setup is native-only: an Engram MCP path
 * next to the native tools is what its docs warn against) and says so. A set
 * `ENGRAM_URL` is an externally managed server and likewise skips the stdio
 * MCP path — MCP-over-HTTP does not exist in core.
 * The CLI's own setup subcommand is deliberately NOT the documented route: it
 * pins whatever version it ran with and keeps serving it until it is run
 * again, so an updated binary can sit unused behind a stale registration.
 *
 * Pi-free by construction — the binary lookup, the environment, the "already
 * declared" names and the register callback are all injected, so every branch
 * is tested with no Pi session, no PATH and no real binary.
 */

import { accessSync, constants, readFileSync } from "node:fs";
import { delimiter, join } from "node:path";

import { BASE_CONFIG_FILE } from "@gtrabanco/agentic-workflow-schema";

/** The directory a project keeps its own agent config in — Pi's `.pi/`. */
const PROJECT_DIR = ".pi";

/** The name the server is registered under, and what `mcp.json` would declare. */
export const ENGRAM_SERVER_NAME = "engram";

/** Pi's own settings file name; its `packages` list is where a Pi package is declared. */
const PI_SETTINGS_FILE = "settings.json";

/** The binary override Engram's own extension documents (`ENGRAM_BIN`). */
const ENGRAM_BIN_VAR = "ENGRAM_BIN";

/** The externally managed server Engram's own extension documents (`ENGRAM_URL`). */
const ENGRAM_URL_VAR = "ENGRAM_URL";

/** The argv the workflow's runners use (pi's own registration, measured). */
export const ENGRAM_ARGS = ["mcp", "--tools=agent"] as const;

/** The one documented install route (D3). */
export const ENGRAM_INSTALL_ROUTE = "pi install npm:gentle-engram@latest";

export type EngramStatus =
  | "registered"
  | "not-consented"
  | "config-invalid"
  | "native-active"
  | "external-server"
  | "binary-missing"
  | "already-declared"
  | "unsupported-host";

/** The notification level a report asks for; Pi's `ui.notify` kinds plus the
 *  silence the state machine needs (issue #538 S2/S3/S4/S8). */
export type EngramNotice = "silent" | "info" | "warning" | "error";

export interface EngramServerConfig {
  command: string;
  args: string[];
}

export interface EngramProvisionInput {
  /** The operator's consent: `config.memory.engram`. Absent means no. */
  consented: boolean;
  /** True when the package's config file exists but does not parse or validate.
   *  Consent is then UNKNOWN, not refused: `loadConfig` fails closed to the
   *  shipped default, so reading `consented` off that default would tell an
   *  opted-in operator to opt in — `config/load.ts` calls a present-but-invalid
   *  file a problem, never a silent default, and `dispatch.ts` refuses on the
   *  same flag. Checked before consent. */
  configInvalid?: boolean;
  /** True when the native `gentle-engram` package is installed — Pi's own
   *  `settings.json` packages list names it (issue #531 AC1). The native
   *  extension already provides the `mem_*` tools, so the MCP path registers
   *  nothing; see `readInstalledPackageSources`/`isNativeEngramPackage`. */
  nativePackagePresent?: boolean;
  /** The session's `ENGRAM_URL` value, or null/blank when unset (issue #531
   *  AC2). A set URL names an externally managed server; stdio MCP cannot
   *  target one, so the MCP path registers nothing and the choice is reported
   *  as deliberate rather than as a missing binary. */
  engramUrl?: string | null;
  /** The session's `ENGRAM_BIN` value, or null/blank when unset (issue #538 S7).
   *  A broken report has to tell "absent" from "unresolvable", and the override
   *  is the only evidence that separates them: `resolveEngramBinary` fails closed
   *  on an override that resolves nothing, so a null `binaryPath` beside a set
   *  `ENGRAM_BIN` is a broken route the operator can repair by fixing it. */
  engramBin?: string | null;
  /** Absolute path of the resolved `engram` binary, or null when not found. */
  binaryPath: string | null;
  /** Server names the operator already declared (a `mcp.json` name wins), read
   *  from every scope Pi itself reads — see `declaredMcpServerPaths`. */
  declaredNames: readonly string[];
  /** Pi's registrar, injected so this module never imports Pi. `null` when the
   *  host's ExtensionAPI predates `registerMcpServer` — the package's peer floor
   *  is a range, so an older host degrades instead of throwing. */
  register: ((name: string, config: EngramServerConfig) => void) | null;
}

export interface EngramReport {
  status: EngramStatus;
  /** What Pi's UI should do with `message` (issue #538 S8). `silent` is the
   *  healthy adopted-in and the not-opted-in state; `info` states a working or
   *  deliberately configured setup; `warning` is a working setup whose guarantee
   *  is broken; `error` is an opted-in session with no usable substrate. */
  notice: EngramNotice;
  /** Present only when `status === "registered"`: exactly what was written. */
  server?: { name: string } & EngramServerConfig;
  /** One line an operator can read back; states what was written or why not,
   *  and is empty when the state owes the operator nothing (issue #538 S2). */
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
 * The union of the names declared across the `mcp.json` files Pi reads. One
 * file's declaration is not evidence about the other's.
 */
export function readDeclaredServerNamesFrom(paths: readonly string[]): string[] {
  const names = new Set<string>();
  for (const path of paths) {
    for (const name of readDeclaredServerNames(path)) names.add(name);
  }
  return [...names];
}

/**
 * The `mcp.json` files Pi reads for one session: the user-level file, and — for
 * a trusted project only — `<cwd>/.pi/mcp.json`, whose entry replaces a
 * same-named user entry (Pi's `mcp.md`: project configuration is read only after
 * trust is granted, and "a project entry replaces a user-level entry with the
 * same name"). The anti-shadow guard has to consult the same surface the host
 * applies: reading only the user file let a project declaration slip past it, so
 * the package registered anyway and then reported precedence over a file it had
 * never opened.
 */
export function declaredMcpServerPaths({
  agentDir,
  cwd,
  projectTrusted,
}: {
  agentDir: string;
  cwd: string;
  projectTrusted: boolean;
}): string[] {
  const paths = [join(agentDir, "mcp.json")];
  if (projectTrusted) paths.push(join(cwd, PROJECT_DIR, "mcp.json"));
  return paths;
}

/**
 * The `settings.json` files Pi reads for one session, i.e. the files its
 * `packages` list comes from: the user file always, and — for a trusted project
 * only — `<cwd>/.pi/settings.json`, the file `pi install --local` writes and Pi
 * reads after trust is granted. Same two scopes, same trust argument as
 * `declaredMcpServerPaths`, because a package list read from a file the host
 * does not load is not evidence of anything.
 */
export function piSettingsPaths({
  agentDir,
  cwd,
  projectTrusted,
}: {
  agentDir: string;
  cwd: string;
  projectTrusted: boolean;
}): string[] {
  const paths = [join(agentDir, PI_SETTINGS_FILE)];
  if (projectTrusted) paths.push(join(cwd, PROJECT_DIR, PI_SETTINGS_FILE));
  return paths;
}

/**
 * Resolve `engram` on `PATH` without a shell, honouring `PATHEXT` on Windows.
 * Injected `exists`/`env` keep the lookup testable; the production caller takes
 * the defaults.
 *
 * `ENGRAM_BIN` is honoured first, because it is one of the routes the binary
 * refusal names: a bare name is looked up on `PATH` like `engram` itself and an
 * absolute path is taken as given (exactly as Engram's own extension resolves
 * it). An override that resolves nothing yields `null` instead of falling back
 * to `PATH` — falling back would register a binary the operator did not name.
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
  const extensions = platform === "win32" ? splitExtensions(env.PATHEXT) : [""];
  const configured = env[ENGRAM_BIN_VAR];
  const override = isNonBlank(configured) ? configured.trim() : null;
  if (override !== null) {
    if (/[\\/]/u.test(override)) return exists(override) ? override : null;
    return lookupOnPath(override, env, extensions, exists);
  }
  return lookupOnPath(ENGRAM_SERVER_NAME, env, extensions, exists);
}

/**
 * The `PATH` scan itself: one program name, every directory, every extension.
 * An empty `PATH` resolves nothing rather than reading the current directory —
 * `join("", name)` would silently do exactly that.
 */
function lookupOnPath(
  name: string,
  env: Record<string, string | undefined>,
  extensions: readonly string[],
  exists: (path: string) => boolean,
): string | null {
  const pathValue = env.PATH ?? env.Path ?? "";
  if (pathValue === "") return null;
  for (const dir of pathValue.split(delimiter)) {
    if (dir === "") continue;
    for (const extension of extensions) {
      const candidate = join(dir, `${name}${extension}`);
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
 * The package sources Pi's user `settings.json` declares. `packages` entries
 * are either plain strings (`npm:gentle-engram@latest`) or objects carrying a
 * `source` (`{ "source": "npm:pi-effort" }`); anything else is skipped. A file
 * that is missing or unreadable yields `[]`: absence of evidence about the
 * packages list is never evidence that the native package is installed, and
 * refusing the lookup would block the whole provisioning report (same rule as
 * `readDeclaredServerNames`).
 */
export function readInstalledPackageSources(path: string): string[] {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null) return [];
  const packages = (parsed as { packages?: unknown }).packages;
  if (!Array.isArray(packages)) return [];
  const sources: string[] = [];
  for (const entry of packages) {
    if (typeof entry === "string") sources.push(entry);
    else if (typeof entry === "object" && entry !== null && typeof (entry as { source?: unknown }).source === "string") {
      sources.push((entry as { source: string }).source);
    }
  }
  return sources;
}

/**
 * The union of the package sources declared across the `settings.json` files Pi
 * reads, deduplicated: Pi dedupes a package configured in both scopes, so a
 * source declared twice is one package, not two.
 */
export function readInstalledPackageSourcesFrom(paths: readonly string[]): string[] {
  const sources = new Set<string>();
  for (const path of paths) {
    for (const source of readInstalledPackageSources(path)) sources.add(source);
  }
  return [...sources];
}

/**
 * Whether the collected package sources name the native Engram Pi package.
 * The match is a substring of the declared source so a version pin
 * (`npm:gentle-engram@0.7.0`) and a local checkout path both count: the
 * question is whether the native extension exists, not which release it is.
 */
export function isNativeEngramPackage(sources: readonly string[]): boolean {
  return sources.some((source) => source.includes("gentle-engram"));
}

function isNonBlank(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * The binary half of a broken report's evidence (issue #538 S7): the resolution
 * that failed, and how it failed. `ENGRAM_BIN`'s state is the whole difference
 * between "absent" and "unresolvable" — the two failures the old catch-all
 * could not tell apart — so a set override is quoted, and an unset one is said
 * to be unset instead of implying the operator never tried.
 */
function unresolvedBinaryClause(engramBin: string | null | undefined): string {
  const override = isNonBlank(engramBin) ? engramBin.trim() : null;
  if (override === null) {
    return (
      `no "engram" core binary was found: ${ENGRAM_BIN_VAR} is unset and no executable ` +
      `"engram" is on PATH`
    );
  }
  return (
    `no "engram" core binary was found: ${ENGRAM_BIN_VAR} names "${override}", which ` +
    `resolves to no executable file`
  );
}

/**
 * Every route that repairs an unresolved substrate (issue #538 S3). The
 * binary-vs-served version pair is named with the command that checks it and
 * never claimed as measured: this module probes nothing at session start (the
 * bounded probe for the first memory read is `memory probe`, and the pairing
 * table belongs to the doctor feature). The companion route is stated as what it
 * is — the extension, not the core binary — because following it cannot repair
 * a binary resolution.
 */
function unresolvedRepairRoutes(): string {
  return (
    `Repair it by one route: put the core binary on PATH, set ` +
    `${ENGRAM_BIN_VAR}=/absolute/path/to/engram, or point ${ENGRAM_URL_VAR} at a running Engram ` +
    `server (local or remote) — a set URL is joined instead of a local binary. If a server is ` +
    `already running, confirm the binary and the served version agree: \`engram --version\` ` +
    `against the version its /health endpoint reports — a server still running from a binary that ` +
    `was replaced or deleted is the usual cause of a stale memory layer. The Pi companion installs ` +
    `with: ${ENGRAM_INSTALL_ROUTE} — it is the extension, not the core binary, so installing it ` +
    `cannot fix this resolution.`
  );
}

/**
 * The leftover declaration beside a working native install. It is the one thing
 * that still breaks the native-only write guarantee Engram's own setup states, so
 * it is reported even when memory resolves (issue #531's reasoning, issue #538
 * D5's level: a working setup with a broken guarantee is a warning).
 */
function leftoverDeclaration(): string {
  return (
    ` An mcp.json Pi reads still declares "${ENGRAM_SERVER_NAME}": remove that entry and ` +
    `reload, or native-only agent writes are not guaranteed.`
  );
}

/**
 * Decide and perform the registration, in the order that makes the outcome
 * truthful: a config that cannot be read first (its consent is unknown, never
 * refused), then consent (never provision unasked), then the binary (never
 * register a server that cannot start), then the operator's own declaration
 * (never shadow it). Returns the report; it never throws and never mutates
 * anything beyond the injected `register` call.
 */
export function provisionEngram(input: EngramProvisionInput): EngramReport {
  const { consented, configInvalid, binaryPath, nativePackagePresent, engramUrl, engramBin, declaredNames, register } = input;

  if (configInvalid === true) {
    return {
      status: "config-invalid",
      notice: "error",
      message:
        `pi-agentic-workflow: Engram not registered — the package's config file is invalid, so ` +
        `its consent could not be read and nothing was written (fix the reported problems and ` +
        `the next session reads the switch again).`,
    };
  }

  if (!consented) {
    // Silent: an operator who does not want memory owes the report nothing (S4),
    // and the opt-in guidance is not a per-session line (S5). The message stays
    // as the contract a non-adapter caller reads back, and `notice` is what the
    // UI applies.
    return {
      status: "not-consented",
      notice: "silent",
      message:
        `pi-agentic-workflow: Engram not registered — set "memory": { "engram": true } in ` +
        // The switch is a BASE-config section: `loadConfig` merges it from this
        // file, and the extension file refuses `memory` as an unknown key. Naming
        // the extension file sent an operator to a file that cannot carry the
        // key, and the read-back named the wrong route (issue #531 S3a).
        `${BASE_CONFIG_FILE} to opt in (nothing was written).`,
    };
  }

  // Issue #531 AC1 — the native package wins over every MCP path: it already
  // exposes the mem_* tools, and Engram's own setup keeps agent writes
  // native-only. Issue #538 S2/S3/S6 — what the operator is owed depends on
  // whether that native stack can resolve its substrate: silence when it can
  // (the advisory this branch used to print read as "engram is not available" on
  // a working machine), one error naming the failed resolution when it cannot.
  if (nativePackagePresent === true) {
    const nativeInstalled =
      `pi-agentic-workflow: Engram MCP not registered — the native gentle-engram extension ` +
      `already provides the mem_* tools, so nothing was written (native-only agent writes).`;
    const leftover = declaredNames.includes(ENGRAM_SERVER_NAME);
    if (binaryPath === null && !isNonBlank(engramUrl)) {
      return {
        status: "native-active",
        notice: "error",
        message:
          `pi-agentic-workflow: Engram memory is not resolvable — the native gentle-engram ` +
          `extension is installed, but ${unresolvedBinaryClause(engramBin)}. ${ENGRAM_URL_VAR} ` +
          `is unset, so no running server answers for the memory layer either; nothing was ` +
          `written by this package. ${unresolvedRepairRoutes()}` +
          (leftover ? leftoverDeclaration() : ""),
      };
    }
    if (leftover) {
      return {
        status: "native-active",
        notice: "warning",
        message: nativeInstalled + leftoverDeclaration(),
      };
    }
    return { status: "native-active", notice: "silent", message: "" };
  }

  // Issue #531 AC2 — a set ENGRAM_URL is an externally managed (possibly
  // remote) server: a deliberate configuration, never a missing-binary defect.
  // MCP is stdio-only in core, so nothing is registered and the native tools
  // serve the memory.
  if (isNonBlank(engramUrl)) {
    return {
      status: "external-server",
      notice: "info",
      message:
        `pi-agentic-workflow: Engram MCP not registered — ${ENGRAM_URL_VAR} is set, so memory ` +
        `is served by the external Engram server and nothing was written (stdio MCP ` +
        `cannot target a URL; the native mem_* tools handle memory).`,
    };
  }

  if (binaryPath === null) {
    return {
      status: "binary-missing",
      notice: "error",
      message:
        `pi-agentic-workflow: Engram MCP not registered — ${unresolvedBinaryClause(engramBin)}. ` +
        `${ENGRAM_URL_VAR} is unset, so no running server answers for the memory layer either; ` +
        `nothing was written. ${unresolvedRepairRoutes()}`,
    };
  }

  if (register === null) {
    return {
      status: "unsupported-host",
      notice: "error",
      message:
        `pi-agentic-workflow: Engram not registered — this Pi host exposes no ` +
        `registerMcpServer, so the server was not added (nothing was written).`,
    };
  }

  if (declaredNames.includes(ENGRAM_SERVER_NAME)) {
    return {
      status: "already-declared",
      notice: "info",
      message:
        `pi-agentic-workflow: Engram not registered — "${ENGRAM_SERVER_NAME}" is already ` +
        `declared in an mcp.json Pi reads, which takes precedence (nothing was written).`,
    };
  }

  const config: EngramServerConfig = { command: binaryPath, args: [...ENGRAM_ARGS] };
  register(ENGRAM_SERVER_NAME, config);
  return {
    status: "registered",
    notice: "info",
    server: { name: ENGRAM_SERVER_NAME, ...config },
    message:
      `pi-agentic-workflow: registered MCP server "${ENGRAM_SERVER_NAME}" → ` +
      `${binaryPath} ${ENGRAM_ARGS.join(" ")} (session-scoped; Pi does not persist it)`,
  };
}
