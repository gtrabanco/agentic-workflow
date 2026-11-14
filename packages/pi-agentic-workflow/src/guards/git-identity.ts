/**
 * The agent-side git identity guard (issue #514 S2, Layer 1).
 *
 * The failure it prevents, recorded three times in nine days on the repository
 * this ships from: an agent set a deliberate identity, a test suite's `git
 * config` write leaked a fixture identity into the shared checkout, and the
 * documented repair ran the arguments inverted (`git config user.name --unset`
 * *sets* the literal value `--unset`). All three produced commits that were
 * signed with the owner's key and carried someone else's name — a valid
 * signature says nothing about attribution, so nothing downstream noticed.
 *
 * The guard is a decision, not a sandbox: it reads the command a model asked
 * bash to run, finds the `git config` invocations in it, and answers allow /
 * ask / block. It deliberately preserves git's own identity layering — the
 * global default, `includeIf` per-project blocks, a consented repo-local value
 * and `-c` per invocation all keep working; only the *write* is questioned, and
 * a project can allow named writes in `gitIdentity.agentGuard.allow` without
 * disabling the guard. Non-identity git operations always pass: blocking
 * `git config` wholesale breaks hermetic fixtures, the docs-generated merge
 * driver and legitimate setup flows.
 *
 * Boundary, stated once and honestly: this sees what a model asks the bash tool
 * to run. A script the model launches, a `!`/`!!` user command, another agent
 * host, or a variable-indirection invocation (`c=config; git $c …`) is outside
 * it — Layer 2 (the pre-commit hook and the push-range check) exists for that.
 *
 * The tokenizer here is a second reader of the same shell shape as
 * `scripts/git-config-writes.mjs`, and it is *not* a copy of it: that gate asks
 * "does a test carrier write configuration at all?" over repository text, while
 * this module asks "which write is this, in which scope, and is the project's
 * approved identity affected?" over one command. Different questions, different
 * rules; only the statement/token split is shared.
 */

import { isAbsolute, normalize, resolve, sep } from "node:path";

export type GitConfigScope = "local" | "global" | "system" | "worktree" | "file";

/** One `git config` write, as the command line spells it. */
export interface GitConfigWrite {
  /** The verb or legacy flag that performs the write (`set`, `unset`, `--add`, …). */
  verb: string;
  /** The dotted key the write targets, when the command names one. */
  key: string | null;
  scope: GitConfigScope;
  /** The `--file`/`-f` target, only when `scope` is `file`. */
  file?: string;
}

export type GitIdentityEnforce = "off" | "commit" | "push" | "push-upstream" | "commit-and-push" | "commit-and-push-upstream";
export type GitIdentityAgentMode = "ask" | "block";

export interface GitIdentityApproved {
  name?: string;
  email?: string;
  fullName?: string;
  format?: "openpgp" | "ssh";
  signingKey?: string;
  /** The per-machine keys: a resolved key matching any of these is approved. */
  signingKeys?: string[];
  /** What a signature means here: required, allowed (default), or off (sign-off). */
  signing?: "required" | "allowed" | "off";
}

export interface GitIdentityAgentGuard {
  mode: GitIdentityAgentMode;
  allow: string[];
}

/** The base config section this guard reads (issue #514, `gitIdentity`). */
export interface GitIdentityConfig {
  enforce: GitIdentityEnforce;
  approved: GitIdentityApproved;
  agentGuard: GitIdentityAgentGuard;
}

export interface GitIdentityGuardOptions {
  mode: GitIdentityAgentMode;
  /** Config keys the project allows the agent to write, matched case-insensitively. */
  allow: readonly string[];
  /** Directories whose `--file` writes are hermetic fixture work. */
  scratchDirs: readonly string[];
  /** The working directory a relative `--file` resolves against. */
  cwd: string;
}

const ENFORCE_VALUES: readonly GitIdentityEnforce[] = ["off", "commit", "push", "push-upstream", "commit-and-push", "commit-and-push-upstream"];

/** The section as the extension reads it: absent keys take the shipped value. */
export function normalizeGitIdentity(value: unknown): GitIdentityConfig {
  const section = typeof value === "object" && value !== null ? (value as Partial<GitIdentityConfig>) : {};
  const agentGuard = (typeof section.agentGuard === "object" && section.agentGuard !== null ? section.agentGuard : {}) as Partial<GitIdentityAgentGuard>;
  const approved = section.approved;
  return {
    enforce: ENFORCE_VALUES.includes(section.enforce as GitIdentityEnforce) ? (section.enforce as GitIdentityEnforce) : "off",
    approved: typeof approved === "object" && approved !== null ? approved : {},
    agentGuard: {
      mode: agentGuard.mode === "block" ? "block" : DEFAULT_MODE,
      allow: Array.isArray(agentGuard.allow) ? agentGuard.allow.filter((entry): entry is string => typeof entry === "string") : [...DEFAULT_ALLOW],
    },
  };
}

export type GuardVerdict =
  | { action: "allow" }
  | { action: "ask" | "block"; write: GitConfigWrite; reason: string };

const DEFAULT_MODE: GitIdentityAgentMode = "ask";
const DEFAULT_ALLOW: readonly string[] = [];

/** The guard's options with the shipped defaults filled in. */
export function guardOptions(config: Partial<GitIdentityConfig> | undefined, cwd: string, scratchDirs: readonly string[]): GitIdentityGuardOptions {
  const agentGuard = config?.agentGuard ?? { mode: DEFAULT_MODE, allow: [] };
  return {
    mode: agentGuard.mode === "block" ? "block" : DEFAULT_MODE,
    allow: Array.isArray(agentGuard.allow) ? agentGuard.allow : DEFAULT_ALLOW,
    scratchDirs,
    cwd,
  };
}

/** The scratch roots `--file` writes may target: a fixture never leaks. */
export function scratchDirs(env: NodeJS.ProcessEnv = process.env): string[] {
  const candidates = [env.TMPDIR, env.TMP, env.TEMP, "/tmp", "/var/tmp"];
  const out: string[] = [];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate === "") continue;
    const normalized = normalize(candidate);
    if (!out.includes(normalized)) out.push(normalized);
  }
  return out;
}

/** Hard statement separators in a shell command line. */
const SEPARATORS = new Set([";", ";;", "&&", "||", "|", "&", "\n"]);

/** `git` options that consume the next word and may precede the subcommand. */
const GIT_VALUE_OPTIONS = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env"]);

/** `git config` options that consume the next word. */
const CONFIG_VALUE_OPTIONS = new Set(["--file", "-f", "--blob", "--type", "--default"]);

/** `git config` options that consume nothing. */
const CONFIG_FLAGS = new Set([
  "--global",
  "--system",
  "--local",
  "--worktree",
  "--fixed-value",
  "--all",
  "--includes",
  "--show-origin",
  "--show-scope",
  "--null",
  "-z",
]);

const READ_VERBS = new Set(["get", "list", "--get", "--get-all", "--get-regexp", "--get-color", "--get-colorbool", "--get-urlmatch", "--list", "-l"]);
const DESTRUCTIVE_VERBS = new Set(["unset", "unset-all", "remove-section", "rename-section", "edit", "--unset", "--unset-all", "--edit", "-e", "--remove-section", "--rename-section"]);
const WRITE_VERBS = new Set(["set", "--add", "--replace-all"]);

/**
 * Whether a key carries identity or signing meaning. A write to one of these is
 * the class this guard exists for; everything else is a project's own choice.
 */
export function isIdentityKey(key: string | null): boolean {
  if (key === null) return false;
  const lower = key.toLowerCase();
  return (
    lower.startsWith("user.") ||
    lower.startsWith("author.") ||
    lower.startsWith("committer.") ||
    lower.startsWith("gpg.") ||
    lower === "commit.gpgsign" ||
    lower === "tag.gpgsign"
  );
}

interface Token {
  value: string;
  quoted: boolean;
}

/**
 * Split a command line into statements of words. Quotes are honoured so a key or
 * a path with spaces survives; `#` starts a comment at a word boundary; the
 * separators end a statement. Command substitutions are split as their own
 * statements so `$(git config …)` is seen.
 */
export function tokenizeCommand(command: string): Token[][] {
  const statements: Token[][] = [];
  let current: Token[] = [];
  let word = "";
  let wordQuoted = false;
  let quote: string | null = null;

  const flushWord = () => {
    if (word !== "" || wordQuoted) {
      current.push({ value: word, quoted: wordQuoted });
      word = "";
      wordQuoted = false;
    }
  };
  const flushStatement = () => {
    flushWord();
    if (current.length > 0) statements.push(current);
    current = [];
  };

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    const next = command[index + 1];
    if (quote !== null) {
      if (char === quote) {
        quote = null;
        wordQuoted = true;
        continue;
      }
      if (char === "\\" && quote === '"' && next !== undefined) {
        word += next;
        index += 1;
        continue;
      }
      word += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      wordQuoted = true;
      continue;
    }
    if (char === "\\" && next !== undefined) {
      word += next;
      wordQuoted = true;
      index += 1;
      continue;
    }
    if (char === "#" && word === "") {
      while (index < command.length && command[index] !== "\n") index += 1;
      flushStatement();
      continue;
    }
    if (char === "(" || char === ")") {
      flushStatement();
      continue;
    }
    if (char === " " || char === "\t" || char === "\r") {
      flushWord();
      continue;
    }
    if (char === ";" || char === "|" || char === "&") {
      let separator = char;
      while (command[index + 1] === char) {
        separator += char;
        index += 1;
      }
      if (SEPARATORS.has(separator)) {
        flushStatement();
        continue;
      }
    }
    word += char;
  }
  flushStatement();
  return statements;
}

function firstNonOption(words: string[], start: number): number {
  let index = start;
  while (index < words.length) {
    const value = words[index];
    if (GIT_VALUE_OPTIONS.has(value)) {
      index += 2;
      continue;
    }
    if (value.startsWith("-")) {
      index += 1;
      continue;
    }
    return index;
  }
  return -1;
}

/**
 * The `git config` writes a command performs, in order. A read-only invocation,
 * a `-c` prefix and a non-config `git` subcommand contribute nothing.
 */
export function findGitConfigWrites(command: string): GitConfigWrite[] {
  const writes: GitConfigWrite[] = [];
  for (const statement of tokenizeCommand(command)) {
    const words = statement.map((token) => token.value);
    const gitIndex = words.indexOf("git");
    if (gitIndex < 0) continue;
    const subcommand = firstNonOption(words, gitIndex + 1);
    if (subcommand < 0 || words[subcommand] !== "config") continue;

    let scope: GitConfigScope = "local";
    let file: string | undefined;
    let cursor = subcommand + 1;
    // A file/display option may precede or follow the verb; collect both.
    const positional: string[] = [];
    while (cursor < words.length) {
      const word = words[cursor];
      if (CONFIG_VALUE_OPTIONS.has(word)) {
        const value = words[cursor + 1];
        if (word === "--file" || word === "-f") {
          scope = "file";
          file = value;
        }
        cursor += 2;
        continue;
      }
      if (word.startsWith("--type=") || word.startsWith("--file=")) {
        if (word.startsWith("--file=")) {
          scope = "file";
          file = word.slice("--file=".length);
        }
        cursor += 1;
        continue;
      }
      if (CONFIG_FLAGS.has(word)) {
        if (word === "--global") scope = "global";
        else if (word === "--system") scope = "system";
        else if (word === "--worktree") scope = "worktree";
        cursor += 1;
        continue;
      }
      positional.push(word);
      cursor += 1;
    }
    if (positional.length === 0) continue;
    const head = positional[0];
    if (READ_VERBS.has(head)) continue;
    // An explicit verb puts the key in the next slot; the implicit legacy form
    // (`git config user.email …`) puts it first.
    const explicit = DESTRUCTIVE_VERBS.has(head) || WRITE_VERBS.has(head);
    const verbName = explicit ? head : "set";
    const keySlot = explicit ? 1 : 0;
    const candidate = positional[keySlot];
    const key = candidate !== undefined && !candidate.startsWith("-") ? candidate : null;
    writes.push({ verb: verbName, key, scope, ...(file === undefined ? {} : { file }) });
  }
  return writes;
}

function isScratch(file: string | undefined, options: GitIdentityGuardOptions): boolean {
  if (file === undefined) return false;
  const target = isAbsolute(file) ? normalize(file) : resolve(options.cwd, file);
  return options.scratchDirs.some((dir) => target === dir || target.startsWith(dir.endsWith(sep) ? dir : `${dir}${sep}`));
}

const REPAIR = [
  "git config --show-origin --get-all user.name",
  "git config --show-origin --get-all user.email",
  "git var GIT_AUTHOR_IDENT",
];

function reasonFor(write: GitConfigWrite): string {
  const key = write.key ?? "<section>";
  if (write.scope === "global" || write.scope === "system") {
    return (
      `\`git config ${write.scope === "global" ? "--global" : "--system"} ${key} …\` writes a file shared by every repository on this machine. ` +
      `Keep the value scoped with \`--local\`, or pass it to one command with \`git -c ${key}=…\`. ` +
      `Diagnose with ${REPAIR.join(", ")}.`
    );
  }
  if (write.scope === "file" && write.file !== undefined) {
    return (
      `\`git config --file ${write.file} ${key} …\` writes a configuration file outside a scratch directory. ` +
      `A test fixture belongs under $TMPDIR; every other write belongs to the operator. ` +
      `Diagnose with ${REPAIR.join(", ")}.`
    );
  }
  if (write.scope === "worktree") {
    return `\`git config --worktree ${key} …\` changes the identity an entire worktree resolves. Diagnose with ${REPAIR.join(", ")}.`;
  }
  if (DESTRUCTIVE_VERBS.has(write.verb)) {
    return (
      `\`git config ${write.verb === "set" ? "" : `${write.verb} `}${key}\` removes or rewrites the value every later commit resolves. ` +
      `Put the operation first — \`git config --unset ${key}\`; with the key first git sets the literal value "--unset" instead of unsetting. ` +
      `Diagnose with ${REPAIR.join(", ")}.`
    );
  }
  return (
    `\`git config ${key} …\` rewrites the identity or signing configuration every later commit resolves — signature validity does not protect attribution. ` +
    `Read it with \`git config --show-origin --get-all ${key}\`, and pass a one-off value with \`git -c ${key}=… <command>\`.`
  );
}

/**
 * The decision for one command line. The first write that needs consent decides;
 * a command whose writes are all allowed (or that has none) passes untouched.
 */
export function decideGitConfigCall(command: string, options: GitIdentityGuardOptions): GuardVerdict {
  for (const write of findGitConfigWrites(command)) {
    if (questionFor(write, options) === null) continue;
    return { action: options.mode === "block" ? "block" : "ask", write, reason: reasonFor(write) };
  }
  return { action: "allow" };
}

/**
 * The reason a write needs consent, or null when it does not.
 *
 * Order matters and is the contract: a `--file` write inside a scratch directory
 * is hermetic fixture work and always passes; a scope escalation or a destructive
 * verb always asks — an allow-listed key does not open a shared file or a removal;
 * an allow-listed key passes only as a plain local write; and an identity or
 * signing key always asks.
 */
function questionFor(write: GitConfigWrite, options: GitIdentityGuardOptions): string | null {
  if (write.scope === "file" && isScratch(write.file, options)) return null;
  if (write.scope !== "local") return reasonFor(write);
  if (DESTRUCTIVE_VERBS.has(write.verb)) return reasonFor(write);
  const key = write.key?.toLowerCase() ?? null;
  if (key !== null && options.allow.some((allowed) => allowed.toLowerCase() === key)) return null;
  if (!isIdentityKey(key)) return null;
  return reasonFor(write);
}

/** The consent key a persisted approval is stored under: scope plus key. */
export function consentKey(write: GitConfigWrite): string {
  return `${write.scope}:${write.key ?? write.verb}`;
}

/** What the guard needs from a host to apply a decision (no Pi import here). */
export interface GuardHost {
  /** Whether the session can ask a human (`ctx.hasUI`). */
  interactive: boolean;
  /** The persisted, per-project approvals. */
  approved(key: string): boolean;
  /** Record an approval; false when persistence failed. */
  remember(key: string): boolean;
  /** Ask permission for one write. */
  confirm(question: string): Promise<boolean>;
  /** Say (once) that an approval is remembered. */
  notify(message: string, kind: "info" | "warning"): void;
}

export interface AppliedGuardVerdict {
  block: boolean;
  reason?: string;
}

/**
 * Apply the decision: a remembered approval passes, a headless session blocks
 * (fail closed — an unanswered prompt is not consent), and an interactive one
 * asks once and remembers the answer for this project.
 */
export async function applyGitIdentityGuard(command: string, options: GitIdentityGuardOptions, host: GuardHost): Promise<AppliedGuardVerdict> {
  for (const write of findGitConfigWrites(command)) {
    const question = questionFor(write, options);
    if (question === null) continue;

    const consent = consentKey(write);
    if (host.approved(consent)) continue;
    const reason = question;
    if (!host.interactive) {
      return {
        block: true,
        reason: `${reason} This session cannot ask, so the write is blocked (issue #514); the operator can allow it in \`gitIdentity.agentGuard.allow\` or run it themselves.`,
      };
    }
    const approvedNow = await host.confirm(`Allow this git configuration write?\n\n${reason}`);
    if (!approvedNow) return { block: true, reason: `Not approved: ${reason}` };
    if (host.remember(consent)) host.notify(`git identity guard: approved \`${consent}\` for this project from now on`, "info");
  }
  return { block: false };
}
