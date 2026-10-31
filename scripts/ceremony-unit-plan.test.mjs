/**
 * ceremony-unit-plan.test.mjs — ceremony `unit` + `plan` modules (fix #338, P6).
 *
 * Fixtures: hermetic temp repos seeded with the repo's own templates
 * (PE-005). Pins unit CRUD + list + select-next + descope, plan ops over the
 * `## Tasks` section (tick convention PE-008), and the delegation contracts:
 * `unit triage`/`route` → unit-route.mjs (PE-001), `plan lint` →
 * phase-lint.mjs (PE-002).
 */

import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cer, makeRepo, unitDoc } from "./ceremony/testing.mjs";

const REPO = path.resolve(import.meta.dirname, "..");

/** Fixture repo with the repo's unit-doc templates copied in. */
function makeTemplateRepo() {
  const dir = makeRepo();
  for (const t of ["docs/fix/_TEMPLATE/SPEC.md", "docs/features/_TEMPLATE/SPEC.md"]) {
    fs.mkdirSync(path.join(dir, path.dirname(t)), { recursive: true });
    fs.copyFileSync(path.join(REPO, t), path.join(dir, t));
  }
  return dir;
}

function makeUnit({ tasks = "", log = "", findings = "" } = {}) {
  const dir = makeRepo();
  fs.mkdirSync(path.join(dir, "docs/fix/1-fixture"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), unitDoc({ tasks, log, findings }));
  return dir;
}

const GOOD_TASKS = `- P1 — do the thing (validator: \`true\` exits 0)
  (Implements: S1)
  Relevant files: docs/fix/1-fixture/SPEC.md
- P2 — do the other thing (validator: \`true\` exits 0)
  (Implements: S1)`;

test("unit create copies the repo template with the slug and issue filled (S2, S4)", () => {
  const dir = makeTemplateRepo();
  const r = cer(["unit", "create", "--slug", "5-my-fix", "--type", "fix", "--issue", "5"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.created, true);
  const md = fs.readFileSync(path.join(dir, "docs/fix/5-my-fix/SPEC.md"), "utf8");
  assert.match(md, /^# fix\/5-my-fix$/m);
  assert.match(md, /`#5` — tracked issue/);
  assert.ok(!md.includes("#<n>") || md.includes("`#5`"), "issue placeholder replaced");
  assert.equal(cer(["unit", "create", "--slug", "5-my-fix", "--type", "fix"], dir).json.error, "unit-exists");
  assert.equal(cer(["unit", "create", "--slug", "Bad Slug", "--type", "fix"], dir).json.error, "invalid-slug");
  assert.equal(cer(["unit", "create", "--slug", "6-x", "--type", "epic"], dir).json.error, "invalid-type");
});

test("unit read reports sections, counts and the git blob sha", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  const r = cer(["unit", "read", "--slug", "1-fixture"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.type, "fix");
  assert.ok(r.json.sections.includes("Tasks"));
  assert.equal(r.json.counts.tasks, 2);
  assert.match(r.json.sha, /^[0-9a-f]{40}$/);
});

test("unit update: section replace, full rewrite, unknown section → exit 1 (S7)", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  const u = cer(["unit", "update", "--slug", "1-fixture", "--section", "next", "--content", "P3 — all done"], dir);
  assert.equal(u.code, 0);
  const md = fs.readFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), "utf8");
  assert.match(md, /## Next\n\nP3 — all done/);
  const full = cer(["unit", "update", "--slug", "1-fixture", "--section", "full", "--content", "# fix/1-fixture\n\n## Next\n\nfresh"], dir);
  assert.equal(full.code, 0);
  assert.match(fs.readFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), "utf8"), /^# fix\/1-fixture\n\n## Next\n\nfresh/);
  assert.equal(cer(["unit", "update", "--slug", "1-fixture", "--section", "bogus", "--content", "x"], dir).json.error, "unknown-section");
});

test("unit update --section tasks preserves the ### ledger embeds", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  const withEmbed = fs.readFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), "utf8")
    .replace("## Findings", "### Planning evidence\n\n| id |\n|---|\n\n## Findings");
  fs.writeFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), withEmbed);
  const r = cer(["unit", "update", "--slug", "1-fixture", "--section", "tasks", "--content", "- P1 — only task (validator: `true` exits 0)\n  (Implements: S1)"], dir);
  assert.equal(r.code, 0);
  const md = fs.readFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), "utf8");
  assert.match(md, /### Planning evidence/);
  assert.match(md, /- P1 — only task/);
  assert.ok(md.indexOf("### Planning evidence") < md.indexOf("## Findings"));
});

test("unit delete removes the unit dir; unit list reports type + registration status", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  const list = cer(["unit", "list"], dir);
  assert.equal(list.code, 0);
  const row = list.json.units.find((u) => u.slug === "1-fixture");
  assert.equal(row.type, "fix");
  assert.equal(row.status, "unregistered");
  const del = cer(["unit", "delete", "--slug", "1-fixture"], dir);
  assert.equal(del.code, 0);
  assert.ok(!fs.existsSync(path.join(dir, "docs/fix/1-fixture")));
  assert.equal(cer(["unit", "read", "--slug", "1-fixture"], dir).json.error, "unknown-slug");
});

test("unit select-next: first task without a P log line; null when all logged", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS, log: "- **P1** — 2026-11-24 10:00, did the thing · abc1234." });
  const r = cer(["unit", "select-next", "--slug", "1-fixture"], dir);
  assert.equal(r.json["next-step"], "P2");
  const done = makeUnit({ tasks: GOOD_TASKS, log: "- **P1** — 2026-11-24 10:00, a · s.\n- **P2** — 2026-11-24 10:05, b · s." });
  assert.equal(cer(["unit", "select-next", "--slug", "1-fixture"], done).json["next-step"], null);
});

test("unit descope records the approved descope line in Acceptance criteria (S5)", () => {
  const dir = makeUnit();
  const r = cer(["unit", "descope", "--slug", "1-fixture", "--criterion", "2", "--approved-by", "owner"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json["descope-recorded"], true);
  const md = fs.readFileSync(path.join(dir, "docs/fix/1-fixture/SPEC.md"), "utf8");
  assert.match(md, /- \*\*AC-S2 descope\*\* — approved-by owner · \d{4}-\d{2}-\d{2} · descope-recorded/);
});

test("unit triage delegates to unit-route.mjs and propagates its exit codes (O5, PE-001)", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  execFileSync("git", ["add", "."], { cwd: dir });
  execFileSync("git", ["commit", "-m", "docs: fixture unit"], { cwd: dir });
  // The minimal fixture lacks unit-route's mandatory sections → its own
  // TRIAGE ERROR block, propagated as the exit-2 ceremonial block (S6).
  const blocked = cer(["unit", "triage", "--slug", "1-fixture"], dir);
  assert.equal(blocked.code, 2);
  assert.equal(blocked.json.blocked, true);
  assert.match(blocked.json.output, /TRIAGE ERROR/);
  const unknown = cer(["unit", "triage", "--slug", "nope"], dir);
  assert.equal(unknown.code, 1);
});

test("plan create/read/update/delete over the Tasks section (S5, S7, O8)", () => {
  const dir = makeUnit();
  const tasks = JSON.stringify([
    { n: 1, label: "first", spec: "S1", files: "a.md" },
    { n: 2, label: "second", spec: "S1" },
  ]);
  const c = cer(["plan", "create", "--slug", "1-fixture", "--tasks", tasks], dir);
  assert.equal(c.code, 0);
  assert.equal(c.json.tasks, 2);
  const read = cer(["plan", "read", "--slug", "1-fixture"], dir);
  assert.equal(read.json.tasks.length, 2);
  assert.equal(read.json.tasks[0].ticked, false);
  const up = cer(["plan", "update", "--slug", "1-fixture", "--task", "1", "--label", "renamed"], dir);
  assert.equal(up.code, 0);
  assert.equal(cer(["plan", "read", "--slug", "1-fixture"], dir).json.tasks[0].label, "renamed");
  const del = cer(["plan", "update", "--slug", "1-fixture", "--task", "2", "--delete"], dir);
  assert.equal(del.code, 0);
  assert.equal(cer(["plan", "read", "--slug", "1-fixture"], dir).json.tasks.length, 1);
  const clear = cer(["plan", "delete", "--slug", "1-fixture"], dir);
  assert.equal(clear.code, 0);
  assert.deepEqual(cer(["plan", "read", "--slug", "1-fixture"], dir).json.tasks, []);
});

test("plan execute / execute-all flip the PE-008 tick; check-tasks-ticks agrees (O8, PE-008)", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  const e = cer(["plan", "execute", "--slug", "1-fixture", "--step", "1"], dir);
  assert.equal(e.code, 0);
  let ticks = cer(["plan", "read", "--slug", "1-fixture"], dir).json.tasks;
  assert.deepEqual(ticks.map((t) => t.ticked), [true, false]);
  const all = cer(["plan", "execute-all", "--slug", "1-fixture"], dir);
  assert.equal(all.json.tasks, 2);
  ticks = cer(["plan", "read", "--slug", "1-fixture"], dir).json.tasks;
  assert.deepEqual(ticks.map((t) => t.ticked), [true, true]);
});

test("plan lint delegates to phase-lint.mjs: clean unit → exit 0 PASS; bad label → exit 2 (PE-002)", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  const good = cer(["plan", "lint", "--slug", "1-fixture"], dir);
  assert.equal(good.code, 0);
  assert.equal(good.json.verdict, "PASS");
  assert.match(good.json.fingerprint, /^[0-9a-f]{64}$/);
  const bad = makeUnit({ tasks: "- Step 1 — bad label (validator: `true` exits 0)\n  (Implements: S1)" });
  const blocked = cer(["plan", "lint", "--slug", "1-fixture"], bad);
  assert.equal(blocked.code, 2);
  assert.equal(blocked.json.blocked, true);
  assert.match(blocked.json.verdict, /BLOCKED/);
});

test("unknown unit/plan subcommand and missing slug → exit 1", () => {
  const dir = makeUnit({ tasks: GOOD_TASKS });
  assert.equal(cer(["unit", "teleport"], dir).code, 1);
  assert.equal(cer(["plan", "teleport"], dir).code, 1);
  assert.equal(cer(["plan", "read"], dir).json.error, "missing-flag");
  assert.equal(cer(["unit", "read", "--slug", "nope"], dir).json.error, "unknown-slug");
});
