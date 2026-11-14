/**
 * The feedback channel's corpus (issue #424).
 *
 * One case per declared rule: the published tier vocabulary, the flag grammar
 * that makes `--debug` / `--profile` acceptable to every subcommand, the regular
 * tier's start / stage / progress / done lines, the quiet-until-matters
 * threshold, the debug tier's per-unit trace, the profile tier's stage table,
 * the quiet suppression `doc --sync --quiet` owes its hook consumers, and the
 * invariant that feedback never reaches stdout or the envelope.
 *
 * Timing is never measured by luck: the channel takes `now`, `write`,
 * `schedule` and `register` as seams, so every tier case drives a fake clock and
 * captures the lines. Only the `doc` cases spawn the real bin, and they assert
 * content, not wall-clock behaviour.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok, match } from "node:assert";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FEEDBACK_PROGRESS_EVERY_MS,
  FEEDBACK_START_AFTER_MS,
  FEEDBACK_TIERS,
  NO_FEEDBACK,
  createFeedback,
  formatDuration,
  parseFeedbackArgs,
} from "../src/feedback/index.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const SRC = fileURLToPath(new URL("../src", import.meta.url));

const kindOf = (line) => (line.startsWith("feedback: ") ? line.slice(10).split(" ")[0] : null);
const kinds = (lines) => lines.map(kindOf);

/** A channel over a fake clock and a captured line sink. */
function harness(options = {}) {
  const lines = [];
  const clock = { t: 1000 };
  const channel = createFeedback({
    subject: options.subject ?? "agentic-workflow doc",
    ...options,
    now: () => clock.t,
    write: (line) => lines.push(line),
    schedule: () => ({ unref() {} }),
    register: (fn) => {
      clock.onExit = fn;
    },
  });
  return { channel, lines, clock };
}

describe("feedback — the published vocabulary", () => {
  it("publishes exactly the three tiers, in order (S3)", () => {
    deepStrictEqual([...FEEDBACK_TIERS], ["regular", "debug", "profile"]);
    ok(Object.isFrozen(FEEDBACK_TIERS));
  });

  it("owns the two declared budgets as published constants (S2, S3)", () => {
    strictEqual(FEEDBACK_START_AFTER_MS, 250);
    strictEqual(FEEDBACK_PROGRESS_EVERY_MS, 100);
  });

  it("defines createFeedback exactly once in the crate source (S4)", () => {
    const hits = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.name.endsWith(".mjs")) continue;
        if (/export function createFeedback\b/.test(readFileSync(full, "utf8"))) hits.push(full);
      }
    };
    walk(SRC);
    strictEqual(hits.length, 1, `createFeedback must have one home, found: ${hits.join(", ")}`);
    ok(hits[0].endsWith(join("feedback", "index.mjs")));
  });
});

describe("feedback — the flag grammar (S3, S4)", () => {
  it("leaves argv untouched and answers regular when no tier flag is given", () => {
    deepStrictEqual(parseFeedbackArgs(["doc", "--sync"]), { tier: "regular", args: ["doc", "--sync"] });
  });

  it("strips --debug from anywhere in argv", () => {
    deepStrictEqual(parseFeedbackArgs(["doc", "--debug", "--sync"]), { tier: "debug", args: ["doc", "--sync"] });
    deepStrictEqual(parseFeedbackArgs(["doc", "--sync", "--debug"]), { tier: "debug", args: ["doc", "--sync"] });
  });

  it("strips --profile from anywhere in argv", () => {
    deepStrictEqual(parseFeedbackArgs(["phase-lint", "--profile", "doc.md"]), {
      tier: "profile",
      args: ["phase-lint", "doc.md"],
    });
  });

  it("lets --profile outrank --debug and keeps the command's own flags in order (D4)", () => {
    deepStrictEqual(parseFeedbackArgs(["--debug", "doc", "--profile", "--sync", "--json-only"]), {
      tier: "profile",
      args: ["doc", "--sync", "--json-only"],
    });
  });
});

describe("feedback — the regular tier (S2)", () => {
  it("prints start, stage and done, and nothing else", () => {
    const { channel, lines, clock } = harness();
    channel.start();
    channel.stage("scan", () => 1);
    channel.detail("provider: configured");
    clock.t += 1240;
    channel.done("12 files, 3 changed");
    deepStrictEqual(kinds(lines), ["start", "stage", "done"]);
    match(lines[0], /^feedback: start agentic-workflow doc$/);
    match(lines[1], /^feedback: stage scan$/);
    match(lines[2], /^feedback: done agentic-workflow doc · 12 files, 3 changed · 1\.24s$/);
  });

  it("announces once, however many events arrive", () => {
    const { channel, lines } = harness();
    channel.start();
    channel.stage("scan", () => 1);
    channel.progress({ done: 1, total: 2, unit: "files" });
    strictEqual(lines.filter((l) => kindOf(l) === "start").length, 1);
  });

  it("measures the duration from the channel's first breath, not from done()", () => {
    const { channel, lines, clock } = harness();
    clock.t += 1240;
    channel.start();
    channel.done("exit 0");
    match(lines.at(-1), /· 1\.24s$/);
  });
});

describe("feedback — the threshold (S2, D3)", () => {
  it("announces once the threshold fires, and reports the exit in the done line", () => {
    const lines = [];
    const clock = { t: 1000 };
    const channel = createFeedback({
      subject: "agentic-workflow verify",
      now: () => clock.t,
      write: (line) => lines.push(line),
      schedule: (fn) => {
        clock.flush = fn;
        return { unref() {} };
      },
      register: (fn) => {
        clock.onExit = fn;
      },
    });
    channel.attach();
    deepStrictEqual(lines, [], "an attached channel prints nothing before the threshold");
    clock.t += FEEDBACK_START_AFTER_MS;
    clock.flush();
    deepStrictEqual(kinds(lines), ["start"]);
    clock.t += 500;
    clock.onExit(3);
    deepStrictEqual(kinds(lines), ["start", "done"]);
    match(lines.at(-1), /^feedback: done agentic-workflow verify · exit 3 · 750ms$/);
  });

  it("keeps a fast universal run silent at the regular tier", () => {
    const lines = [];
    const clock = { t: 1000 };
    const channel = createFeedback({
      subject: "agentic-workflow config",
      now: () => clock.t,
      write: (line) => lines.push(line),
      schedule: () => ({ unref() {} }),
      register: (fn) => {
        clock.onExit = fn;
      },
    });
    channel.attach();
    clock.t += 20;
    clock.onExit(0);
    deepStrictEqual(lines, [], "a 20 ms command writes nothing at the regular tier");
  });

  it("announces immediately at any tier above regular", () => {
    const { channel, lines } = harness({ tier: "debug" });
    channel.attach();
    deepStrictEqual(kinds(lines), ["start"], "no threshold at the diagnostic tiers");
  });
});

describe("feedback — progress and the estimate (S2, S3)", () => {
  it("prints the first tick, the last tick, and throttles the middle ones", () => {
    const { channel, lines, clock } = harness();
    for (let done = 1; done <= 10; done += 1) {
      channel.progress({ done, total: 10, unit: "files" });
      clock.t += 1;
    }
    const progress = lines.filter((l) => kindOf(l) === "progress");
    strictEqual(progress.length, 2, `expected first+last, got: ${progress.join(" | ")}`);
    match(progress[0], /^feedback: progress 1\/10 files \(10%\)$/);
    match(progress[1], /^feedback: progress 10\/10 files \(100%\)$/);
  });

  it("repeats once the interval elapsed", () => {
    const { channel, lines, clock } = harness();
    channel.progress({ done: 1, total: 100, unit: "files" });
    clock.t += FEEDBACK_PROGRESS_EVERY_MS + 1;
    channel.progress({ done: 2, total: 100, unit: "files" });
    strictEqual(lines.filter((l) => kindOf(l) === "progress").length, 2);
  });

  it("appends a remaining estimate only when the rate makes one measurable", () => {
    const slow = harness();
    slow.channel.progress({ done: 1, total: 1000, unit: "files" });
    slow.clock.t += 5000;
    slow.channel.progress({ done: 2, total: 1000, unit: "files" });
    match(slow.lines.at(-1), /· ~[0-9]+m [0-9]{2}s left$/);

    const fast = harness();
    fast.channel.progress({ done: 1, total: 2, unit: "files" });
    fast.clock.t += 1;
    fast.channel.progress({ done: 2, total: 2, unit: "files" });
    strictEqual(fast.lines.at(-1).includes("left"), false, "no estimate for a sub-second rate");
  });
});

describe("feedback — the debug tier (S3)", () => {
  it("names every unit of work, unthrottled, and times each stage", () => {
    const { channel, lines, clock } = harness({ tier: "debug" });
    channel.stage("scan", () => 1);
    channel.stage("embed", () => {
      clock.t += 120;
      return 1;
    });
    for (let done = 1; done <= 3; done += 1) {
      channel.progress({ done, total: 3, unit: "files", detail: `docs/${done}.md` });
      clock.t += 1;
    }
    channel.detail("embed: provider=configured embedded=0");
    ok(lines.some((l) => l.includes("docs/2.md")), "every file is named, which the regular throttle would drop");
    strictEqual(lines.filter((l) => kindOf(l) === "progress").length, 3);
    ok(lines.some((l) => /^feedback: stage embed · 120ms$/.test(l)), `a stage carries its cost: ${lines.join(" | ")}`);
    ok(lines.some((l) => l.startsWith("feedback: detail embed: provider=configured")));
  });
});

describe("feedback — the profile tier (S3)", () => {
  it("prints one row per stage with its milliseconds and share, the total, and the bottleneck", () => {
    const { channel, lines, clock } = harness({ tier: "profile" });
    channel.stage("scan", () => {
      clock.t += 200;
      return 1;
    });
    channel.stage("embed", () => {
      clock.t += 700;
      return 1;
    });
    channel.stage("stats", () => {
      clock.t += 100;
      return 1;
    });
    channel.done("12 files");
    channel.profile();
    const block = lines.filter((l) => l.startsWith("FEEDBACK PROFILE"));
    strictEqual(block.length, 1, `one profile block, got: ${block.join(" | ")}`);
    const table = lines.slice(lines.indexOf(block[0])).join("\n");
    match(table, /^FEEDBACK PROFILE — agentic-workflow doc · total 1\.00s$/m);
    match(table, /^\s+scan\s+200ms\s+20%$/m);
    match(table, /^\s+embed\s+700ms\s+70%$/m);
    match(table, /^\s+stats\s+100ms\s+10%$/m);
    match(table, /bottleneck: embed \(700ms, 70% of total\)/);
  });
});

describe("feedback — quiet and the no-op (S7)", () => {
  it("suppresses the regular tier entirely, which is what doc --quiet owes (AC23)", () => {
    const { channel, lines } = harness({ quiet: true });
    channel.start();
    channel.stage("scan", () => 1);
    channel.progress({ done: 1, total: 1, unit: "files" });
    channel.detail("nope");
    channel.done("12 files");
    channel.profile();
    deepStrictEqual(lines, []);
  });

  it("still speaks when a tier is explicitly requested beside --quiet (D4)", () => {
    const { channel, lines } = harness({ quiet: true, tier: "debug" });
    channel.start();
    channel.detail("explicit");
    deepStrictEqual(kinds(lines), ["start", "detail"]);
  });

  it("NO_FEEDBACK accepts every call and changes nothing", () => {
    strictEqual(NO_FEEDBACK.start(), undefined);
    strictEqual(NO_FEEDBACK.stage("scan", () => 42), 42, "the no-op returns what the wrapped work returned");
    strictEqual(NO_FEEDBACK.progress({ done: 1, total: 2 }), undefined);
    strictEqual(NO_FEEDBACK.detail("x"), undefined);
    strictEqual(NO_FEEDBACK.done("x"), undefined);
    strictEqual(NO_FEEDBACK.profile(), undefined);
    strictEqual(NO_FEEDBACK.attach(), undefined);
  });
});

describe("feedback — durations", () => {
  it("formats the three scales the lines use", () => {
    strictEqual(formatDuration(0), "0ms");
    strictEqual(formatDuration(820), "820ms");
    strictEqual(formatDuration(1240), "1.24s");
    strictEqual(formatDuration(59_400), "59.40s");
    strictEqual(formatDuration(123_000), "2m 03s");
  });
});

// ── the doc CLI, spawned (S5, S7) ──────────────────────────────────────────

function seedCorpus(files = 3) {
  const root = mkdtempSync(join(tmpdir(), "feedback-cli-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  for (let i = 1; i <= files; i += 1) writeFileSync(join(root, `doc-${i}.md`), `# Doc ${i}\nbody ${i}\n`);
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync(
    "git",
    ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false", "commit", "-qm", "fixture"],
    { cwd: root },
  );
  return root;
}

const run = (args, cwd) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" });

describe("doc CLI — the frozen reproducer (S2, S5)", () => {
  it("a sync on a fresh corpus reports start, its stages, the per-file progress and the duration", () => {
    const root = seedCorpus(3);
    try {
      const r = run(["doc", "--sync"], root);
      strictEqual(r.status, 0, r.stderr);
      const seen = r.stderr.split("\n").filter((l) => l.startsWith("feedback: "));
      for (const kind of ["start", "stage", "progress", "done"]) {
        ok(seen.map(kindOf).includes(kind), `no ${kind} line: ${r.stderr}`);
      }
      match(r.stderr, /feedback: done agentic-workflow doc · .+ · [0-9.]+m?s$/m);
      strictEqual(r.stdout.includes("feedback"), false, "feedback never reaches stdout");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stdout is byte-identical with and without a tier flag (S7)", () => {
    const root = seedCorpus(3);
    try {
      // warm the store first, so both compared runs see the same corpus state
      strictEqual(run(["doc", "--sync"], root).status, 0);
      const plain = run(["doc", "--sync", "--json-only"], root);
      const profiled = run(["doc", "--sync", "--json-only", "--profile"], root);
      strictEqual(plain.status, 0, plain.stderr);
      strictEqual(profiled.status, 0, profiled.stderr);
      const strip = (s) => {
        const env = JSON.parse(s);
        delete env.store.path; // the store path is absolute, everything else must agree
        return JSON.stringify(env);
      };
      strictEqual(strip(profiled.stdout), strip(plain.stdout));
      ok(profiled.stderr.includes("FEEDBACK PROFILE"), "the profile block goes to stderr");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("--debug names every scanned file", () => {
    const root = seedCorpus(3);
    try {
      const r = run(["doc", "--sync", "--debug"], root);
      strictEqual(r.status, 0, r.stderr);
      for (const name of ["doc-1.md", "doc-2.md", "doc-3.md"]) {
        ok(r.stderr.includes(name), `--debug must name ${name}: ${r.stderr}`);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("--quiet writes nothing on a successful sync (unit 65 AC23)", () => {
    const root = seedCorpus(3);
    try {
      const r = run(["doc", "--sync", "--quiet"], root);
      strictEqual(r.status, 0, r.stderr);
      strictEqual(r.stderr, "", `--quiet must keep stderr empty, got: ${r.stderr}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("the tier flags are universal (S3, S6)", () => {
  it("a runner subcommand accepts --profile and keeps its own exit code and stdout", () => {
    const dir = mkdtempSync(join(tmpdir(), "feedback-tier-"));
    try {
      const doc = join(dir, "SPEC.md");
      writeFileSync(
        doc,
        [
          "# fix/1-fixture",
          "",
          "## Specs",
          "",
          "**S1 — do it.**",
          "> do it",
          "",
          "## Tasks",
          "",
          "- P1 — do the thing (validator: `true` exits 0)",
          "  (Implements: S1)",
          "",
        ].join("\n"),
      );
      const plain = run(["phase-lint", doc], dir);
      const profiled = run(["phase-lint", doc, "--profile"], dir);
      strictEqual(profiled.status, plain.status, `exit code must not move: ${profiled.stderr}`);
      strictEqual(profiled.stdout, plain.stdout, "stdout must not move");
      ok(profiled.stderr.includes("feedback: "), `the flag must be accepted: ${profiled.stderr}`);
      ok(profiled.stderr.includes("FEEDBACK PROFILE"), profiled.stderr);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("a command's own grammar is untouched by a tier flag it never saw", () => {
    const dir = mkdtempSync(join(tmpdir(), "feedback-tier-"));
    try {
      const plain = run(["doc", "--wat"], dir);
      strictEqual(plain.status, 1, "an unknown flag is still a usage error");
      match(plain.stderr, /unknown flag/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the bin attaches the universal channel once", () => {
  it("installs exactly one channel and one attachment in the dispatcher", () => {
    const text = readFileSync(BIN, "utf8");
    strictEqual((text.match(/createFeedback\(/g) || []).length, 1);
    strictEqual((text.match(/\.attach\(\)/g) || []).length, 1);
  });
});
