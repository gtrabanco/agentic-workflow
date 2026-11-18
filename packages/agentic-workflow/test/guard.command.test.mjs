// guard.command.test.mjs — the command guard's decision, carried by the crate so
// every platform adapter delegates to one rule (unit 554).
//
// The matrix is the retired shell suite's (test-command-guard.sh) verbatim: every
// allowed and blocked row that shipped there, plus the allowlist's literal
// semantics and the CLI's output formats.

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { decideCommand, main, readAllowlist } from "../src/guard/command.mjs";

const scratch = mkdtempSync(path.join(os.tmpdir(), "aw-guard-suite-"));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

const ALLOWED = [
  ["export assignment", "export NODE_ENV=test"],
  ["export existing name", "export NODE_ENV"],
  ["env-prefixed command", "env NODE_ENV=test npm test"],
  ["export word in filename", "node scripts/export-report.mjs"],
  ["merge-base is not merge", "git merge-base main HEAD"],
  ["fullauto wrapper", "bash .agentic-workflow/hooks/fullauto-merge.sh --pr 12"],
  ["variable-indirection merge (documented boundary)", "cmd=gh; $cmd pr merge 12"],
];

const BLOCKED = [
  ["export listing", "export"],
  ["export -p", "export -p"],
  ["env listing", "env"],
  ["absolute env listing", "/usr/bin/env"],
  ["env assignment-only listing", "env NODE_ENV=test"],
  ["printenv name", "printenv API_KEY"],
  ["absolute printenv name", "/usr/bin/printenv API_KEY"],
  ["declare exports", "declare -x"],
  ["direct PR merge", "gh pr merge 12 --squash"],
  ["bash-wrapped PR merge", "bash -c 'gh pr merge 12 --squash'"],
  ["python-wrapped PR merge", 'python -c \'os.system("gh pr merge 12")\''],
  ["shell-wrapped git merge", "sh -c 'git merge feature'"],
  ["absolute PR merge", "/usr/bin/gh pr merge 12 --squash"],
  ["repo-option PR merge", "gh --repo acme/app pr merge 12"],
  ["attached repo-option PR merge", "gh --repo=acme/app pr merge 12"],
  ["attached short repo-option PR merge", "gh -Racme/app pr merge 12"],
  ["direct MR merge", "glab mr merge 12"],
  ["repo-option MR merge", "glab -R acme/app mr merge 12"],
  ["attached repo-option MR merge", "glab -Racme/app mr merge 12"],
  ["direct git merge", "git merge feature"],
  ["git -C merge", "git -C /tmp/repo merge feature"],
  ["attached git -C merge", "git -C/tmp/repo merge feature"],
  ["REST merge", "gh api -X PUT repos/acme/app/pulls/12/merge"],
  ["GraphQL merge", "gh api graphql -f query='mutation { mergePullRequest }'"],
  ["shell env read", "cat .env"],
  ["grep env read", "grep API_KEY .env"],
  ["sed env read", "sed -n 1p .env"],
  ["awk env read", "awk 1 .env"],
  ["quoted env read", "cat '.env'"],
  ["nested env read", "head -1 config/.env.production"],
  ["copy env read", "cp .env /tmp/env.backup"],
  ["python env read", 'python -c \'open(".env").read()\''],
  ["gitea direct PR merge", "gt pr merge 12"],
  ["gitea repo-option PR merge", "gt -R acme/app pr merge 12"],
  ["gitea squash PR merge", "gt pr merge 12 --method squash"],
  ["hub merge", "hub merge https://github.com/acme/app/pull/12"],
  ["hub API merge", "hub api -X PUT repos/acme/app/pulls/12/merge"],
  ["GitLab API MR merge", "glab api -X PUT projects/acme%2Fapp/merge_requests/12/merge"],
  ["GitLab REST MR merge", "curl -X PUT https://gitlab.com/api/v4/projects/1/merge_requests/12/merge"],
  ["Gitea API merge", "curl -X POST https://gitea.com/api/v1/repos/acme/app/pulls/12/merge"],
  ["Bitbucket API merge", "curl -X POST https://api.bitbucket.org/2.0/repositories/acme/app/pullrequests/12/merge"],
  ["tea PR merge", "tea pr merge --repo acme/app 12"],
];

for (const [label, command] of ALLOWED) {
  test(`allows — ${label}`, () => {
    assert.deepEqual(decideCommand({ command, path: "" }), { allow: true });
  });
}

for (const [label, command] of BLOCKED) {
  test(`blocks — ${label}`, () => {
    const verdict = decideCommand({ command, path: "" });
    assert.equal(verdict.allow, false, `${label} must block`);
    assert.match(verdict.reason, /\S/u);
  });
}

test("an empty command is inert", () => {
  assert.deepEqual(decideCommand({ command: "", path: "" }), { allow: true });
});

test("a newline payload is read line by line, so a second-line merge still blocks", () => {
  const verdict = decideCommand({ command: "echo safe\ngh pr merge 12", path: "" });
  assert.equal(verdict.allow, false);
});

test("the read-tool path rule blocks an environment file", () => {
  assert.equal(decideCommand({ command: "", path: "/srv/app/.env.local" }).allow, false);
  assert.equal(decideCommand({ command: "", path: "/srv/app/.env" }).allow, false);
  assert.equal(decideCommand({ command: "", path: "/srv/app/readme.md" }).allow, true);
  assert.equal(decideCommand({ command: "", path: "/srv/app/envfile.md" }).allow, true);
});

test("the deny reasons name the rule, never a generic refusal", () => {
  assert.match(decideCommand({ command: "gh pr merge 12", path: "" }).reason, /direct pull-request merge/u);
  assert.match(decideCommand({ command: "glab mr merge 12", path: "" }).reason, /direct merge-request merge/u);
  assert.match(decideCommand({ command: "gt pr merge 12", path: "" }).reason, /Gitea CLI/u);
  assert.match(decideCommand({ command: "git merge feature", path: "" }).reason, /direct git merge/u);
  assert.match(decideCommand({ command: "printenv API_KEY", path: "" }).reason, /environment-variable disclosure/u);
  assert.match(decideCommand({ command: "cat .env", path: "" }).reason, /reading environment files/u);
  assert.match(decideCommand({ command: "", path: ".env" }).reason, /reading environment files/u);
});

// ── the allowlist: one whole command line per entry, absent allows nothing ────

function allowlistFile(content) {
  const dir = mkdtempSync(path.join(scratch, "allow-"));
  const file = path.join(dir, "guard-allow.txt");
  writeFileSync(file, content);
  return file;
}

test("an absent allowlist allows nothing", () => {
  const missing = path.join(scratch, "nope", "guard-allow.txt");
  assert.deepEqual(readAllowlist(missing), []);
  assert.equal(decideCommand({ command: "gh pr merge 12 --squash", path: "" }, { allowlist: readAllowlist(missing) }).allow, false);
});

test("comments and blank lines are never entries", () => {
  const entries = readAllowlist(allowlistFile("# a per-project merge the owner approved\n\n   \n"));
  assert.deepEqual(entries, []);
});

test("the exact approved line passes and nothing else does", () => {
  const entries = readAllowlist(allowlistFile("gh pr merge 12 --squash\n"));
  assert.deepEqual(entries, ["gh pr merge 12 --squash"]);
  assert.equal(decideCommand({ command: "gh pr merge 12 --squash", path: "" }, { allowlist: entries }).allow, true);
  assert.equal(decideCommand({ command: "gh pr merge 13 --squash", path: "" }, { allowlist: entries }).allow, false);
  assert.equal(decideCommand({ command: "gh pr merge 12 --squash && cat .env", path: "" }, { allowlist: entries }).allow, false);
  assert.equal(decideCommand({ command: "cat .env", path: "" }, { allowlist: entries }).allow, false);
  assert.equal(decideCommand({ command: "", path: "/srv/app/.env" }, { allowlist: entries }).allow, false);
});

// ── the CLI face ─────────────────────────────────────────────────────────────

function cli(argv, stdin = "") {
  const out = [];
  const err = [];
  const code = main(argv, {
    stdin: () => stdin,
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
  });
  return { code, stdout: out.join(""), stderr: err.join("") };
}

test("the CLI allows a safe command with no output and exit 0", () => {
  const result = cli(["--command", "printf safe"]);
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

test("the CLI denies with the policy sentence on stderr and exit 2", () => {
  const result = cli(["--command", "gh pr merge 12"]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^Blocked by agentic-workflow safety policy: direct pull-request merge/u);
});

test("the CLI reads the allowlist it is handed, and defaults to the project's own", () => {
  const file = allowlistFile("gh pr merge 12 --squash\n");
  assert.equal(cli(["--command", "gh pr merge 12 --squash", "--allowlist", file]).code, 0);
});

test("--payload reads the adapter's JSON from stdin", () => {
  const blocked = cli(["--payload"], JSON.stringify({ tool_input: { command: "gh pr merge 12" } }));
  assert.equal(blocked.code, 2);
  assert.match(blocked.stderr, /Blocked by agentic-workflow safety policy/u);

  const allowed = cli(["--payload"], JSON.stringify({ tool_input: { command: "printf safe" } }));
  assert.equal(allowed.code, 0);

  const malformed = cli(["--payload"], "{not-json");
  assert.equal(malformed.code, 2);
  assert.match(malformed.stderr, /invalid hook payload/u);

  const unrecognized = cli(["--payload"], "{}");
  assert.equal(unrecognized.code, 2);
  assert.match(unrecognized.stderr, /invalid hook payload/u);
});

test("--format json normalizes the payload the way the adapter's library did", () => {
  const result = cli(["--payload", "--format", "json"], JSON.stringify({ tool_input: { command: "gh pr merge 12", file_path: ".env" } }));
  assert.equal(result.code, 0);
  assert.equal(result.stdout, '["gh pr merge 12",".env"]\n');

  const malformed = cli(["--payload", "--format", "json"], "{not-json");
  assert.equal(malformed.code, 2);
  assert.equal(malformed.stdout, "");
});

test("--format copilot renders the platform's decision document and exits 0", () => {
  const blocked = cli(["--payload", "--format", "copilot"], JSON.stringify({ tool_input: { file_path: ".env" } }));
  assert.equal(blocked.code, 0);
  assert.equal(blocked.stderr, "");
  const document = JSON.parse(blocked.stdout);
  assert.equal(document.continue, false);
  assert.match(document.stopReason, /Blocked by agentic-workflow safety policy/u);

  const allowed = cli(["--payload", "--format", "copilot"], JSON.stringify({ tool_input: { command: "printf safe" } }));
  assert.equal(allowed.code, 0);
  assert.equal(allowed.stdout, "");

  const malformed = cli(["--payload", "--format", "copilot"], "{not-json");
  const malformedDocument = JSON.parse(malformed.stdout);
  assert.equal(malformedDocument.continue, false);
  assert.match(malformedDocument.stopReason, /invalid hook payload/u);
});

test("a usage error names the argument and exits 2", () => {
  const result = cli(["--nope"]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /unknown argument: --nope/u);
  assert.equal(cli(["--command"]).code, 2);
});
