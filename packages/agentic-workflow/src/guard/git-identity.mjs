/**
 * git-identity.mjs — Layer 2's commit half: refuse a commit whose resolved author
 * or committer is not the project's approved identity (issue #514 S3; moved into
 * the crate by unit 554).
 *
 * Layer 2 exists because Layer 1 (the pi guard, `guards/git-identity.ts`) cannot
 * see a process it did not launch: a test suite, a script, a `!` command, another
 * agent host. Three of the three recorded leaks in the repository this ships from
 * were produced that way, and every one of them was signed with the owner's key —
 * a valid signature says nothing about attribution.
 *
 * One profile, one file: `gitIdentity` in `.pi/agentic-workflow.json` (project)
 * over `$PI_CODING_AGENT_DIR/agentic-workflow.json` (global). The section's shape —
 * the enforce vocabulary, the approved facts, the signing policy, the
 * `agentGuard` defaults — is the part all three carriers share, so it lives here
 * and the pi guard imports `normalizeGitIdentity` instead of carrying a copy. The
 * push-range checker (`scripts/push-identity-check.mjs`) imports the same profile
 * reader and the same commit comparison, so "is this identity the one the project
 * approved?" has one implementation with two carriers.
 *
 * What the profile asks of a *commit* is a declared scope: the `commit*` values
 * run this check, the `push*` values leave it to the push-range check. Signing is
 * declared too — `required` refuses an unsigned commit, `allowed` (the default)
 * lets a machine whose signing key does not resolve commit (gpg selects by UID),
 * and `off` is the sign-off workflow that approves unsigned commits and refuses a
 * signed one. `signingKeys` is the per-machine form of `signingKey`.
 *
 * The rule is read-only by construction: it reads git config, reads the profile,
 * and prints. It never repairs, never rewrites, never retries — the repair text it
 * prints is the operator's to run.
 *
 * exit: 0 the commit may proceed (or the project enforces nothing on commit);
 *       1 the identity, the signing key or the profile is not what the project
 *         approved — the commit is refused; 2 a usage error.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { BASE_CONFIG_FILE, normalizeGuard, parseJsonc } from "@gtrabanco/agentic-workflow-schema";

/** The base config file both scopes carry (the pipeline's one config file) — the
 *  schema package's published const (owner: `vocabulary-residency@1`). */
export { BASE_CONFIG_FILE };

/** The enforce vocabulary, in the order the refusal lists it. */
export const ENFORCE_VALUES = Object.freeze([
  "off",
  "commit",
  "push",
  "push-upstream",
  "commit-and-push",
  "commit-and-push-upstream",
]);

/** The values whose **commit** half this module answers. */
export const COMMIT_ENFORCING = Object.freeze(["commit", "commit-and-push", "commit-and-push-upstream"]);

/** The values whose **push** half the push-range check answers. */
export const PUSH_ENFORCING = Object.freeze(["push", "push-upstream", "commit-and-push", "commit-and-push-upstream"]);

/** What a signature means here. `allowed` is the default and stays behaviour-neutral. */
export const SIGNING_POLICIES = Object.freeze(["required", "allowed", "off"]);

/** The two scopes' answers for the agent-side guard, whose defaults ship here so
 *  the pi extension and this module cannot disagree about "absent". */
export const DEFAULT_AGENT_MODE = "ask";

/**
 * The repair block every identity failure prints. These are the *correct* forms:
 * the 2026-11-03 repair ran `git config user.name --unset`, whose inverted argument
 * order sets the literal value "--unset" instead of unsetting anything.
 */
export const REPAIR_LINES = Object.freeze([
  "repair (never automatic):",
  "  git config --show-origin --get-all user.name",
  "  git config --show-origin --get-all user.email",
  "  git config --unset user.name    # only when a stale local value shadows the approved one",
  "  git var GIT_AUTHOR_IDENT",
  "  git var GIT_COMMITTER_IDENT",
]);

/** `$PI_CODING_AGENT_DIR`, else `~/.pi/agent` — the global scope's directory. */
export function globalAgentDir(env = process.env) {
  const configured = env.PI_CODING_AGENT_DIR;
  if (typeof configured === "string" && configured !== "") return configured;
  return path.join(env.HOME && env.HOME !== "" ? env.HOME : os.homedir(), ".pi", "agent");
}

/**
 * The `gitIdentity` section as every carrier reads it: absent keys take the
 * shipped value, so a project that never configures identity never blocks, and
 * the pi guard and this module answer the same object for the same bytes.
 *
 * The guard's disposition (issue #626) is not this section's: it is
 * `guard.gitIdentity.mode` in the same base file, resolved here through the
 * schema package's `normalizeGuard` so a typo can never silently allow the guard.
 * `agentGuard.mode` was the pre-#626 spelling; it is retired and inert.
 */
export function normalizeGitIdentity(value, guardValue) {
  const section = typeof value === "object" && value !== null ? value : {};
  const agentGuard = typeof section.agentGuard === "object" && section.agentGuard !== null ? section.agentGuard : {};
  const approved = typeof section.approved === "object" && section.approved !== null ? section.approved : {};
  return {
    enforce: ENFORCE_VALUES.includes(section.enforce) ? section.enforce : "off",
    approved,
    agentGuard: {
      mode: normalizeGuard(guardValue).gitIdentity,
      allow: Array.isArray(agentGuard.allow) ? agentGuard.allow.filter((entry) => typeof entry === "string") : [],
    },
  };
}

/** One guard's resolved disposition (`allow`/`deny`/`ask`), for a carrier that
 *  reads the section on its own — the receipt and tool-choice guards. */
export function guardDisposition(guardValue, name) {
  return normalizeGuard(guardValue)[name];
}

function readConfigFile(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return { present: false, value: null };
  }
  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    const failure = new Error(`${file}: ${parsed.error.message}`);
    failure.code = "config-unparseable";
    throw failure;
  }
  return { present: true, value: parsed.value };
}

/**
 * Resolve the `gitIdentity` section: global then project, per field, project wins.
 *
 * `sources` names the file each truth came from, so a failure can say where the
 * profile lives; `present` says whether any config file exists at all (a project
 * with none is inert, not refused).
 */
export function resolveIdentityProfile({ root, env = process.env } = {}) {
  const globalFile = path.join(globalAgentDir(env), BASE_CONFIG_FILE);
  const projectFile = path.join(root ?? process.cwd(), ".pi", BASE_CONFIG_FILE);
  const globalConfig = readConfigFile(globalFile);
  const projectConfig = readConfigFile(projectFile);
  const globalSection = typeof globalConfig.value?.gitIdentity === "object" && globalConfig.value.gitIdentity !== null ? globalConfig.value.gitIdentity : {};
  const projectSection = typeof projectConfig.value?.gitIdentity === "object" && projectConfig.value.gitIdentity !== null ? projectConfig.value.gitIdentity : {};
  const globalApproved = typeof globalSection.approved === "object" && globalSection.approved !== null ? globalSection.approved : {};
  const projectApproved = typeof projectSection.approved === "object" && projectSection.approved !== null ? projectSection.approved : {};
  const approved = { ...globalApproved, ...projectApproved };
  const declared = projectSection.enforce ?? globalSection.enforce;
  const named = Object.values(approved).some(
    (value) => typeof value === "string" && value !== "" && value !== undefined,
  );
  return {
    enforce: declared ?? "off",
    enforceDeclared: declared !== undefined,
    approved,
    named,
    present: globalConfig.present || projectConfig.present,
    sources: {
      global: globalFile,
      project: projectFile,
      profile: projectSection.approved !== undefined ? "project" : globalSection.approved !== undefined ? "global" : "none",
    },
  };
}

/** The `name <email>` a refusal prints for the approved profile. */
export function describeApproved(approved = {}) {
  const name = typeof approved.name === "string" && approved.name !== "" ? approved.name : "<any name>";
  const email = typeof approved.email === "string" && approved.email !== "" ? `<${approved.email}>` : "<any email>";
  return `${name} ${email}`;
}

function matches(value, expected) {
  if (typeof expected !== "string" || expected === "") return true;
  return String(value ?? "").toLowerCase() === expected.toLowerCase();
}

/** Whether one resolved identity carries the approved facts — only the declared
 *  ones are judged, so a profile that names a name and no email is legal. */
export function identityMatches(ident, approved = {}) {
  return matches(ident?.name, approved.name) && matches(ident?.email, approved.email);
}

/** Which identity facts of one commit fall outside the approved profile. */
export function commitViolations(commit, approved = {}) {
  const violations = [];
  for (const role of ["author", "committer"]) {
    const actual = commit[role] ?? {};
    if (!identityMatches(actual, approved)) violations.push({ role, actual });
  }
  return violations;
}

/** `  <role>: <name> <<email>>` — the line a refusal prints for an offender. */
export function describeViolation(violation) {
  return `  ${violation.role}: ${violation.actual.name ?? ""} <${violation.actual.email ?? ""}>`;
}

function query(argv, { cwd, env = process.env } = {}) {
  const result = spawnSync(argv[0], argv.slice(1), { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0 || result.error !== undefined) return null;
  return (result.stdout ?? "").replace(/\r?\n$/u, "");
}

/** Parse `git var`'s ident line: `Name <email> <epoch> <tz>`. */
export function parseIdent(line) {
  const text = String(line ?? "").trim();
  const open = text.indexOf(" <");
  const close = text.indexOf(">", open === -1 ? 0 : open);
  if (open === -1 || close === -1) return { name: "", email: "" };
  return { name: text.slice(0, open), email: text.slice(open + 2, close) };
}

/** The answer a refusal returns: the message lines and no exit code. */
function refusal(code, lines) {
  return { ok: false, code, lines };
}

const INERT = { ok: true };

/**
 * The commit half's decision.
 *
 * Every failure is a `{ok: false, code, lines}`; a pass (or a project that
 * enforces nothing on commit) is `{ok: true}`. The order is the shipped contract
 * and the tests pin it: an unreadable profile is refused before the scope is read,
 * a broken declaration is refused before the identity is judged, and the signing
 * policy is judged last because a valid identity with an unreachable key is still
 * a commit the operator cannot reproduce.
 */
export function evaluateCommitIdentity({ root = process.cwd(), env = process.env } = {}) {
  let profile;
  try {
    profile = resolveIdentityProfile({ root, env });
  } catch (error) {
    return refusal("unparseable-profile", [
      `${error.message} is not valid JSON/JSONC; the approved identity cannot be read, so the commit is refused`,
    ]);
  }
  // No profile anywhere: the hook is inert, so installing the scaffold never blocks
  // a project that never configured identity.
  if (!profile.present) return INERT;
  if (!ENFORCE_VALUES.includes(profile.enforce)) {
    return refusal("invalid-enforce", [
      `gitIdentity.enforce is "${profile.enforce}", which is not ${listSentence(ENFORCE_VALUES)}`,
    ]);
  }
  if (!COMMIT_ENFORCING.includes(profile.enforce)) return INERT;

  const approved = profile.approved;
  if (!profile.named) {
    return refusal("no-approved-identity", [
      `gitIdentity.enforce is "${profile.enforce}" but gitIdentity.approved declares no name or email; declare the approved identity or set enforce to off`,
    ]);
  }

  // The resolved identity, per role. A git that cannot answer is refused, never
  // assumed: an unverified identity is not an approved one.
  for (const [role, variable] of [
    ["author", "GIT_AUTHOR_IDENT"],
    ["committer", "GIT_COMMITTER_IDENT"],
  ]) {
    const line = query(["git", "var", variable], { cwd: root, env });
    if (line === null) {
      return refusal(`git-var-${role}`, [
        `git var ${variable} failed; the identity cannot be verified, so the commit is refused`,
      ]);
    }
    const ident = parseIdent(line);
    if (!identityMatches(ident, approved)) {
      return refusal(`identity-${role}`, [
        `the resolved ${role} is not the approved identity`,
        describeViolation({ role, actual: ident }),
        `  approved: ${describeApproved(approved)}`,
        ...REPAIR_LINES,
      ]);
    }
  }

  // The signing policy: `required`, `allowed` (the default) or `off`.
  const signing = approved.signing ?? "allowed";
  if (!SIGNING_POLICIES.includes(signing)) {
    return refusal("invalid-signing", [
      `gitIdentity.approved.signing is "${signing}", which is not required, allowed or off`,
    ]);
  }
  const gpgsign = query(["git", "config", "--get", "commit.gpgsign"], { cwd: root, env });

  if (signing === "off") {
    // The sign-off workflow: the project approves unsigned commits, so a signed one
    // is the surprise this check exists to name.
    if (gpgsign === "true") {
      return refusal("signing-off-but-signed", [
        'gitIdentity.approved.signing is "off" but commit.gpgsign is true; this project approves unsigned commits — disable signing for this repository',
        ...REPAIR_LINES,
      ]);
    }
    return INERT;
  }

  if (signing === "required" && gpgsign !== "true") {
    return refusal("signing-required-but-unsigned", [
      'gitIdentity.approved.signing is "required" but commit.gpgsign is not true; the commit would carry no signature',
      ...REPAIR_LINES,
    ]);
  }

  if (gpgsign !== "true") return INERT;

  const format = query(["git", "config", "--get", "gpg.format"], { cwd: root, env }) || "openpgp";
  const resolvedKey = query(["git", "config", "--get", "user.signingKey"], { cwd: root, env });
  const approvedFormat = typeof approved.format === "string" ? approved.format : "";

  if (approvedFormat !== "" && approvedFormat !== format) {
    return refusal("signing-format", [`signing format is "${format}" but the approved format is "${approvedFormat}"`]);
  }

  if (resolvedKey === null || resolvedKey === "") {
    // `allowed` is the second-machine case: git resolves the key from the keyring by
    // UID, so an unset user.signingKey is not a broken configuration.
    if (signing === "required") {
      return refusal("signing-key-missing", [
        "commit.gpgsign is true but no user.signingKey is configured; the commit would fail or sign with an unapproved key",
        ...REPAIR_LINES,
      ]);
    }
    return INERT;
  }

  const approvedFullName = typeof approved.fullName === "string" ? approved.fullName : "";

  if (format === "ssh") {
    const keyPath = resolvedKey.startsWith("~") ? path.join(env.HOME ?? os.homedir(), resolvedKey.slice(1)) : resolvedKey;
    if (!isFile(keyPath)) {
      return refusal("signing-ssh-key-missing", [
        `commit.gpgsign is true and the SSH signing key "${resolvedKey}" does not exist`,
        ...REPAIR_LINES,
      ]);
    }
    if (approvedFullName !== "") {
      return refusal("signing-fullname-unverifiable", [
        `gitIdentity.approved.fullName cannot be verified against an SSH key (${resolvedKey}); declare the approved key in signingKey instead, or set enforce to off`,
      ]);
    }
  } else {
    if (query(["gpg", "--version"], { cwd: root, env }) === null) {
      return refusal("signing-gpg-missing", [
        "commit.gpgsign is true and gpg is not installed; the signing key cannot be verified, so the commit is refused",
      ]);
    }
    if (query(["gpg", "--list-secret-keys", "--with-colons", resolvedKey], { cwd: root, env }) === null) {
      return refusal("signing-key-not-in-keyring", [
        `commit.gpgsign is true and the signing key "${resolvedKey}" is not in the secret keyring`,
        ...REPAIR_LINES,
      ]);
    }
    if (approvedFullName !== "") {
      const listing = query(["gpg", "--list-keys", "--with-colons", resolvedKey], { cwd: root, env }) ?? "";
      const uids = listing
        .split("\n")
        .filter((line) => line.startsWith("uid:"))
        .map((line) => line.split(":")[9] ?? "");
      if (!uids.some((uid) => uid.toLowerCase().includes(approvedFullName.toLowerCase()))) {
        return refusal("signing-uid-mismatch", [
          `the signing key's UID does not carry the approved full name "${approvedFullName}"`,
        ]);
      }
    }
  }

  // One key or many (one per machine): the resolved key must match any declared.
  const declaredKeys = [
    ...(Array.isArray(approved.signingKeys) ? approved.signingKeys.filter((entry) => typeof entry === "string") : []),
    ...(typeof approved.signingKey === "string" && approved.signingKey !== "" ? [approved.signingKey] : []),
  ];
  if (declaredKeys.length > 0) {
    const resolved = resolvedKey.toLowerCase();
    if (!declaredKeys.some((candidate) => resolved.includes(candidate.toLowerCase()))) {
      return refusal("signing-key-not-approved", [
        `the resolved signing key "${resolvedKey}" is not one of the approved keys: ${declaredKeys.join(" ")}`,
        ...REPAIR_LINES,
      ]);
    }
  }

  return INERT;
}

function listSentence(values) {
  if (values.length <= 1) return values.join("");
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}

function isFile(target) {
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}

const USAGE =
  "usage: agentic-workflow git-identity-check [--root <dir>] [--help]\n\n" +
  "  --root <dir>  the checkout to judge (default: the git working-tree top, else cwd)\n" +
  "  --help        print this usage and exit 0\n";

/** `main(argv)` — the pre-commit hook's face. Prints the refusal on stderr. */
export function main(argv, { env = process.env, stderr = (text) => process.stderr.write(text), stdout = (text) => process.stdout.write(text) } = {}) {
  let root = "";
  const rest = [...argv];
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--help") {
      stdout(USAGE);
      return 0;
    }
    if (arg === "--root") {
      const value = rest.shift();
      if (value === undefined) {
        stderr(`agentic-workflow git identity: --root needs a value\n`);
        stderr(USAGE);
        return 2;
      }
      root = value;
      continue;
    }
    stderr(`agentic-workflow git identity: unknown argument: ${arg}\n`);
    stderr(USAGE);
    return 2;
  }
  if (root === "") {
    // A pre-commit hook runs at the working tree's top; a manual run may not, so the
    // top is asked for and the cwd is the honest fallback.
    root = query(["git", "rev-parse", "--show-toplevel"], { env }) ?? process.cwd();
  }
  const verdict = evaluateCommitIdentity({ root, env });
  if (verdict.ok) return 0;
  // The first line carries the prefix; the detail lines and the repair block print
  // as the operator's own commands, exactly as the shipped hook printed them.
  verdict.lines.forEach((line, index) => {
    stderr(index === 0 ? `agentic-workflow git identity: ${line}\n` : `${line}\n`);
  });
  return 1;
}
