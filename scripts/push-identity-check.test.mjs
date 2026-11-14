#!/usr/bin/env node
/**
 * push-identity-check.test.mjs — the push-range authorship check (issue #514 S4).
 *
 * Layer 2's last resort: the pi guard only sees what the model asks bash to run,
 * and the pre-commit hook only sees commits made in this checkout. A suite that
 * wrote `t <t@example.test>` into the shared config produced commits that were
 * already signed and already valid — nothing in the pipeline looked at *who*
 * wrote them. This checker reads the push range and refuses it when any author
 * or committer is outside the project's approved profile.
 *
 * Every fixture repository is throwaway and every identity is passed with `-c`,
 * so this suite writes no git configuration (issue #514 S7).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "push-identity-check.mjs");

const APPROVED = { name: "Fixture Human", email: "human@example.com" };
const LEAK = { name: "t", email: "t@example.test" };

function git(cwd, args, identity = APPROVED) {
  const result = spawnSync(
    "git",
    ["-c", `user.name=${identity.name}`, "-c", `user.email=${identity.email}`, "-c", "commit.gpgsign=false", ...args],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

function writeProfile(root, gitIdentity) {
  fs.mkdirSync(path.join(root, ".pi"), { recursive: true });
  fs.writeFileSync(path.join(root, ".pi", "agentic-workflow.json"), JSON.stringify({ gitIdentity }, null, 2) + "\n");
}

/** A repository with one seed commit the range starts from. */
function fixture(t, { gitIdentity, approved = APPROVED } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "push-identity-"));
  const globalDir = fs.mkdtempSync(path.join(os.tmpdir(), "push-identity-global-"));
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(globalDir, { recursive: true, force: true });
  });
  git(root, ["init", "-q"]);
  fs.writeFileSync(path.join(root, "seed.txt"), "seed\n");
  git(root, ["add", "-A"]);
  git(root, ["commit", "-qm", "seed"]);
  const base = git(root, ["rev-parse", "HEAD"]).trim();
  if (gitIdentity !== undefined) writeProfile(root, gitIdentity);
  return { root, base, globalDir, approved };
}

function commitAs(repo, identity, message) {
  fs.writeFileSync(path.join(repo.root, `${message}.txt`), `${message}\n`);
  git(repo.root, ["add", "-A"]);
  git(repo.root, ["commit", "-qm", message], identity);
  return git(repo.root, ["rev-parse", "HEAD"]).trim();
}

function run(repo, extra = []) {
  return spawnSync(
    process.execPath,
    [SCRIPT, "--root", repo.root, "--base", repo.base, ...extra],
    { encoding: "utf8", env: { ...process.env, PI_CODING_AGENT_DIR: repo.globalDir } },
  );
}

/** The fixture stand-in for a fetched remote: a published ref at one commit. */
function publish(repo, sha, ref = "refs/remotes/origin/main") {
  git(repo.root, ["update-ref", ref, sha]);
}

const PROFILE = { enforce: "commit-and-push", approved: { name: APPROVED.name, email: APPROVED.email } };

test("a clean range passes and names the commit count", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  commitAs(repo, APPROVED, "clean");
  const result = run(repo);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — ok: 1 commit\(s\) verified/);
});

test("a misattributed author fails and names the commit and the repair commands", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  const sha = commitAs(repo, LEAK, "leaked");
  const result = run(repo);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — failed: 1 of 1 commit\(s\) outside the approved profile/);
  assert.ok(result.stdout.includes(sha), "the failing commit is named");
  assert.match(result.stdout, /author t <t@example\.test>/);
  assert.match(result.stdout, /git config --show-origin --get-all user\.name/);
  assert.match(result.stdout, /git config --unset user\.name/);
  assert.match(result.stdout, /git var GIT_AUTHOR_IDENT/);
});

test("a misattributed committer fails even when the author matches", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  fs.writeFileSync(path.join(repo.root, "mixed.txt"), "mixed\n");
  git(repo.root, ["add", "-A"]);
  git(repo.root, ["-c", `user.name=${LEAK.name}`, "-c", `user.email=${LEAK.email}`, "commit", "-qm", "mixed"]);
  const result = run(repo);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /committer t <t@example\.test>/);
});

test("no profile, or an enforce value that excludes push, is skipped and passes", (t) => {
  const none = fixture(t, {});
  commitAs(none, LEAK, "leaked");
  const skip = run(none);
  assert.equal(skip.status, 0, skip.stdout + skip.stderr);
  assert.match(skip.stdout, /PUSH IDENTITY — skipped: no approved identity profile/);

  for (const enforce of ["off", "commit"]) {
    const repo = fixture(t, { gitIdentity: { enforce, approved: { name: APPROVED.name, email: APPROVED.email } } });
    commitAs(repo, LEAK, "leaked");
    const result = run(repo);
    assert.equal(result.status, 0, `${enforce}: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, new RegExp(`PUSH IDENTITY — skipped: gitIdentity\\.enforce is "${enforce}"`));
  }
});

test("the project profile wins over the global one", (t) => {
  const repo = fixture(t, {});
  fs.mkdirSync(path.join(repo.globalDir), { recursive: true });
  fs.writeFileSync(
    path.join(repo.globalDir, "agentic-workflow.json"),
    JSON.stringify({ gitIdentity: { enforce: "push", approved: { name: APPROVED.name, email: APPROVED.email } } }) + "\n",
  );
  writeProfile(repo.root, { enforce: "push", approved: { name: "Someone Else", email: "else@example.com" } });
  commitAs(repo, APPROVED, "clean-under-global-only");
  const result = run(repo);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /failed: 1 of 1/);
});

test("the check is read-only: the repository and its config keep their bytes", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  commitAs(repo, LEAK, "leaked");
  const before = spawnSync("git", ["config", "--local", "--list"], { cwd: repo.root, encoding: "utf8" }).stdout;
  const profilePath = path.join(repo.root, ".pi", "agentic-workflow.json");
  const profileBefore = fs.readFileSync(profilePath, "utf8");
  assert.equal(run(repo).status, 1);
  assert.equal(run(repo).status, 1);
  const after = spawnSync("git", ["config", "--local", "--list"], { cwd: repo.root, encoding: "utf8" }).stdout;
  assert.equal(after, before, "no configuration was written");
  assert.equal(fs.readFileSync(profilePath, "utf8"), profileBefore, "the profile was not repaired");
});

test("a JSONC profile (full-line comments, block comments, trailing comma) is read", (t) => {
  const repo = fixture(t, {});
  fs.mkdirSync(path.join(repo.root, ".pi"), { recursive: true });
  fs.writeFileSync(
    path.join(repo.root, ".pi", "agentic-workflow.json"),
    [
      "{",
      "  // the approved identity, per project",
      '  "gitIdentity": {',
      '    "enforce": "push",',
      "    /* the corporate case: name, email, cert */",
      '    "approved": { "name": "Fixture Human", "email": "human@example.com" },',
      "  },",
      "}",
      "",
    ].join("\n"),
  );
  commitAs(repo, APPROVED, "clean");
  const result = run(repo);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("usage errors exit 2", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  assert.equal(spawnSync(process.execPath, [SCRIPT, "--nope"], { encoding: "utf8" }).status, 2);
  // no --base and no upstream to fall back on
  const bare = spawnSync(process.execPath, [SCRIPT, "--root", repo.root], {
    encoding: "utf8",
    env: { ...process.env, PI_CODING_AGENT_DIR: repo.globalDir },
  });
  assert.equal(bare.status, 2, bare.stdout + bare.stderr);
});

// ---------------------------------------------------------------------------
// Issue #539 — judge only never-published commits
// ---------------------------------------------------------------------------

test("PASS: a commit already published on origin/main is not judged (S3)", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  const published = commitAs(repo, LEAK, "published-leak");
  publish(repo, published);
  commitAs(repo, APPROVED, "own");
  const result = run(repo);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — ok: 1 commit\(s\) verified/);
  assert.ok(!result.stdout.includes(published), "the published commit is not named as an offender");
});

test("PASS: a push that merges origin/main skips its published commits and judges its own (S3)", (t) => {
  // The incident's exact range shape: base = the pushed branch's own remote tip,
  // and the range carries origin/main's already-published commits because the
  // branch merged them.
  const repo = fixture(t, { gitIdentity: PROFILE });
  const published = commitAs(repo, LEAK, "published-leak");
  publish(repo, published);
  publish(repo, repo.base, "refs/remotes/origin/fix-539");
  git(repo.root, ["checkout", "-q", "-b", "work", repo.base]);
  commitAs(repo, APPROVED, "own-1");
  git(repo.root, ["merge", "--no-ff", "-q", "-m", "merge main", published]);
  commitAs(repo, APPROVED, "own-2");
  const result = run(repo);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — ok: 3 commit\(s\) verified/);
});

test("FAIL: a new misattributed commit is still refused beside a published ref (S4)", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  const published = commitAs(repo, LEAK, "published-leak");
  publish(repo, published);
  const fresh = commitAs(repo, LEAK, "fresh-leak");
  const result = run(repo);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — failed: 1 of 1 commit\(s\) outside the approved profile/);
  assert.ok(result.stdout.includes(fresh), "the new commit is the one named");
  assert.ok(!result.stdout.includes(published), "the published commit is not re-judged");
});

test("PASS: a published approved commit is skipped and the new one is verified (S4)", (t) => {
  const repo = fixture(t, { gitIdentity: PROFILE });
  publish(repo, commitAs(repo, APPROVED, "published-approved"));
  commitAs(repo, APPROVED, "own");
  const result = run(repo);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — ok: 1 commit\(s\) verified/);
});

// ---------------------------------------------------------------------------
// Issue #546 — the push range is judged against the remote it is pushed to
// ---------------------------------------------------------------------------

/** The scope values, with the same two declared facts every case shares. */
const SCOPE = (enforce) => ({ enforce, approved: { name: APPROVED.name, email: APPROVED.email } });

/**
 * The multi-remote layout the issue's scenario table names: a fork the
 * contributor may push to (`origin`) and the upstream the project publishes
 * from (`upstream`), with the current branch tracking the upstream one.
 * Remote URLs are throwaway paths — nothing is contacted, no network call runs.
 */
function withRemotes(repo) {
  const branch = git(repo.root, ["branch", "--show-current"]).trim();
  for (const name of ["origin", "upstream"]) {
    git(repo.root, ["remote", "add", name, path.join(repo.root, ".git", `${name}.git`)]);
  }
  git(repo.root, ["update-ref", `refs/remotes/upstream/${branch}`, repo.base]);
  git(repo.root, ["config", `branch.${branch}.remote`, "upstream"]);
  git(repo.root, ["config", `branch.${branch}.merge`, `refs/heads/${branch}`]);
  return { branch, upstream: "upstream", fork: "origin" };
}

test("PASS: enforce=push-upstream skips a push to a remote that is not the tracked upstream (S2)", (t) => {
  const repo = fixture(t, { gitIdentity: SCOPE("push-upstream") });
  const remotes = withRemotes(repo);
  commitAs(repo, LEAK, "leaked-on-fork");
  const result = run(repo, ["--remote", remotes.fork]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — skipped: /);
  assert.ok(result.stdout.includes(`"${remotes.fork}"`), "the skipped remote is named");
  assert.ok(result.stdout.includes(`"${remotes.upstream}"`), "the tracked upstream is named");
});

test("FAIL: the same range pushed to the tracked upstream remote is refused (S2)", (t) => {
  const repo = fixture(t, { gitIdentity: SCOPE("push-upstream") });
  const remotes = withRemotes(repo);
  const sha = commitAs(repo, LEAK, "leaked");
  const result = run(repo, ["--remote", remotes.upstream]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — failed: 1 of 1 commit\(s\) outside the approved profile/);
  assert.ok(result.stdout.includes(sha), "the offender is named");
});

test("FAIL: enforce=push judges a push to any remote (S2)", (t) => {
  const repo = fixture(t, { gitIdentity: SCOPE("push") });
  const remotes = withRemotes(repo);
  commitAs(repo, LEAK, "leaked-on-fork");
  const result = run(repo, ["--remote", remotes.fork]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — failed: 1 of 1/);
});

test("FAIL: enforce=push-upstream with no --remote keeps the check (D9)", (t) => {
  const repo = fixture(t, { gitIdentity: SCOPE("push-upstream") });
  withRemotes(repo);
  commitAs(repo, LEAK, "leaked");
  const result = run(repo);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — failed: 1 of 1/, "an unnamed remote can never be proven to be the upstream one");
});

test("PASS: commit-and-push-upstream skips the fork remote (S2)", (t) => {
  const repo = fixture(t, { gitIdentity: SCOPE("commit-and-push-upstream") });
  const remotes = withRemotes(repo);
  commitAs(repo, LEAK, "leaked-on-fork");
  const result = run(repo, ["--remote", remotes.fork]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — skipped: /);
});

test("FAIL: commit-and-push-upstream judges the tracked upstream remote (S2)", (t) => {
  const repo = fixture(t, { gitIdentity: SCOPE("commit-and-push-upstream") });
  const remotes = withRemotes(repo);
  commitAs(repo, LEAK, "leaked");
  const result = run(repo, ["--remote", remotes.upstream]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /PUSH IDENTITY — failed: 1 of 1/);
});

test("the tracked upstream falls back to the current branch's remote when no remote-tracking ref exists (S2)", (t) => {
  // A brand-new branch pushing for the first time: `@{upstream}` cannot resolve
  // yet, but `branch.<name>.remote` already names the remote git will set.
  const repo = fixture(t, { gitIdentity: SCOPE("push-upstream") });
  const branch = git(repo.root, ["branch", "--show-current"]).trim();
  git(repo.root, ["remote", "add", "origin", path.join(repo.root, ".git", "origin.git")]);
  git(repo.root, ["remote", "add", "upstream", path.join(repo.root, ".git", "upstream.git")]);
  git(repo.root, ["config", `branch.${branch}.remote`, "upstream"]);
  git(repo.root, ["config", `branch.${branch}.merge`, `refs/heads/${branch}`]);
  commitAs(repo, LEAK, "leaked");
  const skipped = run(repo, ["--remote", "origin"]);
  assert.equal(skipped.status, 0, skipped.stdout + skipped.stderr);
  const judged = run(repo, ["--remote", "upstream"]);
  assert.equal(judged.status, 1, judged.stdout + judged.stderr);
});

test("--remote naming a remote git does not know is a usage error (S3)", (t) => {
  const repo = fixture(t, { gitIdentity: SCOPE("push-upstream") });
  withRemotes(repo);
  commitAs(repo, APPROVED, "clean");
  const result = run(repo, ["--remote", "nowhere"]);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stderr, /nowhere/);
});
