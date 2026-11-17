// forge.test.mjs — the one place a capability names a forge (issue #546 S4/S5),
// carried by the crate so the turn contract and the merge wrapper ask one
// implementation (unit 554).
//
// The cases are the retired shell suite's (test-forge-adapter.sh): the detect
// matrix, the CLI mapping and its three refusals, the project path, and the
// pull-request readers against PATH stubs — the only thing a machine with no
// real forge can prove.

import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  detectForge,
  forgeCli,
  mergePr,
  prJson,
  prLine,
  projectPath,
  requireForgeCli,
} from "../src/forge.mjs";

const scratch = mkdtempSync(path.join(os.tmpdir(), "aw-forge-suite-"));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

const stubBin = path.join(scratch, "bin");
mkdirSync(stubBin, { recursive: true });

/** A PATH stub that records its argv into `$STUB_LOG` and answers `$STUB_OUT`. */
function stub(name, body = "") {
  const file = path.join(stubBin, name);
  writeFileSync(file, `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >>"\${STUB_LOG:-/dev/null}"\n${body}\n`);
  chmodSync(file, 0o755);
  return file;
}

const env = (extra = {}) => ({ ...process.env, PATH: `${stubBin}:${process.env.PATH}`, ...extra });

test("the detect matrix answers one forge per remote shape", () => {
  const cases = [
    ["https://github.com/o/r.git", "github"],
    ["git@github.com:o/r.git", "github"],
    ["https://gitlab.com/o/r.git", "gitlab"],
    ["https://gitlab.example.com/o/r.git", "gitlab"],
    ["https://gitea.example.com/o/r.git", "gitea"],
    ["https://bitbucket.org/o/r.git", "bitbucket"],
    // The shell adapter's own matrix: `unknown` is answered for a URL-shaped
    // remote that names no known forge; a non-URL remote (, a scp-style host with
    // no marker) keeps the default CLI, which is #546's shipped behaviour.
    ["git@git.example.com:o/r.git", "default"],
    ["/srv/git/r.git", "default"],
    ["./relative", "default"],
    ["../relative", "default"],
    ["", "default"],
    ["file:///srv/mirror/r.git", "unknown"],
    ["file://github.com/o/r.git", "github"],
  ];
  for (const [url, expected] of cases) {
    assert.deepEqual(detectForge(url), { ok: true, forge: expected }, `detect ${url || "<empty>"}`);
  }
});

test("an override wins, and an invalid one refuses naming the four forges", () => {
  assert.deepEqual(detectForge("git@git.example.com:o/r.git", "gitea"), { ok: true, forge: "gitea" });
  const refused = detectForge("https://github.com/o/r.git", "gerrit");
  assert.equal(refused.ok, false);
  assert.match(refused.message, /forge "gerrit" is not one of github, gitlab, gitea, bitbucket/u);
});

test("AGENTIC_WORKFLOW_FORGE is the environment override", () => {
  const saved = process.env.AGENTIC_WORKFLOW_FORGE;
  process.env.AGENTIC_WORKFLOW_FORGE = "gitlab";
  try {
    assert.deepEqual(detectForge("git@git.example.com:o/r.git"), { ok: true, forge: "gitlab" });
    assert.deepEqual(detectForge("git@git.example.com:o/r.git", "gitea"), { ok: true, forge: "gitea" });
  } finally {
    if (saved === undefined) delete process.env.AGENTIC_WORKFLOW_FORGE;
    else process.env.AGENTIC_WORKFLOW_FORGE = saved;
  }
});

test("the CLI mapping names one binary per forge and refuses the two that have none", () => {
  assert.deepEqual(forgeCli("github"), { ok: true, cli: "gh" });
  assert.deepEqual(forgeCli("default"), { ok: true, cli: "gh" });
  assert.deepEqual(forgeCli("gitlab"), { ok: true, cli: "glab" });
  assert.deepEqual(forgeCli("gitea"), { ok: true, cli: "gt" });

  const bitbucket = forgeCli("bitbucket");
  assert.equal(bitbucket.ok, false);
  assert.match(bitbucket.message, /bitbucket has no official pull-request CLI/u);
  assert.match(bitbucket.message, /api\.bitbucket\.org/u);

  const unknown = forgeCli("unknown");
  assert.equal(unknown.ok, false);
  assert.match(unknown.message, /--forge or AGENTIC_WORKFLOW_FORGE/u);
});

test("requireForgeCli refuses a forge whose CLI is not installed, naming both", () => {
  const refused = requireForgeCli("gitlab", { env: env({ PATH: "/usr/bin:/bin" }), probe: () => false });
  assert.equal(refused.ok, false);
  assert.match(refused.message, /glab is not installed, so the gitlab forge cannot be asked/u);
});

test("the project path answers owner/repo for every remote shape", () => {
  assert.equal(projectPath("https://github.com/o/r.git"), "o/r");
  assert.equal(projectPath("git@github.com:o/r.git"), "o/r");
  assert.equal(projectPath("/srv/git/r.git"), "r");
  assert.equal(projectPath("https://gitlab.com/group/sub/r"), "group/sub/r");
});

test("prLine reads the GitHub list answer and reports an empty list as no PR", () => {
  stub("gh", 'case "$1 $2" in "pr list") printf \'%s\\n\' "${GH_STUB_JSON:-[]}"; exit "${GH_STUB_EXIT:-0}" ;; *) exit 3 ;; esac');
  const found = prLine("github", "feat/x", {
    env: env({ GH_STUB_JSON: '[{"state":"OPEN","headRefOid":"abc123"}]' }),
  });
  assert.deepEqual(found, { ok: true, line: "OPEN abc123" });

  const none = prLine("github", "feat/x", { env: env({ GH_STUB_JSON: "[]" }) });
  assert.deepEqual(none, { ok: true, line: null });

  const unreachable = prLine("github", "feat/x", { env: env({ GH_STUB_EXIT: "1" }) });
  assert.equal(unreachable.ok, false);
  assert.equal(unreachable.unverifiable, true);
});

test("prLine reads a GitLab MR list and a Gitea PR list", () => {
  stub("glab", 'printf \'%s\\n\' \'[{"state":"opened","sha":"def456"}]\'');
  stub("gt", 'printf \'%s\\n\' \'[{"state":"open","head_sha":"fed789"}]\'');
  assert.deepEqual(prLine("gitlab", "feat/x", { env: env() }), { ok: true, line: "opened def456" });
  assert.deepEqual(prLine("gitea", "feat/x", { env: env() }), { ok: true, line: "open fed789" });
});

test("prJson normalizes all three forges to one document", () => {
  stub(
    "gh",
    'case "$1 $2" in "pr view") printf \'%s\\n\' \'{"number":12,"url":"https://gh/o/r/pull/12","state":"OPEN","baseRefName":"main","headRefOid":"sha1","mergeable":"MERGEABLE","statusCheckRollup":[],"comments":[],"mergeCommit":null}\' ;; *) exit 3 ;; esac',
  );
  stub(
    "glab",
    'case "$1 $2" in "mr view") printf \'%s\\n\' \'{"iid":12,"web_url":"https://gl/o/r/-/mr/12","state":"opened","target_branch":"main","sha":"sha2","merge_status":"can_be_merged","head_pipeline":{"status":"success"}}\' ;; *) exit 3 ;; esac',
  );
  stub(
    "gt",
    'case "$1 $2" in "pr view") printf \'%s\\n\' \'{"number":12,"url":"https://gt/o/r/pulls/12","state":"open","base":"main","head_sha":"sha3","mergeable":true,"comments":[],"draft":false,"merged":false}\' ;; *) exit 3 ;; esac',
  );

  const gh = prJson("github", "12", { env: env() });
  assert.equal(gh.ok, true);
  assert.equal(gh.document.headRefOid, "sha1");
  assert.equal(gh.document.baseRefName, "main");

  const glab = prJson("gitlab", "12", { env: env() });
  assert.equal(glab.ok, true);
  assert.deepEqual(
    [glab.document.number, glab.document.state, glab.document.baseRefName, glab.document.headRefOid, glab.document.mergeable],
    [12, "OPEN", "main", "sha2", "MERGEABLE"],
  );
  assert.deepEqual(glab.document.statusCheckRollup, [{ conclusion: "SUCCESS" }]);
  assert.deepEqual(glab.document.mergeCommit, { oid: "" });

  const gt = prJson("gitea", "12", { env: env() });
  assert.equal(gt.ok, true);
  assert.deepEqual(
    [gt.document.state, gt.document.baseRefName, gt.document.headRefOid, gt.document.mergeable],
    ["OPEN", "main", "sha3", "MERGEABLE"],
  );
});

test("a forge that cannot answer is a refusal, never an empty document", () => {
  stub("gh", "exit 4");
  const refused = prJson("github", "12", { env: env() });
  assert.equal(refused.ok, false);
  assert.match(refused.message, /could not answer for PR 12/u);
});

test("mergePr pins the audited head where the CLI can express it", () => {
  const log = path.join(scratch, "merge.log");
  stub("gh", "exit 0");
  stub("glab", "exit 0");
  stub("gt", "exit 0");

  assert.equal(mergePr("github", "12", "squash", "sha1", { env: env({ STUB_LOG: log }) }).ok, true);
  assert.equal(mergePr("gitlab", "12", "rebase", "sha2", { env: env({ STUB_LOG: log }) }).ok, true);
  assert.equal(mergePr("gitea", "12", "merge", "sha3", { env: env({ STUB_LOG: log }) }).ok, true);

  const lines = requiredLines(log);
  assert.equal(lines[0], "pr merge 12 --squash --match-head-commit sha1");
  assert.equal(lines[1], "mr merge 12 --sha sha2 --rebase -y");
  assert.equal(lines[2], "pr merge 12 --method merge -y");
});

test("mergePr refuses a forge with no merge carrier", () => {
  const refused = mergePr("bitbucket", "12", "merge", "sha", { env: env() });
  assert.equal(refused.ok, false);
  assert.match(refused.message, /no official pull-request CLI/u);
});

function requiredLines(file) {
  return readFileSync(file, "utf8").split("\n").filter((line) => line !== "");
}
