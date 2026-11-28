// git-identity.hook.test.mjs — Layer 2's commit half, now a crate module the
// pre-commit shim execs (unit 554).
//
// The matrix is the retired shell suite's (test-git-identity-check.sh): the inert
// cases, the misattribution cases, the signing policy, the per-machine keys and
// the two read-only assertions. Every fixture is a throwaway repository and every
// identity is passed through the environment, so no case writes git configuration.
//
// The `jq` precondition the shell suite asserted is retired with the shell's jq
// dependency (its analogue — a hook whose CLI is absent — lives in
// `hook-shims.test.mjs`), and the profile reader is pinned here as one rule for
// the hook, the pi guard and the push-range checker.

import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { normalizeGitIdentity, parseIdent, resolveIdentityProfile } from "../src/guard/git-identity.mjs";

const scratch = mkdtempSync(path.join(os.tmpdir(), "aw-identity-suite-"));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const CLI = path.join(REPO_ROOT, "packages/agentic-workflow/bin/agentic-workflow.mjs");
const SHIM = path.join(REPO_ROOT, "template/.agentic-workflow/hooks/git-identity-check.sh");

const GIT_CONFIG = ["-c", "user.email=t@example.com", "-c", "user.name=test", "-c", "commit.gpgsign=false"];
const APPROVED = { name: "Fixture Human", email: "human@example.com" };
const LEAK = { name: "t", email: "t@example.test" };

function git(cwd, ...args) {
  const result = spawnSync("git", [...GIT_CONFIG, "-C", cwd, ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

/** A fixture checkout with one seed commit and an empty `.pi` directory. */
function fixture(t) {
  const root = mkdtempSync(path.join(scratch, "repo-"));
  const home = mkdtempSync(path.join(scratch, "home-"));
  t.after(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  });
  spawnSync("git", ["init", "-q", "-b", "main", root], { encoding: "utf8" });
  writeFileSync(path.join(root, "seed.txt"), "seed\n");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "seed");
  mkdirSync(path.join(root, ".pi"), { recursive: true });
  return { root, home };
}

/** Write the project profile, either as JSON or as the documented JSONC. */
function profile(repo, section, { jsonc = false } = {}) {
  const body = jsonc
    ? ['{', '  // the approved identity', '  "gitIdentity": {', `    "enforce": "${section.enforce}",`, "    /* declared facts */", `    "approved": ${JSON.stringify(section.approved)}`, "  }", "}", ""].join("\n")
    : `${JSON.stringify({ gitIdentity: section }, null, 2)}\n`;
  writeFileSync(path.join(repo.root, ".pi", "agentic-workflow.json"), body);
}

/** Run the hook through the CLI face with one identity and optional git config. */
function runHook(repo, identity, { config = {}, entry = CLI, extraArgv = [], env = {} } = {}) {
  const configEnv = {};
  const pairs = Object.entries(config);
  if (pairs.length > 0) {
    configEnv.GIT_CONFIG_COUNT = String(pairs.length);
    pairs.forEach(([key, value], index) => {
      configEnv[`GIT_CONFIG_KEY_${index}`] = key;
      configEnv[`GIT_CONFIG_VALUE_${index}`] = value;
    });
  }
  return spawnSync(process.execPath, [entry, "git-identity-check", ...extraArgv], {
    cwd: repo.root,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: repo.home,
      PI_CODING_AGENT_DIR: repo.home,
      GIT_AUTHOR_NAME: identity.name,
      GIT_AUTHOR_EMAIL: identity.email,
      GIT_COMMITTER_NAME: identity.name,
      GIT_COMMITTER_EMAIL: identity.email,
      ...configEnv,
      ...env,
    },
  });
}

test("normalizeGitIdentity fills the shipped defaults", () => {
  assert.deepEqual(normalizeGitIdentity(undefined, undefined), { enforce: "off", approved: {}, agentGuard: { mode: "ask", allow: [] } });
  assert.deepEqual(normalizeGitIdentity({ enforce: "commit", approved: { name: "x" }, agentGuard: { allow: ["user.name", 7] } }, { gitIdentity: { mode: "deny" } }), {
    enforce: "commit",
    approved: { name: "x" },
    agentGuard: { mode: "deny", allow: ["user.name"] },
  });
  assert.equal(normalizeGitIdentity({ enforce: "nope" }).enforce, "off", "an unknown scope is refused elsewhere, never silently honoured");
});

test("the identity guard's disposition comes from the guard section (issue #626)", () => {
  // The global default governs when the guard declares nothing.
  assert.equal(normalizeGitIdentity({}, { default: "allow" }).agentGuard.mode, "allow");
  // The guard's own entry wins over the default.
  assert.equal(normalizeGitIdentity({}, { default: "allow", gitIdentity: { mode: "deny" } }).agentGuard.mode, "deny");
  // A foreign value is never honoured: the shipped ask stands.
  assert.equal(normalizeGitIdentity({}, { gitIdentity: { mode: "block" } }).agentGuard.mode, "ask");
  // A written `agentGuard.mode` is a retired key and has no effect.
  assert.equal(normalizeGitIdentity({ agentGuard: { mode: "block" } }, undefined).agentGuard.mode, "ask");
});

test("resolveIdentityProfile merges global over project, per field", (t) => {
  const repo = fixture(t);
  writeFileSync(path.join(repo.home, "agentic-workflow.json"), `${JSON.stringify({ gitIdentity: { enforce: "push", approved: { name: "Global Human", signing: "allowed" } } })}\n`);
  profile(repo, { enforce: "commit", approved: { email: "project@example.com" } });
  const resolved = resolveIdentityProfile({ root: repo.root, env: { PI_CODING_AGENT_DIR: repo.home } });
  assert.equal(resolved.enforce, "commit", "the project's scope wins");
  assert.deepEqual(resolved.approved, { name: "Global Human", signing: "allowed", email: "project@example.com" });
  assert.equal(resolved.named, true);
  assert.equal(resolved.sources.profile, "project");
});

test("parseIdent reads git's ident line", () => {
  assert.deepEqual(parseIdent("Fixture Human <human@example.com> 1794930169 +0000"), APPROVED);
  assert.deepEqual(parseIdent(""), { name: "", email: "" });
});

test("no profile anywhere: the hook is inert", (t) => {
  const repo = fixture(t);
  const result = runHook(repo, LEAK);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
});

test("a matching name and email pass", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: APPROVED });
  assert.equal(runHook(repo, APPROVED).status, 0);
});

test("a misattributed author is refused with the repair block", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: APPROVED });
  const result = runHook(repo, LEAK);
  assert.equal(result.status, 1);
  const output = result.stderr;
  assert.match(output, /the resolved author is not the approved identity/u);
  assert.match(output, /author: t <t@example\.test>/u);
  assert.match(output, /git config --show-origin --get-all user\.name/u);
  assert.match(output, /git config --unset user\.name/u);
  assert.match(output, /git var GIT_AUTHOR_IDENT/u);
  assert.doesNotMatch(output, /user\.name --unset/u, "the inverted repair form is never suggested");
});

test("a misattributed committer is refused and named", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: APPROVED });
  const result = spawnSync(process.execPath, [CLI, "git-identity-check"], {
    cwd: repo.root,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: repo.home,
      PI_CODING_AGENT_DIR: repo.home,
      GIT_AUTHOR_NAME: APPROVED.name,
      GIT_AUTHOR_EMAIL: APPROVED.email,
      GIT_COMMITTER_NAME: LEAK.name,
      GIT_COMMITTER_EMAIL: LEAK.email,
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /committer: t <t@example\.test>/u);
});

test("enforce=push leaves the commit hook inert", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "push", approved: APPROVED });
  assert.equal(runHook(repo, LEAK).status, 0);
});

test("enforce=commit with no approved facts fails closed", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: {} });
  const result = runHook(repo, LEAK);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /declares no name or email/u);
});

test("an unknown enforce value is refused, and the refusal lists the legal ones", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "always", approved: APPROVED });
  const result = runHook(repo, LEAK);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /push-upstream/u);
});

test("a JSONC profile is read", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: APPROVED }, { jsonc: true });
  assert.equal(runHook(repo, APPROVED).status, 0);
});

test("an unparseable profile is refused, never read as no profile", (t) => {
  const repo = fixture(t);
  writeFileSync(path.join(repo.root, ".pi", "agentic-workflow.json"), '{ "gitIdentity": { "enforce": "commit", }\n');
  const result = runHook(repo, APPROVED);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not valid JSON/u);
});

test("signing required with no user.signingKey is refused", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: { ...APPROVED, signing: "required" } });
  const result = runHook(repo, APPROVED, { config: { "commit.gpgsign": "true" } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no user\.signingKey/u);
});

test("signing on with an absent SSH key is refused; a present one passes", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: { ...APPROVED, format: "ssh" } });
  const missing = runHook(repo, APPROVED, { config: { "commit.gpgsign": "true", "gpg.format": "ssh", "user.signingKey": "/nope/key.pub" } });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /does not exist/u);

  const key = path.join(repo.root, "id_ed25519.pub");
  writeFileSync(key, "ssh-ed25519 AAAA fixture\n");
  assert.equal(runHook(repo, APPROVED, { config: { "commit.gpgsign": "true", "gpg.format": "ssh", "user.signingKey": key } }).status, 0);
});

test("an unverifiable fullName is refused against an SSH key, never ignored", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: { ...APPROVED, format: "ssh", fullName: "Fixture Human" } });
  const key = path.join(repo.root, "id_ed25519.pub");
  writeFileSync(key, "ssh-ed25519 AAAA fixture\n");
  const result = runHook(repo, APPROVED, { config: { "commit.gpgsign": "true", "gpg.format": "ssh", "user.signingKey": key } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cannot be verified against an SSH key/u);
});

test("the declared per-machine keys decide: any match passes, none refuses", (t) => {
  const repo = fixture(t);
  // The resolved key is compared as a substring of any declared key, so an SSH key
  // path carrying its fingerprint is a legal fixture and needs no keyring.
  const key = path.join(repo.root, "key-SHA256:bbb");
  writeFileSync(key, "ssh-ed25519 AAAA fixture\n");
  const config = { "commit.gpgsign": "true", "gpg.format": "ssh", "user.signingKey": key };

  profile(repo, { enforce: "commit", approved: { ...APPROVED, format: "ssh", signingKeys: ["SHA256:aaa", "SHA256:bbb"] } });
  assert.equal(runHook(repo, APPROVED, { config }).status, 0);

  profile(repo, { enforce: "commit", approved: { ...APPROVED, format: "ssh", signingKeys: ["SHA256:zzz"] } });
  const refused = runHook(repo, APPROVED, { config });
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /is not one of the approved keys/u);
  assert.match(refused.stderr, /SHA256:zzz/u);
});

test("the signing policy `off` accepts an unsigned commit and refuses a signed one", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: { ...APPROVED, signing: "off" } });
  assert.equal(runHook(repo, APPROVED).status, 0);
  const signed = runHook(repo, APPROVED, { config: { "commit.gpgsign": "true" } });
  assert.equal(signed.status, 1);
  assert.match(signed.stderr, /approves unsigned commits/u);
});

test("signing required refuses an unsigned commit", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: { ...APPROVED, signing: "required" } });
  const result = runHook(repo, APPROVED, { config: { "commit.gpgsign": "false" } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /would carry no signature/u);
});

test("signing on with no declared policy and no key passes (gpg selects by UID)", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: APPROVED });
  const result = runHook(repo, APPROVED, { config: { "commit.gpgsign": "true" } });
  assert.equal(result.status, 0, result.stderr);
});

test("an unknown signing policy is refused, never ignored", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: { ...APPROVED, signing: "sometimes" } });
  const result = runHook(repo, APPROVED);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not required, allowed or off/u);
});

test("a failing check writes nothing: the profile keeps its bytes and git config is untouched", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: APPROVED });
  const profilePath = path.join(repo.root, ".pi", "agentic-workflow.json");
  const before = readFileSync(profilePath, "utf8");
  const configBefore = spawnSync("git", ["config", "--local", "--list"], { cwd: repo.root, encoding: "utf8" }).stdout;
  assert.equal(runHook(repo, LEAK).status, 1);
  assert.equal(readFileSync(profilePath, "utf8"), before);
  assert.equal(spawnSync("git", ["config", "--local", "--list"], { cwd: repo.root, encoding: "utf8" }).stdout, configBefore);
});

test("the shim answers exactly what the CLI answers", (t) => {
  const repo = fixture(t);
  profile(repo, { enforce: "commit", approved: APPROVED });
  const cli = runHook(repo, LEAK);
  const shim = spawnSync("bash", [SHIM], {
    cwd: repo.root,
    encoding: "utf8",
    env: {
      ...process.env,
      AGENTIC_WORKFLOW_BIN: CLI,
      HOME: repo.home,
      PI_CODING_AGENT_DIR: repo.home,
      GIT_AUTHOR_NAME: LEAK.name,
      GIT_AUTHOR_EMAIL: LEAK.email,
      GIT_COMMITTER_NAME: LEAK.name,
      GIT_COMMITTER_EMAIL: LEAK.email,
    },
  });
  assert.equal(shim.status, cli.status);
  assert.equal(shim.stderr, cli.stderr);
});

test("the CLI's usage errors are its own", (t) => {
  const repo = fixture(t);
  for (const args of [["--nope"], ["--root"]]) {
    const result = spawnSync(process.execPath, [CLI, "git-identity-check", ...args], { cwd: repo.root, encoding: "utf8" });
    assert.equal(result.status, 2, args.join(" "));
    assert.match(result.stderr, /agentic-workflow git identity:/u);
  }
  assert.equal(spawnSync(process.execPath, [CLI, "git-identity-check", "--help"], { cwd: repo.root, encoding: "utf8" }).status, 0);
});

test("a root that exists but carries no profile is inert", (t) => {
  const repo = fixture(t);
  const elsewhere = mkdtempSync(path.join(scratch, "elsewhere-"));
  t.after(() => rmSync(elsewhere, { recursive: true, force: true }));
  rmSync(path.join(repo.root, ".pi"), { recursive: true, force: true });
  const result = runHook(repo, LEAK, { extraArgv: ["--root", elsewhere] });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(path.join(elsewhere, ".pi")), false);
});

test("a scratch fixture never leaks a signing key into the checkout", () => {
  // The suite writes its keys under the fixture root; this asserts the shape the
  // shell suite pinned — no key file is created outside a throwaway directory.
  assert.equal(existsSync(path.join(REPO_ROOT, "id_ed25519.pub")), false);
});

test("the profile is found at .jsonc and .json5, and the refusal names the real file (issue #740 S2)", (t) => {
  for (const name of ["agentic-workflow.jsonc", "agentic-workflow.json5"]) {
    const repo = fixture(t);
    const file = path.join(repo.root, ".pi", name);
    writeFileSync(file, '{ gitIdentity: { enforce: "commit", approved: { name: "Fixture Human" } } }\n');
    const resolved = resolveIdentityProfile({ root: repo.root, env: { PI_CODING_AGENT_DIR: repo.home } });
    assert.equal(resolved.enforce, "commit", name);
    assert.equal(resolved.named, true, name);
    assert.equal(resolved.sources.project, file, "the source is the file that was read");
  }
});
