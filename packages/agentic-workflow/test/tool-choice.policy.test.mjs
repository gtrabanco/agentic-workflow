// tool-choice.policy.test.mjs — the shell-tool-choice policy (issue #610).
//
// The policy module is the one allowlist and the one classifier both enforcement
// layers read: the pi extension's `tool_call` carrier blocks/rewrites with it, and
// `scripts/invocation-drift.mjs` imports its bootstrap set instead of keeping a
// second copy. So this suite pins three things at once:
//
//   * the classifier's decisions (search vs filter, default node vs sanctioned),
//   * the forwarding tables against the tools the repository pins (rg 15's `-E`
//     is an encoding, `-r` a replacement, `--include` does not exist),
//   * the measured drift corpus: the segments the audited authoring sessions
//     actually issued, frozen as `test/fixtures/tool-choice-corpus.json`, which
//     is the frozen-failure corpus this unit is done when it passes.
//
// Every case is named `F<n>` so the unit doc's obligation rows can cite it.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  BOOTSTRAP_SCRIPTS,
  NODE_SANCTIONED_SCRIPTS,
  analyzeToolChoice,
  classifySegment,
  forwardCommand,
  forwardGrepSegment,
  forwardNodeSegment,
  splitCommandSegments,
} from "../src/tool-choice/policy.mjs";
import { TOOL_CHOICE_TOOLS, resolveToolChoiceAvailability } from "../src/tool-choice/availability.mjs";

const CORPUS = JSON.parse(
  readFileSync(new URL("./fixtures/tool-choice-corpus.json", import.meta.url), "utf8"),
);

const only = (command) => {
  const { violations } = analyzeToolChoice(command);
  assert.equal(violations.length, 1, `expected exactly one violation for ${JSON.stringify(command)}`);
  return violations[0];
};

const none = (command) => {
  const { violations } = analyzeToolChoice(command);
  assert.deepEqual(violations, [], `expected no violation for ${JSON.stringify(command)}`);
};

test("F1 — the issue's reproducer is classed as search and forwards to rg", () => {
  const violation = only("grep -n 'x' file");
  assert.equal(violation.kind, "grep-search");
  assert.equal(violation.suggestion, "rg -n 'x' file");
  assert.equal(violation.rewritable, true);
  assert.match(violation.reason, /rg -n 'x' file/);
  assert.match(violation.reason, /AGENTS\.md/, "the reason cites the prose owner, never restates the rule");
  assert.doesNotMatch(violation.reason, /bun before node/i);
});

test("F2 — a pipe-fed grep is a filter, not search, and passes", () => {
  none("rg -l foo . | grep -v bar");
  none("cat f | grep -c x");
  none("git log --oneline | grep -E 'a|b'");
  none("printf 'a\\nb\\n' | grep -i '^a'");
  none("printf 'a\\nb\\n' | grep -v a | grep -c b");
});

test("F3 — recursion without a path operand is still search", () => {
  const violation = only("grep -rn 'x' scripts/");
  assert.equal(violation.kind, "grep-search");
  assert.equal(violation.suggestion, "rg -n 'x' scripts/");
  assert.equal(violation.rewritable, true);
});

test("F4 — the forwarding table drops what rg spells differently", () => {
  assert.equal(forwardGrepSegment(["grep", "-E", "a|b", "f"]), "rg 'a|b' f");
  assert.equal(forwardGrepSegment(["grep", "-r", "--include=*.mjs", "x", "."]), "rg -g '*.mjs' x .");
  assert.equal(forwardGrepSegment(["grep", "-rnE", "a|b", "."]), "rg -n 'a|b' .");
  assert.equal(forwardGrepSegment(["grep", "-P", "a\\w+", "f"]), "rg -P a\\w+ f");
  assert.equal(forwardGrepSegment(["grep", "-F", "x", "f"]), "rg -F x f");
  assert.equal(forwardGrepSegment(["grep", "--exclude-dir=node_modules", "x", "."]), "rg -g '!node_modules/**' x .");
  assert.equal(forwardGrepSegment(["egrep", "a|b", "f"]), "rg 'a|b' f");
  for (const flag of ["-E", "-r", "--include", "-R", "--recursive"]) {
    const forwarded = forwardGrepSegment(["grep", flag, "x", "f"]) ?? "";
    assert.ok(!forwarded.includes(flag), `the forwarded form never carries ${flag}: ${forwarded}`);
  }
});

test("F5 — a flag with no rg counterpart keeps its text but refuses the silent rewrite", () => {
  const violation = only("grep --exclude-from=list -n x .");
  assert.equal(violation.kind, "grep-search");
  assert.equal(violation.rewritable, false);
  assert.match(violation.suggestion, /^rg /);
  assert.match(violation.reason, /adjust/i);
});

test("F6 — node -e / node -p are the default-tool class and forward to bun", () => {
  const evaluate = only("node -e 'console.log(1)'");
  assert.equal(evaluate.kind, "node-default");
  assert.equal(evaluate.suggestion, "bun -e 'console.log(1)'");
  assert.match(evaluate.reason, /AGENTS\.md/);
  assert.equal(only("node -p '1+1'").suggestion, "bun -p '1+1'");
  assert.equal(only("FOO=1 node -e 'x'").suggestion, "FOO=1 bun -e 'x'", "an env prefix survives the swap");
});

test("F7 — a node invocation of a package script is the same class", () => {
  const violation = only("node packages/agentic-workflow/bin/agentic-workflow.mjs journal write --kind narrative");
  assert.equal(violation.kind, "node-default");
  assert.equal(
    violation.suggestion,
    "bun packages/agentic-workflow/bin/agentic-workflow.mjs journal write --kind narrative",
  );
  assert.equal(only("node scripts/session-close.mjs close 2>&1").suggestion, "bun scripts/session-close.mjs close 2>&1");
});

test("F8 — every sanctioned node form passes untouched", () => {
  none("node --test scripts/invocation-drift.test.mjs");
  none("node --test --test-timeout=10000 test/*.test.mjs");
  none("node scripts/run-root-suite.mjs");
  none("node scripts/run-root-suite.mjs --jobs 1");
  none("node scripts/setup-env.mjs --check");
  none("node scripts/update-tools.mjs");
  none("node --version");
  none("node -v");
  none("node --help");
  for (const script of NODE_SANCTIONED_SCRIPTS) {
    assert.deepEqual(BOOTSTRAP_SCRIPTS.has(script) || script === "scripts/run-root-suite.mjs", true, `${script} is a declared sanctioned script`);
    none(`node ${script}`);
  }
});

test("F9 — quotes hold operators and patterns together", () => {
  const violation = only("grep -n \"^| gate\" docs/workflow/GATE_INVENTORY.md");
  assert.equal(violation.suggestion, "rg -n \"^| gate\" docs/workflow/GATE_INVENTORY.md");
  assert.equal(splitCommandSegments("grep -n \"^| gate\" docs/a.md").length, 1);
  none("echo 'a | grep b'");
  assert.equal(splitCommandSegments("rg x . | grep -v y && echo done").length, 3);
});

test("F10 — a mere mention is not an invocation", () => {
  none("echo node");
  none("rg -n 'node' scripts/");
  none("cat node.md");
  none("ls grep");
  none("bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs");
});

test("F11 — the measured drift corpus replays: every search and default is classed, every filter passes", () => {
  assert.equal(CORPUS.contract, "tool-choice-corpus@1");
  const counts = { "grep-search": 0, "node-default": 0, pass: 0 };
  for (const entry of CORPUS.entries) {
    const decision = classifySegment({ operator: entry.operator, text: entry.text });
    assert.equal(decision.kind, entry.expect, `${entry.id} (${entry.text.slice(0, 60)}) must be ${entry.expect}`);
    counts[entry.expect] += 1;
  }
  assert.equal(counts["grep-search"], 8, "the corpus carries 8 de-duplicated search segments");
  assert.equal(counts["node-default"], 7, "the corpus carries 7 de-duplicated node-as-default segments");
  assert.equal(counts.pass, 18, "the corpus carries 18 de-duplicated filter segments");
});

test("F12 — boundaries are stated, not guessed: a nested shell, xargs and git are not intercepted", () => {
  none("bash -c 'grep -n x f'");
  none("xargs grep -n x");
  none("git grep -n 'x'");
  none("find . -name '*.mjs' -exec grep -l x {} +");
});

test("F13 — an empty or malformed command never throws and never accuses", () => {
  for (const command of ["", "   ", "\n", "grep", "grep -n 'unterminated", undefined, null, 42]) {
    const result = analyzeToolChoice(command);
    assert.deepEqual(result.violations, [], `no violation from ${JSON.stringify(command)}`);
  }
});

test("F14 — the allowlist is one declaration, and the bootstrap pair is inside it", () => {
  assert.deepEqual([...BOOTSTRAP_SCRIPTS.keys()].sort(), ["scripts/setup-env.mjs", "scripts/update-tools.mjs"]);
  for (const script of BOOTSTRAP_SCRIPTS.keys()) {
    assert.ok(NODE_SANCTIONED_SCRIPTS.includes(script), `${script} is a sanctioned form`);
  }
  assert.ok(Object.isFrozen(NODE_SANCTIONED_SCRIPTS), "the published list is frozen");
  for (const reason of BOOTSTRAP_SCRIPTS.values()) assert.match(reason, /#\d{3}/, "each bootstrap row cites its issue");
});

test("F15 — a bare interpreter is an invocation, not a mention", () => {
  const violation = only("node");
  assert.equal(violation.kind, "node-default");
  assert.equal(violation.suggestion, "bun");
});

test("F16 — the rebuilt command never introduces a shell operator", () => {
  assert.equal(forwardGrepSegment(["grep", "-n", "a|b", "f"]), "rg -n 'a|b' f");
  assert.equal(forwardGrepSegment(["grep", "-n", "a;b", "f"]), "rg -n 'a;b' f");
  assert.equal(forwardGrepSegment(["grep", "-n", "x", "f", "2>&1"]), "rg -n x f 2>&1");
  assert.equal(forwardNodeSegment(["node", "-e", "a; b"]), "bun -e 'a; b'");
});

test("F17 — the forwarding helpers refuse a non-matching head", () => {
  assert.equal(forwardGrepSegment(["rg", "-n", "x", "f"]), null);
  assert.equal(forwardNodeSegment(["bun", "-e", "x"]), null);
  assert.equal(forwardNodeSegment(["node", "--test", "a.test.mjs"]), null, "a sanctioned form has no forwarded twin");
});

test("F18 — the forwarded command keeps every non-violating segment byte for byte", () => {
  assert.equal(
    forwardCommand("cd /repo && grep -rn 'x' scripts/ | head -5", ["grep-search"]),
    "cd /repo && rg -n 'x' scripts/ | head -5",
  );
  assert.equal(
    forwardCommand("ls -la; node -p 'process.version'; rg x .", ["node-default"]),
    "ls -la; bun -p 'process.version'; rg x .",
  );
  assert.equal(
    forwardCommand("grep -v x | grep -c y", ["grep-search"]),
    "grep -v x | grep -c y",
    "a filter is never rewritten, even when the kind is requested",
  );
  assert.equal(
    forwardCommand("node --test scripts/a.test.mjs && node -e '1'", ["node-default"]),
    "node --test scripts/a.test.mjs && bun -e '1'",
    "the sanctioned form survives while the default beside it is forwarded",
  );
  assert.equal(forwardCommand("grep --exclude-from=list -n x .", ["grep-search"]), "grep --exclude-from=list -n x .", "a refused rewrite leaves the command alone");
  assert.equal(forwardCommand("", ["grep-search"]), "");
});

test("F19 — each type projection declares exactly its module's exports", async () => {
  for (const name of ["policy", "availability"]) {
    const source = readFileSync(new URL(`../src/tool-choice/${name}.d.mts`, import.meta.url), "utf8");
    const declared = [...source.matchAll(/export declare (?:const|function|interface) (\w+)/gu)].map((match) => match[1]);
    const module = await import(`../src/tool-choice/${name}.mjs`);
    const runtime = Object.keys(module).filter((key) => key !== "default");
    assert.deepEqual(declared.sort(), runtime.sort(), `${name}.d.mts and ${name}.mjs export different names`);
  }
});

test("F20 — availability comes from the doctor's resolver and an unresolvable answer is absent", () => {
  const has = (present) => ({ find: (name) => (present.includes(name) ? `/usr/bin/${name}` : null) });
  assert.deepEqual(resolveToolChoiceAvailability(has(["rg", "bun"])), { rg: true, bun: true });
  assert.deepEqual(resolveToolChoiceAvailability(has(["rg"])), { rg: true, bun: false });
  assert.deepEqual(resolveToolChoiceAvailability(has([])), { rg: false, bun: false });
  assert.deepEqual(
    resolveToolChoiceAvailability({ find: () => { throw new Error("EACCES"); } }),
    { rg: false, bun: false },
    "an unreadable PATH stands the carrier down rather than failing the turn",
  );
  assert.deepEqual(TOOL_CHOICE_TOOLS, ["rg", "bun"], "the resolver probes exactly the tools the policy forwards to");
});

test("F21 — a quoted glob value is de-quoted before the -g value is re-quoted", () => {
  // External verify 2026-11-17 B1: the translated `-g` value wrapped input that
  // still carried its own quotes, so `--include='*.ts'` forwarded as
  // `rg -g ''*.ts'' …` — the shell strips both pairs and globs the result, which
  // is a rewrite into a different command. The wrapper owns the quoting; the
  // input's quotes are not part of the value.
  assert.equal(
    classifySegment({ operator: "", text: "grep --include='*.ts' -rn TODO src" }).suggestion,
    "rg -g '*.ts' -n TODO src",
  );
  assert.equal(
    classifySegment({ operator: "", text: 'grep --include="*.ts" -rn TODO src' }).suggestion,
    "rg -g '*.ts' -n TODO src",
  );
  assert.equal(
    classifySegment({ operator: "", text: "grep --exclude='*.log' -n x ." }).suggestion,
    "rg -g '!*.log' -n x .",
  );
  assert.equal(
    classifySegment({ operator: "", text: "grep --exclude-dir='node_modules' -rn 'x' ." }).suggestion,
    "rg -g '!node_modules/**' -n 'x' .",
  );
  assert.equal(
    classifySegment({ operator: "", text: "grep --include='my file.ts' -n x ." }).suggestion,
    "rg -g 'my file.ts' -n x .",
    "a value with a space stays one shell word after the de-quote",
  );
  assert.match(
    analyzeToolChoice("grep --include='*.ts' -rn TODO src").violations[0].reason,
    /`rg -g '\*\.ts' -n TODO src`/,
    "the reason the model reads carries the shell-safe equivalent",
  );
  // Differential: the unquoted spelling keeps its exact bytes — only the
  // double-quoted value class moves.
  assert.equal(forwardGrepSegment(["grep", "-r", "--include=*.mjs", "x", "."]), "rg -g '*.mjs' x .");
});
