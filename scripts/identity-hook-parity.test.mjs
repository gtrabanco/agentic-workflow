#!/usr/bin/env node
/**
 * identity-hook-parity.test.mjs — one contract, two implementations, one corpus
 * (issue #514 S3/S4).
 *
 * Layer 2 has two carriers and they cannot share code: the commit hook is a bash
 * script a target project installs into `.git/hooks/` (it may not shell out to a
 * node CLI that the project does not have), and the push-range check is a repo
 * script. Two implementations of "is this identity the one the project
 * approved?" drift the moment one of them learns a rule the other does not.
 *
 * So they are held to the same corpus: the same fixture repository, the same
 * profile file, the same identity, and an assertion that both answer the same
 * verdict — plus the rows where the split is deliberate (`enforce: commit` is
 * the hook's half, `enforce: push` is the checker's half), asserted as an
 * asymmetry so it cannot silently become agreement or a gap.
 *
 * Every fixture identity is passed with `-c`, so this suite writes no git
 * configuration (issue #514 S7).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HOOK = path.join(ROOT, "template", ".agentic-workflow", "hooks", "git-identity-check.sh");
const CHECKER = path.join(HERE, "push-identity-check.mjs");

const APPROVED = { name: "Fixture Human", email: "human@example.com" };
const LEAK = { name: "t", email: "t@example.test" };

/** `<enforce> | <approved json> | <commit identity> | <expected>` where expected
 *  is `<hook exit>+<checker exit>`; `-` means "the carrier is not responsible". */
const CORPUS = [
  { label: "both halves agree on a matching identity", enforce: "commit-and-push", approved: APPROVED, identity: APPROVED, hook: 0, checker: 0 },
  { label: "both halves agree a name is wrong", enforce: "commit-and-push", approved: APPROVED, identity: LEAK, hook: 1, checker: 1 },
  { label: "both halves agree an email is wrong", enforce: "commit-and-push", approved: APPROVED, identity: { name: APPROVED.name, email: LEAK.email }, hook: 1, checker: 1 },
  { label: "no profile is inert in both", enforce: null, approved: null, identity: LEAK, hook: 0, checker: 0 },
  { label: "enforce=off is inert in both", enforce: "off", approved: APPROVED, identity: LEAK, hook: 0, checker: 0 },
  { label: "enforce=commit is the hook's half only", enforce: "commit", approved: APPROVED, identity: LEAK, hook: 1, checker: 0 },
  { label: "enforce=push is the checker's half only", enforce: "push", approved: APPROVED, identity: LEAK, hook: 0, checker: 1 },
  { label: "only the declared facts are checked — name only", enforce: "commit-and-push", approved: { name: APPROVED.name }, identity: { name: APPROVED.name, email: LEAK.email }, hook: 0, checker: 0 },
  { label: "only the declared facts are checked — email only", enforce: "commit-and-push", approved: { email: APPROVED.email }, identity: { name: LEAK.name, email: APPROVED.email }, hook: 0, checker: 0 },
];

function git(cwd, args, identity = APPROVED) {
  const result = spawnSync(
    "git",
    ["-c", `user.name=${identity.name}`, "-c", `user.email=${identity.email}`, "-c", "commit.gpgsign=false", ...args],
    { cwd, encoding: "utf8", env: { ...process.env, HOME: cwd } },
  );
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

function fixture(t, { enforce, approved, identity, jsonc = false }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "identity-parity-"));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "identity-parity-home-"));
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  });
  fs.writeFileSync(path.join(root, "seed.txt"), "seed\n");
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-qm", "seed"]);
  const base = git(root, ["rev-parse", "HEAD"]).trim();
  fs.writeFileSync(path.join(root, "change.txt"), "change\n");
  git(root, ["add", "-A"]);
  git(root, ["commit", "-qm", "change"], identity);

  if (enforce !== null) {
    fs.mkdirSync(path.join(root, ".pi"), { recursive: true });
    const section = { enforce, approved };
    const body = jsonc
      ? ["{", "  // the approved identity", '  "gitIdentity": {', `    "enforce": "${enforce}",`, "    /* declared facts */", `    "approved": ${JSON.stringify(approved)},`, "  },", "}", ""].join("\n")
      : JSON.stringify({ gitIdentity: section }, null, 2) + "\n";
    fs.writeFileSync(path.join(root, ".pi", "agentic-workflow.json"), body);
  }
  return { root, home, base, identity };
}

function runHook({ root, home, identity }) {
  return spawnSync("bash", [HOOK], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      PI_CODING_AGENT_DIR: home,
      GIT_AUTHOR_NAME: identity.name,
      GIT_AUTHOR_EMAIL: identity.email,
      GIT_COMMITTER_NAME: identity.name,
      GIT_COMMITTER_EMAIL: identity.email,
    },
  });
}

function runChecker({ root, home, base }) {
  return spawnSync(process.execPath, [CHECKER, "--root", root, "--base", base], {
    encoding: "utf8",
    env: { ...process.env, HOME: home, PI_CODING_AGENT_DIR: home },
  });
}

for (const row of CORPUS) {
  test(`parity — ${row.label}`, (t) => {
    const repo = fixture(t, row);
    const hook = runHook(repo);
    const checker = runChecker(repo);
    assert.equal(hook.status, row.hook, `hook: ${hook.stderr}`);
    assert.equal(checker.status, row.checker, `checker: ${checker.stdout}${checker.stderr}`);
  });
}

test("parity — a JSONC profile reads the same in both carriers", (t) => {
  const matching = fixture(t, { enforce: "commit-and-push", approved: APPROVED, identity: APPROVED, jsonc: true });
  assert.equal(runHook(matching).status, 0);
  assert.equal(runChecker(matching).status, 0);

  const leaked = fixture(t, { enforce: "commit-and-push", approved: APPROVED, identity: LEAK, jsonc: true });
  assert.equal(runHook(leaked).status, 1);
  assert.equal(runChecker(leaked).status, 1);
});

test("parity — both carriers refuse a profile that does not parse", (t) => {
  const repo = fixture(t, { enforce: "commit-and-push", approved: APPROVED, identity: APPROVED });
  fs.writeFileSync(path.join(repo.root, ".pi", "agentic-workflow.json"), '{ "gitIdentity": { "enforce": "commit-and-push", }\n');
  assert.equal(runHook(repo).status, 1, "the hook refuses to commit on an unreadable profile");
  assert.equal(runChecker(repo).status, 2, "the checker refuses to pass on an unreadable profile");
});

test("parity — neither carrier writes: the profile keeps its bytes", (t) => {
  const repo = fixture(t, { enforce: "commit-and-push", approved: APPROVED, identity: LEAK });
  const profilePath = path.join(repo.root, ".pi", "agentic-workflow.json");
  const before = fs.readFileSync(profilePath, "utf8");
  const configBefore = spawnSync("git", ["config", "--local", "--list"], { cwd: repo.root, encoding: "utf8" }).stdout;
  runHook(repo);
  runChecker(repo);
  assert.equal(fs.readFileSync(profilePath, "utf8"), before);
  const configAfter = spawnSync("git", ["config", "--local", "--list"], { cwd: repo.root, encoding: "utf8" }).stdout;
  assert.equal(configAfter, configBefore);
});
