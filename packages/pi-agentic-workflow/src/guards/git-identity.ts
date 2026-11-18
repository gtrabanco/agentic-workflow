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
 * Two shapes the statement split has to get right, and does (issue #618): a
 * heredoc body is data — bash feeds it to the command's stdin and never runs it,
 * so a `git config` line quoted inside one is not a write; and a backtick span is
 * a command substitution, so its content is parsed as its own command wherever
 * it stands unquoted. What remains outside: a heredoc piped into an interpreter
 * (`bash <<'EOF' … EOF`), a substitution inside a double-quoted string (read as
 * data, the conservative direction), and the indirection above. Those identity
 * consequences are Layer 2's.
 *
 * The tokenizer here is a second reader of the same shell shape as
 * `scripts/git-config-writes.mjs`, and it is *not* a copy of it: that gate asks
 * "does a test carrier write configuration at all?" over repository text, while
 * this module asks "which write is this, in which scope, and is the project's
 * approved identity affected?" over one command. Different questions, different
 * rules; only the statement/token split is shared.
 */

import { isAbsolute, normalize, resolve, sep } from "node:path";

import {
  DEFAULT_AGENT_MODE,
  type GitIdentityAgentGuard,
  type GitIdentityAgentMode,
  type GitIdentityApproved,
  type GitIdentityConfig,
} from "@gtrabanco/agentic-workflow/src/guard/git-identity.mjs";

export type { GitIdentityAgentGuard, GitIdentityAgentMode, GitIdentityApproved, GitIdentityConfig };
export type { GitIdentityEnforce } from "@gtrabanco/agentic-workflow/src/guard/git-identity.mjs";
export { COMMIT_ENFORCING, DEFAULT_AGENT_MODE, ENFORCE_VALUES, normalizeGitIdentity } from "@gtrabanco/agentic-workflow/src/guard/git-identity.mjs";

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

/** What the guard needs to decide one command line (the pi-side options). */
export interface GitIdentityGuardOptions {
  mode: GitIdentityAgentMode;
  /** Config keys the project allows the agent to write, matched case-insensitively. */
  allow: readonly string[];
  /** Directories whose `--file` writes are hermetic fixture work. */
  scratchDirs: readonly string[];
  /** The working directory a relative `--file` resolves against. */
  cwd: string;
}

export type GuardVerdict =
  | { action: "allow" }
  | { action: "ask" | "block"; write: GitConfigWrite; reason: string };


/** The guard's options with the shipped defaults filled in. */
export function guardOptions(config: Partial<GitIdentityConfig> | undefined, cwd: string, scratchDirs: readonly string[]): GitIdentityGuardOptions {
  const agentGuard = config?.agentGuard ?? { mode: DEFAULT_AGENT_MODE, allow: [] };
  return {
    mode: agentGuard.mode === "block" ? "block" : DEFAULT_AGENT_MODE,
    allow: Array.isArray(agentGuard.allow) ? agentGuard.allow : [],
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

/** Whether a word is a `git config` action, the form that opens the modern argument list. */
function isActionWord(word: string): boolean {
  return READ_VERBS.has(word) || DESTRUCTIVE_VERBS.has(word) || WRITE_VERBS.has(word);
}

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
 * The end of a heredoc's body when the text carries one, or null.
 *
 * A heredoc is `<<` (never the `<<<` here-string) followed by a quoted or bare
 * delimiter, closed by a line that is exactly that delimiter — leading tabs
 * stripped for `<<-`. Bash feeds the body to the command's stdin and never runs
 * it, so the body is data (issue #618). A `<<` with no closing delimiter line
 * stays ordinary words: bash warns (`here-document delimited by end-of-file`)
 * and runs the command with the partial body instead of failing, so that text
 * is still tokenized as words — a write in it is over-detected, never missed.
 */
function readHeredoc(command: string, at: number): number | null {
  let cursor = at + 2;
  const stripTabs = command[cursor] === "-";
  if (stripTabs) cursor += 1;
  while (command[cursor] === " " || command[cursor] === "\t") cursor += 1;
  let delimiter = "";
  const delimiterQuote = command[cursor] === '"' || command[cursor] === "'" ? command[cursor] : null;
  if (delimiterQuote !== null) {
    cursor += 1;
    while (cursor < command.length && command[cursor] !== delimiterQuote) {
      if (command[cursor] === "\\" && delimiterQuote === '"') cursor += 1;
      delimiter += command[cursor] ?? "";
      cursor += 1;
    }
    if (command[cursor] !== delimiterQuote) return null;
    cursor += 1;
  } else {
    while (cursor < command.length && !/[\s;&|<>()]/.test(command[cursor])) {
      if (command[cursor] === "\\") cursor += 1;
      delimiter += command[cursor] ?? "";
      cursor += 1;
    }
  }
  if (delimiter === "") return null;
  const openerLineEnd = command.indexOf("\n", cursor);
  if (openerLineEnd < 0) return null;
  let lineStart = openerLineEnd + 1;
  while (lineStart <= command.length) {
    let lineEnd = command.indexOf("\n", lineStart);
    if (lineEnd < 0) lineEnd = command.length;
    const raw = command.slice(lineStart, lineEnd).replace(/\r$/, "");
    if ((stripTabs ? raw.replace(/^\t+/, "") : raw) === delimiter) return lineEnd < command.length ? lineEnd + 1 : command.length;
    if (lineEnd >= command.length) return null;
    lineStart = lineEnd + 1;
  }
  return null;
}

/**
 * Split a command line into statements of words. Quotes are honoured so a key or
 * a path with spaces survives; `#` starts a comment at a word boundary; a
 * newline and the separators end a statement, as bash runs them. Command
 * substitutions are split as their own statements so `$(git config …)` and a
 * backtick span are seen; a heredoc body is data and is skipped whole.
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
    // A heredoc body is data wherever its opener sits — an unquoted
    // `<<'EOF'`, and the same opener inside a quoted `"$(cat <<'EOF' …)"`,
    // which is the live-capture shape this reader has to survive.
    if (char === "<" && next === "<" && command[index + 2] !== "<") {
      const bodyEnd = readHeredoc(command, index);
      if (bodyEnd !== null) {
        flushStatement();
        index = bodyEnd - 1;
        continue;
      }
    }
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
    if (char === "\n") {
      flushStatement();
      continue;
    }
    if (char === " " || char === "\t" || char === "\r") {
      flushWord();
      continue;
    }
    if (char === "`") {
      // A backtick span is command substitution in bash: its content is its own
      // command. Inside a quoted string the same character is data and the
      // quote branch above has already consumed it.
      flushStatement();
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
    const positional: string[] = [];
    // Options are read only where git reads them: before the key in the legacy
    // grammar (`git config --global user.name <value>`), and before the key in
    // the modern one, where an action word (`set`, `get`, `unset`, …) opens the
    // argument list. Past the key every word is positional, which is why
    // `git config user.name --local` sets the literal value "--local".
    const optionsOpen = () => positional.length === 0 || (positional.length === 1 && isActionWord(positional[0]));
    while (cursor < words.length) {
      const word = words[cursor];
      if (!optionsOpen()) {
        positional.push(word);
        cursor += 1;
        continue;
      }
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
    // (`git config user.email …`) puts it first. Git prints the value for one
    // positional — a read, exit 1 when unset — and only two or more are the
    // legacy write, the second one the value (issue #618).
    const explicit = DESTRUCTIVE_VERBS.has(head) || WRITE_VERBS.has(head);
    if (!explicit && positional.length < 2) continue;
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
