/**
 * workflow-status-retention.test.mjs — the sensor's retention projection
 * (issue #651, S8).
 *
 * The sensor is where retention-debt becomes visible: a proved-merged unit whose
 * full carrier carries a stamp is a `pending_trim` row, a document with no stamp
 * is declared out of scope, and the archive command reaches `next.continuation`
 * only when the project configured the trim step and the resolver has nothing
 * actionable to recommend. The predicate is the schema package's, shared with the
 * write path — this suite proves the sensor consumes it, not that it re-derives
 * it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

const SPEC = `---
type: feature
scope: small
---

# 42 — example

> One-line: an example unit.

\`\`\`text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
\`\`\`

## Specs

**S1 — do the thing.**
> verbatim ask

## Acceptance criteria

1. **AC1 (S1)** — the thing is done.

## Impact

none

## Non-goals

none

## Future cost

none

## Applicable tests

- \`true\`

## Known pre-existing issues

none

## Tasks

- P1 — do it (validator: \`true\` exits 0)
  (Implements: S1)

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-20, the request, verbatim:
  \`\`\`
  do the thing
  \`\`\`

## Next

ship it

## References

none
`;

const GIT_ID = ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false"];

function fixture(t, mode) {
  const root = mkdtempSync(join(tmpdir(), "aw-retention-sensor-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, text);
  };
  write("docs/ROADMAP.md", [
    "# Roadmap",
    "",
    "## Features",
    "",
    "| NN | Slug | Status | Dependencies | Summary |",
    "|---|---|---|---|---|",
    "| 42 | `example` | done | — | shipped |",
    "| 43 | `ancient` | done | — | unstamped |",
    "| 44 | `open` | in-progress | — | in flight |",
    "",
    "## Fixes",
    "",
    "| Issue | Topic | Status |",
    "|---|---|---|",
    "",
  ].join("\n"));
  write("docs/features/42-example/SPEC.md", SPEC);
  write("docs/features/42-example/progress.md", "progress body");
  write("docs/features/43-ancient/SPEC.md", SPEC.replace(/```text\ndoc-provenance@1[\s\S]*?```\n/u, ""));
  write("docs/features/44-open/SPEC.md", SPEC);
  write(".pi/agentic-workflow.json", JSON.stringify({ docRetention: { mode } }));
  write(".gitignore", ".agentic-workflow/\n");
  const git = (...args) => execFileSync("git", [...GIT_ID, ...args], { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("commit", "-qm", "chore(651): fixture");
  return root;
}

const envelopeOf = (root) => {
  const stdout = execFileSync(process.execPath, [BIN, "workflow-status", "--json-only"], { cwd: root, encoding: "utf8" });
  return JSON.parse(stdout);
};

test("the sensor reports every candidate and every out-of-scope document", (t) => {
  const root = fixture(t, "archive");
  const envelope = envelopeOf(root);
  assert.ok(envelope.detail.retention, "detail.retention is present");
  assert.deepEqual(envelope.detail.retention.pending_trim.map((row) => row.unit), ["docs/features/42-example"]);
  const [pending] = envelope.detail.retention.pending_trim;
  assert.equal(pending.state, "eligible");
  assert.deepEqual(pending.files, ["progress.md"]);
  assert.match(pending.command, /^agentic-workflow doc archive --unit docs\/features\/42-example$/u);
  assert.deepEqual(envelope.detail.retention.out_of_scope.map((row) => [row.unit, row.state]), [
    ["docs/features/43-ancient", "unstamped"],
  ]);
});

test("the archive command reaches next.continuation only on the nothing-to-do fallback", (t) => {
  const root = fixture(t, "archive");
  const envelope = envelopeOf(root);
  assert.equal(envelope.next.recommended, "/workflow-status", "the fixture resolves the idle fallback");
  assert.ok(envelope.next.continuation, "a continuation is projected");
  assert.match(envelope.next.continuation.argv.join(" "), /^agentic-workflow doc archive --unit docs\/features\/42-example$/u);
  assert.equal(envelope.next.continuation.convergence, "detail.retention.pending_trim");
});

test("keep-all still reports the rows and withholds the offer", (t) => {
  const root = fixture(t, "keep-all");
  const envelope = envelopeOf(root);
  assert.deepEqual(envelope.detail.retention.pending_trim.map((row) => row.unit), ["docs/features/42-example"]);
  const argv = envelope.next.continuation?.argv?.join(" ") ?? "";
  assert.doesNotMatch(argv, /doc archive/u, "the trim step is not offered while the project keeps everything");
});

test("the project's config gates the offer only: the envelope stays valid either way", (t) => {
  const root = fixture(t, "archive");
  const envelope = envelopeOf(root);
  // A second read is byte-stable: the projection is deterministic and writes nothing.
  const again = envelopeOf(root);
  assert.deepEqual(again.detail.retention, envelope.detail.retention);
});
