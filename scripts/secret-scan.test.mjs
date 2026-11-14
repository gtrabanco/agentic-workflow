#!/usr/bin/env node
/**
 * secret-scan.test.mjs — the corpus for the deterministic push-range secret scan
 * (issue #487).
 *
 * The defect the scan exists for is a credential riding a push into `main`,
 * which today only a model-conducted `review-security` checklist item looks for.
 * Every case below is a shape the issue names: a positive per rule, the benign
 * strings this repository is full of (`${{ secrets.GITHUB_TOKEN }}`, a
 * documented placeholder, a publishable key), the redaction rule, the range
 * semantics (added lines only, no path exempt, a removal is not a finding), the
 * allowlist's two directions, and the exit codes that make the gate fail closed.
 *
 * Two conventions the repository's own gates impose and this file keeps:
 *   - every secret-shaped fixture is composed at runtime except the one literal
 *     this file carries (`KNOWN_SECRET_FIXTURE`), which is the known-secret
 *     fixture S10 asks for and the reason the shipped allowlist has an entry —
 *     so a whole-tree scan of this repository sees exactly one flagged line,
 *     and the case that proves the entry is doing the work scans the same bytes
 *     with an empty allowlist;
 *   - every fixture repository passes its identity per `git -c` and never
 *     writes git configuration (`scripts/git-config-writes.test.mjs`), and every
 *     temp tree is removed by `t.after` (`scripts/temp-hygiene.mjs`).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  RULES,
  allowlistFault,
  applyAllowlist,
  entropy,
  loadAllowlist,
  payloadFault,
  redact,
  resolveRange,
  scanDiff,
  scanLine,
  scanText,
  scanTree,
  trackedFiles,
} from "./secret-scan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "secret-scan.mjs");

/**
 * The one literal secret-shaped value in this file: a fake classic personal
 * access token, present so the suite proves detection *and* the allowlist's
 * narrowing. It authenticates nothing — the prefix is what a scanner anchors on.
 * Every other fixture is composed at runtime, so this line is the only one a
 * whole-tree scan of this repository can see.
 */
const KNOWN_SECRET_FIXTURE = "ghp_9Xk2mQ7pR4tV6wZ1bN8cF3dG5hJ0lK2sA7eU4yW6";

/** An AWS key id shape, composed for the same reason. */
const AWS_KEY_FIXTURE = ["AKIA", "Q7W3E5R7T9Y1U3I5"].join("");

/** A payload with enough classes and entropy to be a credential, composed here so
 *  no literal secret lives in this file. */
const PAYLOAD = ["d4f1a2b3", "c4d5e6f7", "a8b9c0d1", "e2f3a4b5"].join("");
const JWK = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZpeHR1cmUifQ",
  "dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
].join(".");

const CLI = (args, cwd = ROOT) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });

const HUMAN = { name: "Fixture Human", email: "human@example.com" };

/** One `git` invocation. Every commit-carrying call passes its identity with
 *  `-c`, so no fixture (and no checkout) ever has git config written to it. */
function git(cwd, args) {
  const result = spawnSync(
    "git",
    ["-c", `user.name=${HUMAN.name}`, "-c", `user.email=${HUMAN.email}`, "-c", "commit.gpgsign=false", ...args],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

/** A snapshot of every tracked file's bytes, for the read-only cases. */
function snapshot(root) {
  const files = trackedFiles(root);
  return files.map((file) => `${file}:${fs.readFileSync(path.join(root, file), "utf8").length}`).join("\n");
}

/* ------------------------------------------------------------------ rules */

test("the rule vocabulary is closed and every rule has its own detector", () => {
  assert.ok(Array.isArray(RULES) && RULES.length >= 10, "the scan ships a rule table, not one catch-all pattern");
  assert.equal(new Set(RULES).size, RULES.length, "a duplicated rule id would report one shape twice");
  for (const rule of RULES) assert.match(rule, /^[a-z]+(?:-[a-z]+)*$/, `${rule} is a slug the report can name`);
});

test("each rule detects a realistic shape of its own", () => {
  // The payloads are composed so this file carries no literal secret; the
  // shapes are what a real token of that provider looks like.
  const cases = [
    ["private-key", ["-----BEGIN OPENSSH ", "PRIVATE KEY-----"].join("")],
    ["github-token", ["ghp_", "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8"].join("")],
    ["github-token", ["github_pat_", "11ABCDEFG0123456789_", "abcdefghijklmnopqrstuvwxyz0123456789ABCD"].join("")],
    ["gitlab-token", ["glpat-", "a1B2c3D4e5F6g7H8i9J0"].join("")],
    ["openai-key", ["sk-proj-", "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5z"].join("")],
    ["aws-access-key", AWS_KEY_FIXTURE],
    ["google-api-key", ["AIza", "SyD1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"].join("")],
    ["slack-token", ["xoxb-", "2481", "9999", "1234", "-aBcDeFgHiJkLmNoPqRsTuVwX"].join("")],
    ["npm-token", ["npm_", "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8"].join("")],
    ["sendgrid-key", ["SG.", "aB1cD2eF3gH4iJ5kL6mN7o", ".", "P8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0P1qR2"].join("")],
    ["jwt", JWK],
    ["credential-assignment", `client_secret: "${PAYLOAD}"`],
    ["connection-string", `DATABASE_URL=postgres://app:${PAYLOAD}@db.internal:5432/prod`],
  ];
  for (const [rule, line] of cases) {
    const hits = scanLine(line);
    assert.ok(
      hits.some((hit) => hit.rule === rule),
      `${rule} did not fire on ${JSON.stringify(line.slice(0, 40))} — got ${JSON.stringify(hits.map((hit) => hit.rule))}`,
    );
  }
});

test("a credential assignment is judged by its payload, never by its key name alone", () => {
  // A key name with nothing secret behind it is the shape that would turn every
  // config file red: the value must also carry a payload this rule accepts.
  const benign = [
    "apiKey: process.env.API_KEY",
    `password: "${"x".repeat(24)}"`,
    `token: "${"0".repeat(32)}"`,
    'secret: "your-secret-here"',
    'client_secret: "REPLACE_WITH_YOUR_SECRET"',
    `const api_key = "${"a".repeat(20)}";`,
    'credential: "<your-credential>"',
    'password: "${DB_PASSWORD}"',
  ];
  for (const line of benign) {
    assert.deepEqual(scanLine(line), [], `${JSON.stringify(line.slice(0, 40))} must not be a finding`);
  }
});

test("the benign shapes this repository actually carries are never findings", () => {
  // S10's own example, verbatim, plus the reference forms every workflow,
  // template and test uses to mean "a secret arrives from elsewhere".
  const benign = [
    "GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}",
    '  token: "${{ secrets.NPM_TOKEN }}"',
    "STRIPE_PUBLISHABLE: pk_test_51H8xYz2eZvKYlo2CvQ8s",
    "Authorization: Bearer ${GITHUB_TOKEN}",
    "const apiKey = process.env.API_KEY;",
    'integrity: "sha512-abcdef0123456789abcdef0123456789"',
    "if (password === \"\") return null;",
    "const matcher = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/;",
    "npm_config_user_agent starting with bun/",
  ];
  for (const line of benign) {
    assert.deepEqual(scanLine(line), [], `${JSON.stringify(line.slice(0, 48))} must not be a finding`);
  }
});

test("entropy separates a real payload from a repeating or short one", () => {
  assert.ok(entropy(PAYLOAD) > 3.5, `a mixed payload measures high entropy, got ${entropy(PAYLOAD).toFixed(2)}`);
  assert.ok(entropy("abababababababababab") < 1.1, "a repeating string measures almost nothing");
  assert.equal(payloadFault(PAYLOAD), null, "a mixed payload passes");
  assert.match(payloadFault("aaaaaaaaaaaaaaaaaaaaaaaa"), /placeholder|entropy/);
  assert.match(payloadFault("1234567890123456"), /entropy/, "digits alone carry no credential shape");
  assert.match(payloadFault("short"), /short/);
});

test("the report never echoes the secret it found", () => {
  const line = `api_key: "${PAYLOAD}"`;
  const hits = scanLine(line);
  assert.equal(hits.length, 1, "one finding for one leaked value");
  const rendered = JSON.stringify(hits);
  assert.ok(!rendered.includes(PAYLOAD), `the payload must not survive into the report: ${rendered}`);
  assert.match(hits[0].detail, new RegExp(`\\(${PAYLOAD.length} chars\\)`), "the length is reported instead");
  assert.equal(redact(PAYLOAD), `${PAYLOAD.slice(0, 4)}…(${PAYLOAD.length} chars)`);
  assert.equal(redact("ab"), "***(2 chars)", "a payload too short to preview is never partially echoed");
});

test("the same rule on one line is one finding, and two shapes on one line are two", () => {
  assert.equal(scanLine(`token: "${PAYLOAD}" and token: "${PAYLOAD}"`).length, 1);
  const both = scanLine(`${AWS_KEY_FIXTURE} password: "${PAYLOAD}"`);
  assert.deepEqual(both.map((hit) => hit.rule).sort(), ["aws-access-key", "credential-assignment"]);
});

/* ------------------------------------------------------------------ range */

test("the range scan judges added lines and reports the file and line", () => {
  const diff = [
    "diff --git a/app.env b/app.env",
    "new file mode 100644",
    "--- /dev/null",
    "+++ b/app.env",
    "@@ -0,0 +1,2 @@",
    `+API_TOKEN="${PAYLOAD}"`,
    "+SAFE=1",
  ].join("\n");
  const findings = scanDiff(diff);
  assert.equal(findings.length, 1, JSON.stringify(findings));
  assert.equal(findings[0].file, "app.env");
  assert.equal(findings[0].line, 1, "the new-side line number, not the diff's own line");
  assert.equal(findings[0].rule, "credential-assignment");
});

test("a secret the range removes is not a finding — the scan judges what a push adds", () => {
  const diff = [
    "diff --git a/app.env b/app.env",
    "--- a/app.env",
    "+++ b/app.env",
    "@@ -1 +1 @@",
    `-API_TOKEN="${PAYLOAD}"`,
    "+API_TOKEN=read-from-the-environment",
  ].join("\n");
  assert.deepEqual(scanDiff(diff), [], "the removal is the repair, never the defect");
});

test("a binary hunk and a deleted file are skipped without inventing a finding", () => {
  const diff = [
    "diff --git a/blob.bin b/blob.bin",
    "Binary files a/blob.bin and b/blob.bin differ",
    "diff --git a/gone.md b/gone.md",
    "deleted file mode 100644",
    "--- a/gone.md",
    "+++ /dev/null",
    `-token: "${PAYLOAD}"`,
  ].join("\n");
  assert.deepEqual(scanDiff(diff), []);
});

test("a secret added under docs/ is a finding — no path is exempt", () => {
  const t = fixtureRepo();
  try {
    t.write("docs/fragment-example.md", `# Example\n\napi_key: "${PAYLOAD}"\n`);
    t.commit("docs: an example that leaks");
    const result = CLI(["--root", t.root, "--base", t.base]);
    assert.equal(result.status, 1, `expected a finding, got ${result.status}: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /FINDING docs\/fragment-example\.md:3 — credential-assignment/);
    assert.match(result.stdout, /^verdict: FAIL$/m);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test("a clean range passes and names what it scanned", () => {
  const t = fixtureRepo();
  try {
    t.write("docs/notes.md", "# Notes\n\nA clean page, edited.\n");
    t.commit("docs: edit the notes");
    const result = CLI(["--root", t.root, "--base", t.base]);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /^secret-scan — .*added line\(s\) scanned/m);
    assert.match(result.stdout, /^verdict: PASS$/m);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test("a secret the base already carried is out of a range's scope but in a whole-tree pass", () => {
  const t = fixtureRepo();
  try {
    const committed = `token: "${PAYLOAD}"`;
    t.write("app.env", `${committed}\n`);
    const base = t.commit("feat: the seed carries a token");
    assert.deepEqual(scanDiff(git(t.root, ["diff", "--no-color", "-U0", base, "HEAD"])), [], "nothing is added by the empty range");
    const tree = scanTree(t.root);
    assert.equal(tree.findings.length, 1, "the whole-tree pass is what sees it");
    assert.equal(tree.findings[0].file, "app.env");
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

/* --------------------------------------------------------------- the tree */

test("the whole-tree pass skips a binary file and discloses the skip", () => {
  const t = fixtureRepo();
  try {
    fs.writeFileSync(path.join(t.root, "chunk.jsonl.gz"), Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x61, 0x62, 0x00]));
    fs.writeFileSync(path.join(t.root, "archive.bin"), Buffer.from([0x00, 0x01, 0x02]));
    t.commit("chore: two binary containers");
    const tree = scanTree(t.root);
    assert.equal(tree.findings.length, 0);
    assert.ok(tree.skipped >= 2, `the skip is counted and disclosed, got ${tree.skipped}`);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test("the whole-tree pass is read-only", () => {
  const t = fixtureRepo();
  try {
    t.write("app.env", `token: "${PAYLOAD}"\n`);
    t.commit("feat: a leak");
    const before = snapshot(t.root);
    scanTree(t.root);
    assert.equal(snapshot(t.root), before, "the scan writes no byte");
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ range resolution */

test("the range resolution prefers the flag, then the upstream, then origin/main, then the tree", () => {
  const gitQuery = (steps) => (_root, args) => {
    const key = args.join(" ");
    return key in steps ? steps[key] : null;
  };
  assert.deepEqual(
    resolveRange({ root: "/x", explicit: "abc123", gitQuery: gitQuery({}) }),
    { ok: true, mode: "range", base: "abc123", head: "HEAD", source: "flag" },
  );
  const upstream = {
    "rev-parse --verify --quiet @{upstream}": "refs/remotes/origin/main",
    "merge-base HEAD @{upstream}": "u4u4u4",
    "rev-parse --verify --quiet HEAD": "h1h1h1",
  };
  assert.deepEqual(resolveRange({ root: "/x", gitQuery: gitQuery(upstream) }), {
    ok: true, mode: "range", base: "u4u4u4", head: "HEAD", source: "upstream",
  });
  const mainline = {
    "rev-parse --verify --quiet origin/main": "m2m2m2",
    "merge-base HEAD origin/main": "b5b5b5",
  };
  assert.deepEqual(resolveRange({ root: "/x", gitQuery: gitQuery(mainline) }), {
    ok: true, mode: "range", base: "b5b5b5", head: "HEAD", source: "origin/main",
  });
  assert.deepEqual(resolveRange({ root: "/x", gitQuery: gitQuery({}) }), {
    ok: true, mode: "tree", base: null, head: "HEAD", source: "tree",
  });
});

test("an unresolvable base is refused, never read as an empty range", () => {
  const t = fixtureRepo();
  try {
    const result = CLI(["--root", t.root, "--base", "no-such-revision"]);
    assert.equal(result.status, 2, `a bogus base must be a usage error, got ${result.status}: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /no-such-revision/);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test("a directory that is not a git checkout is refused, never passed", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "secret-scan-bare-"));
  try {
    const result = CLI(["--root", dir]);
    assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /git/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* -------------------------------------------------------------- allowlist */

test("the allowlist narrows one path and one rule", () => {
  const entries = [{ path: "docs/example.md", rule: "credential-assignment", reason: "a documented sample" }];
  assert.equal(allowlistFault(entries), null);
  const hits = [{ file: "docs/example.md", line: 3, rule: "credential-assignment", detail: "…" }];
  const verdict = applyAllowlist(hits, entries);
  assert.deepEqual(verdict.kept, [], "a matching entry suppresses its own rule on its own path");
  assert.equal(verdict.allowlisted.length, 1);

  const otherRule = applyAllowlist([{ file: "docs/example.md", line: 3, rule: "aws-access-key", detail: "…" }], entries);
  assert.equal(otherRule.kept.length, 1, "an entry narrowed to one rule never silences another");

  const otherPath = applyAllowlist([{ file: "docs/other.md", line: 3, rule: "credential-assignment", detail: "…" }], entries);
  assert.equal(otherPath.kept.length, 1, "an entry narrowed to one path never silences another");

  const star = applyAllowlist(hits, [{ path: "docs/*.md", rule: "*", reason: "a whole documented family" }]);
  assert.deepEqual(star.kept, []);
});

test("a malformed allowlist refuses instead of guessing", () => {
  assert.match(allowlistFault({}), /array/);
  assert.match(allowlistFault([{ rule: "*", reason: "no path" }]), /path/);
  assert.match(allowlistFault([{ path: "a.md", reason: "no rule" }]), /rule/);
  assert.match(allowlistFault([{ path: "a.md", rule: "not-a-rule" }]), /not a shipped rule/);
  assert.match(allowlistFault([{ path: "a.md", rule: "*" }]), /reason/, "a blanket entry must say why");
});

test("an allowlist entry that matches nothing is a finding in whole-tree mode", () => {
  const t = fixtureRepo();
  try {
    t.allowlistFile([{ path: "docs/never-scanned.md", rule: "*", reason: "stale on purpose" }]);
    t.commit("chore: a stale allowlist");
    const result = CLI(["--root", t.root, "--all"]);
    assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /FINDING scripts\/secret-scan-allowlist\.json — allowlist-stale: docs\/never-scanned\.md matches no finding/);
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test("the suite's own literal fixture is a finding under an empty allowlist and allowlisted under the shipped one", () => {
  // S10's two halves in one place: the same bytes, one scan without an entry and
  // one with it. The shipped entry is what keeps this branch's own push green.
  const file = "scripts/secret-scan.test.mjs";
  const hits = scanText(`const KNOWN_SECRET_FIXTURE = "${KNOWN_SECRET_FIXTURE}";`).map((hit) => ({ ...hit, file }));
  assert.equal(hits.length, 1, "the known-secret fixture is detected");
  assert.equal(hits[0].rule, "github-token");
  assert.equal(applyAllowlist(hits, []).kept.length, 1, "without an entry it is a finding");
  const shipped = loadAllowlist(ROOT);
  assert.deepEqual(shipped.errors, [], "the shipped allowlist is well formed");
  const verdict = applyAllowlist(hits, shipped.entries);
  assert.deepEqual(verdict.kept, [], "the shipped entry narrows exactly this file and rule");
  assert.equal(verdict.allowlisted.length, 1);
});

/* ------------------------------------------------------------------ live tree */

test("the shipped whole-tree scan of this repository passes with the shipped allowlist", () => {
  // The step's fallback mode, run against the tree it ships in: a green evidence
  // case that a real credential has not landed, and the receipt that the
  // allowlist entry above is matched by real bytes.
  const result = CLI(["--all"]);
  assert.equal(result.status, 0, `the shipped tree must not carry a secret:\n${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /^verdict: PASS$/m);
  assert.match(result.stdout, /ALLOWLISTED scripts\/secret-scan\.test\.mjs:\d+ — github-token/);
});

test("the CLI's exit codes are the gate's contract: 0 clean, 1 findings, 2 usage", () => {
  const t = fixtureRepo();
  try {
    assert.equal(CLI(["--root", t.root, "--base", t.base]).status, 0, "nothing added, nothing found");
    assert.equal(CLI(["--nope"]).status, 2, "an unknown flag is a usage error");
    assert.equal(CLI(["--base"]).status, 2, "--base needs a value");
    t.write("leak.md", `token: "${PAYLOAD}"\n`);
    t.commit("docs: a leak");
    assert.equal(CLI(["--root", t.root, "--base", t.base]).status, 1, "a finding fails the step");
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

test("--json prints one machine object and no prose", () => {
  const t = fixtureRepo();
  try {
    t.write("leak.md", `token: "${PAYLOAD}"\n`);
    t.commit("docs: a leak");
    const result = CLI(["--root", t.root, "--base", t.base, "--json"]);
    assert.equal(result.status, 1);
    const document = JSON.parse(result.stdout);
    assert.equal(document.schema, "secret-scan@1");
    assert.equal(document.verdict, "FAIL");
    assert.equal(document.mode, "range");
    assert.equal(document.findings.length, 1);
    assert.equal(document.findings[0].file, "leak.md");
  } finally {
    fs.rmSync(t.root, { recursive: true, force: true });
  }
});

/* A repo-local fixture that keeps the helper above free of duplicated `finally`
 * blocks: the range cases use it, and every caller removes the tree. */
function fixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "secret-scan-"));
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, "seed.txt"), "nothing to see here\n");
  fs.writeFileSync(path.join(root, "docs", "notes.md"), "# Notes\n\nA clean page.\n");
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "seed: a clean tree"]);
  return {
    root,
    base: git(root, ["rev-parse", "HEAD"]).trim(),
    write(file, content) {
      const absolute = path.join(root, file);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, content);
    },
    allowlistFile(entries) {
      const target = path.join(root, "scripts");
      fs.mkdirSync(target, { recursive: true });
      fs.writeFileSync(path.join(target, "secret-scan-allowlist.json"), `${JSON.stringify(entries, null, 2)}\n`);
      return path.join("scripts", "secret-scan-allowlist.json");
    },
    commit(message) {
      git(root, ["add", "-A"]);
      git(root, ["commit", "-q", "-m", message]);
      return git(root, ["rev-parse", "HEAD"]).trim();
    },
  };
}
