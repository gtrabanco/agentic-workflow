#!/usr/bin/env node

/**
 * promise-coherence.test.mjs — the guard's suite, and the frozen-failure corpus.
 *
 * Every case here is a defect class the review loop found and no gate caught
 * during unit 258's 12 review→fold cycles (issue #305). The fixtures under
 * `fixtures/promise-coherence/` carry the finding ids, so a future change that
 * makes one of them pass has to argue with the finding, not with the test.
 *
 * The last case runs the guard over the repository itself: the frozen classes
 * are rejected *and* the head is coherent. A guard that only fails is a guard
 * nobody keeps green.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CLAIM_KINDS, REASON_CODES, coherence, sweepFiles } from "./promise-coherence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = "scripts/fixtures/promise-coherence";
const fixture = (name) => `${FIXTURES}/${name}`;

/** The failures of one run, by kind, for a readable assertion. */
const failuresOf = (result) => result.claims.filter((claim) => claim.outcome === "fail");
const claimsMatching = (result, pattern) => result.claims.filter((claim) => pattern.test(claim.claim));

test("the claim-kind and reason vocabularies are closed and exported", () => {
  assert.deepEqual([...CLAIM_KINDS], [
    "validator",
    "formula",
    "measure",
    "surface",
    "removed-phrase",
    "section-length",
    "prerequisite",
    "contradiction",
    "sweep",
  ]);
  assert.deepEqual([...REASON_CODES], [
    "validator-mismatch",
    "formula-mismatch",
    "measure-mismatch",
    "surface-missing",
    "phrase-present",
    "claim-mismatch",
    "undisclosed-prerequisite",
    "contradicts-plan",
    "unparseable-claim",
    "no-claims",
    "missing-document",
    "sweep-mismatch",
  ]);
});

// ---------------------------------------------------------------------------
// #305 · F16 / F38 / F48 / F50 — a declared count that does not reproduce
// ---------------------------------------------------------------------------

test("#305 F16/F50: an Obligation row declaring `matches 4` while the command prints 0 fails closed", () => {
  const result = coherence([fixture("unit-doc-count.md")]);
  assert.equal(result.verdict, "BLOCKED: validator-mismatch");

  const obligation = result.claims.find((claim) => claim.kind === "validator" && claim.claim.includes("requires [a-z ]*input"));
  assert.ok(obligation, "the Obligation row's validator is read");
  assert.equal(obligation.outcome, "fail");
  assert.match(obligation.observed, /^0 \(exit 1\)$/);
  assert.equal(obligation.file, fixture("unit-doc-count.md"));
  assert.equal(obligation.line, 19, "the finding names the row's own line");
  assert.match(result.lines.join("\n"), /^Promise-coherence: validator scripts\/fixtures\/promise-coherence\/unit-doc-count\.md:19$/m);
});

test("#305 F38/F48: a task validator declaring `matches 4` against 7, and an Evidence row declaring 12 against 7", () => {
  const result = coherence([fixture("unit-doc-count.md")]);
  const task = claimsMatching(result, /changelog-sample\.md matches 4/)[0];
  const evidence = claimsMatching(result, /changelog-sample\.md matches 12/)[0];
  assert.equal(task.observed, "7", "the task's declared count is recounted");
  assert.equal(evidence.observed, "7", "the Evidence row's declared count is recounted");
  assert.equal(failuresOf(result).length, 3, "three declared counts, three failures — one per row");
});

test("#305 a claim the head does reproduce is reported as checked, never as a failure", () => {
  const result = coherence([fixture("unit-doc-count.md")]);
  const passing = result.claims.find((claim) => claim.kind === "validator" && claim.claim.includes("matches 7") && claim.outcome === "pass");
  assert.ok(passing, "the row whose command returns 7 passes");
  assert.match(result.lines.join("\n"), /^claims: 6 checked · 0 skipped$/m);
});

test("#305 `exits <N>` is compared against the command's exit code, not its output", () => {
  const result = coherence([fixture("unit-doc-count.md")]);
  const exitClaim = result.claims.find((claim) => claim.claim.includes("Required user inputs"));
  assert.equal(exitClaim.outcome, "pass");
  assert.equal(exitClaim.observed, "exit 0");
});

// ---------------------------------------------------------------------------
// #305 · the live reproducer — still on main today
// ---------------------------------------------------------------------------

test("#305 the closed unit 258 doc still declares `matches 12` for a command that returns 17", () => {
  // F16/F38/F50 were folded, then the folds moved the counts again. This is the
  // case that proves the class is live and not archaeology: the guard reads it
  // on demand, even though the default set skips closed units.
  const result = coherence(["docs/fix/258-harden-needs-input-contracts/SPEC.md"]);
  assert.equal(result.verdict, "BLOCKED: validator-mismatch");
  const declared = claimsMatching(result, /matches 12/);
  assert.ok(declared.length >= 1, "the doc's own `matches 12` claims are read");
  for (const claim of declared) {
    assert.equal(claim.outcome, "fail");
    assert.notEqual(claim.observed, "12", "the declared count does not reproduce at the head");
  }
});

// ---------------------------------------------------------------------------
// #305 · F55 — an acceptance promise about a shape the bytes contradict
// ---------------------------------------------------------------------------

test("#305 F55: a `3–5 line` promise against the shipped section's real length fails closed", () => {
  const result = coherence([fixture("unit-doc-length.md")]);
  assert.match(result.verdict, /^BLOCKED: (?:claim-mismatch|unparseable-claim)$/);
  const anchored = result.claims.find((claim) => claim.kind === "section-length" && claim.outcome === "fail" && claim.reason === "claim-mismatch");
  assert.ok(anchored, "the anchored length claim is recounted");
  assert.match(anchored.observed, /^\d+ lines$/);
  assert.ok(Number.parseInt(anchored.observed, 10) > 5, "the shipped section is longer than the promise");
});

test("#305 F55: a length promise naming no file and no section is uncheckable, so it fails closed", () => {
  const result = coherence([fixture("unit-doc-length.md")]);
  const unanchored = result.claims.find((claim) => claim.kind === "section-length" && claim.reason === "unparseable-claim");
  assert.ok(unanchored, "the unanchored length promise is refused instead of skipped");
  assert.match(unanchored.observed, /names no file and ## section/);
});

// ---------------------------------------------------------------------------
// #305 · F56 — a boundary that denies what the plan ships
// ---------------------------------------------------------------------------

test("#305 F56: Non-goals denying a new script while the tasks name one fails closed", () => {
  const result = coherence([fixture("unit-doc-contradiction.md")]);
  assert.equal(result.verdict, "BLOCKED: contradicts-plan");
  const contradiction = failuresOf(result).find((claim) => claim.kind === "contradiction");
  assert.equal(contradiction.line, 10);
  assert.match(contradiction.observed, /scripts\/needs-input\.mjs/);
});

test("#305 F56: the same Non-goals bullet naming the script itself is a stated boundary, not a contradiction", () => {
  // The rule is contradiction, not prohibition: a boundary that names the
  // exception it carves is exactly what the fold teaches authors to write.
  const directory = mkdtempSync(join(tmpdir(), "promise-coherence-"));
  try {
    const scoped = readFileSync(path.join(ROOT, fixture("unit-doc-contradiction.md")), "utf8")
      .replace(
        "- No new runtime script or machine gate for interactive input.",
        "- No new runtime script besides `scripts/needs-input.mjs`, the dispatcher AC8 requires.",
      );
    const file = join(directory, "unit-doc-contradiction-scoped.md");
    writeFileSync(file, scoped);
    const result = coherence([file]);
    assert.equal(result.claims.filter((claim) => claim.kind === "contradiction").length, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// #305 · F18 / F26 / F27 — a budget narration the bytes no longer support
// ---------------------------------------------------------------------------

test("#305 F18: a narration naming a surface the branch deleted fails closed", () => {
  const result = coherence([fixture("manifest-f18.json")]);
  const missing = failuresOf(result).find((claim) => claim.kind === "surface");
  assert.equal(missing.claim, "docs/features/_TEMPLATE/LEDGERS.md");
  assert.equal(missing.observed, "absent");
  assert.equal(missing.reason, "surface-missing");
});

test("#305 F18: a narration claiming a phrase is gone while the surface still carries it fails closed", () => {
  const result = coherence([fixture("manifest-f18.json")]);
  const present = failuresOf(result).find((claim) => claim.kind === "removed-phrase");
  assert.equal(present.claim, "three-tier");
  assert.equal(present.reason, "phrase-present");
  assert.match(present.observed, /present in skills\/init-workspace\//);
});

test("#305 F26: `ceil(<A> x 1.10) = <B>` is recomputed exactly, never in floating point", () => {
  const result = coherence([fixture("manifest-f18.json")]);
  const formula = failuresOf(result).find((claim) => claim.kind === "formula" && claim.claim.includes("3664"));
  assert.ok(formula, "ceil(3330 x 1.10) = 3664 is refused because 3330 x 1.10 is exactly 3663");
  assert.equal(formula.observed, "3663");
  // The same arithmetic is what makes the shipped manifest's 3663 correct: a
  // float implementation answers 3664 here and would fail the real entry.
  const head = coherence(["docs/workflow/SKILL_CONTEXT_BUDGETS.json"]);
  assert.equal(head.verdict, "PASS", head.lines.join("\n"));
});

test("#305 D1: a historical measurement basis is a disclosed skip line naming the basis, never silence", () => {
  const result = coherence([fixture("manifest-measure.json")]);
  const skips = result.lines.filter((line) => line.startsWith("skip: ") && line.includes("measured 3112 est / 246 lines"));
  assert.equal(skips.length, 1, result.lines.join("\n"));
  assert.match(skips[0], /historical basis dated \d{4}-\d{2}-\d{2}/);
  assert.match(skips[0], /re-checked only when the narration claims it for the head/);
  assert.ok(!result.claims.some((claim) => claim.claim.includes("measured 3112") && claim.outcome === "fail"),
    "history is never judged against the head");
});

test("#305 a `measured … at the head` claim is re-measured against the skill's own bytes", () => {
  // The F18/F26 class in its most direct form: the narration states the size the
  // ceiling rests on, for the head. `check-skill-context.mjs` owns the metric —
  // the guard reads its numbers and never carries a second copy of the formula.
  const result = coherence([fixture("manifest-measure.json")]);
  assert.equal(result.verdict, "BLOCKED: measure-mismatch");
  const claim = failuresOf(result)[0];
  assert.equal(claim.kind, "measure");
  assert.match(claim.claim, /measured 9999 est \/ 9999 lines/);
  assert.match(claim.observed, /^\d+ est \/ \d+ lines$/);
  assert.ok(!claim.observed.includes("9999"));
});

// ---------------------------------------------------------------------------
// #305 · F45 / F53 — a box instructing an invocation the skill cannot satisfy
// ---------------------------------------------------------------------------

test("#305 F45/F53: a Turn-contract box running the dispatcher without the artifact it requires fails closed", () => {
  const result = coherence([fixture("skills/undisclosed/SKILL.md")]);
  assert.equal(result.verdict, "BLOCKED: undisclosed-prerequisite");
  const claim = failuresOf(result)[0];
  assert.equal(claim.kind, "prerequisite");
  assert.match(claim.claim, /needs-input\.mjs <unit-dir> needs SPEC\.md/);
  assert.match(claim.observed, /never names SPEC\.md/);
});

test("#305 F53: the shipped skills that run the dispatcher from their box disclose the artifact", () => {
  // execute-phase and unit-lane name the invocation in the box; init-workspace
  // delegates to its §Consent and states the scratch folder in prose, so it
  // carries no invocation claim — asserted, so the day it gains one the
  // disclosure is checked too.
  for (const skill of ["execute-phase", "unit-lane"]) {
    const result = coherence([`skills/${skill}/SKILL.md`]);
    const prerequisite = result.claims.filter((claim) => claim.kind === "prerequisite");
    assert.ok(prerequisite.length > 0, `${skill} invokes the dispatcher from its box`);
    assert.equal(prerequisite.filter((claim) => claim.outcome === "fail").length, 0, `${skill}: ${result.lines.join("\n")}`);
  }
  const delegated = coherence(["skills/init-workspace/SKILL.md"]);
  assert.equal(delegated.claims.filter((claim) => claim.kind === "prerequisite").length, 0);
});

// ---------------------------------------------------------------------------
// #305 · the block contract
// ---------------------------------------------------------------------------

test("#305 the block is byte-stable across runs", () => {
  const first = coherence([fixture("unit-doc-count.md"), fixture("manifest-f18.json")]);
  const second = coherence([fixture("unit-doc-count.md"), fixture("manifest-f18.json")]);
  assert.deepEqual(first.lines, second.lines);
  assert.equal(first.exitCode, second.exitCode);
});

test("#305 an unreadable path is a failure, never a silent skip", () => {
  const result = coherence([`${FIXTURES}/does-not-exist.md`]);
  assert.equal(result.verdict, "BLOCKED: missing-document");
  assert.equal(result.exitCode, 1);
});

test("#305 a document with no extractable claim at all fails closed", () => {
  const result = coherence([fixture("no-claims.md")]);
  assert.equal(result.verdict, "BLOCKED: no-claims");
  assert.equal(result.exitCode, 1);
});

test("#305 an out-of-scope command is printed as a skip line and counted, never silently passed", () => {
  const result = coherence([fixture("unit-doc-skip.md")]);
  const skips = result.lines.filter((line) => line.startsWith("skip: "));
  assert.ok(skips.length >= 2, result.lines.join("\n"));
  assert.ok(skips.some((line) => line.includes("command outside the reader allowlist")));
  assert.ok(skips.some((line) => line.includes("no declared outcome")));
  assert.match(result.lines.join("\n"), /^claims: 1 checked · 3 skipped$/m);
});

// ---------------------------------------------------------------------------
// #315 · S2 — the sweep claim kind (the F35/F37/F38/F39 class)
// ---------------------------------------------------------------------------

test("#315 F35: a seeded stale survivor fails the sweep declaration naming file:line, regex and count", () => {
  const result = coherence([fixture("sweep-breach-unit-doc.md")]);
  assert.equal(result.verdict, "BLOCKED: sweep-mismatch");
  const sweep = result.claims.find((claim) => claim.kind === "sweep");
  assert.ok(sweep, "the declaration is read as a sweep claim");
  assert.equal(sweep.outcome, "fail");
  assert.match(sweep.observed, /1 match/);
  assert.match(sweep.observed, /M1-VERDICT-COPY/);
  assert.match(sweep.observed, /sweep-breach\/verdict\.md:\d+/);
  const block = result.lines.join("\n");
  assert.match(block, /^Promise-coherence: sweep scripts\/fixtures\/promise-coherence\/sweep-breach-unit-doc\.md:\d+$/m);
});

test("#315 D1: the stale form inside the fold's fenced evidence quote is exempt — a clean sweep passes", () => {
  const result = coherence([fixture("sweep-clean-unit-doc.md")]);
  assert.equal(result.verdict, "PASS", result.lines.join("\n"));
  const sweep = result.claims.find((claim) => claim.kind === "sweep");
  assert.equal(sweep.outcome, "pass");
  assert.match(sweep.observed, /^0 matches/);
});

test("#315 AC4: a declaration outside the fixed grammar fails closed as unparseable", () => {
  const result = coherence([fixture("sweep-unparseable-unit-doc.md")]);
  assert.equal(result.verdict, "BLOCKED: unparseable-claim");
  const sweep = result.claims.find((claim) => claim.kind === "sweep");
  assert.equal(sweep.outcome, "fail");
  assert.match(sweep.observed, /swept:\s*\/<pattern>\/<flags> → expected <n> in <glob>/);
});

test("#315 F35 true shape: a stale copy in the declaring doc's own sibling section is counted, its Log is exempt", () => {
  const result = coherence([fixture("sweep-same-doc-unit-doc.md")]);
  assert.equal(result.verdict, "BLOCKED: sweep-mismatch");
  const sweep = result.claims.find((claim) => claim.kind === "sweep");
  assert.equal(sweep.outcome, "fail");
  assert.match(sweep.observed, /1 match \(expected 0\)/);
  assert.match(sweep.observed, /sweep-same-doc-unit-doc\.md:\d+/);
});

test("#315 F3: the declaring doc's Log exemption is in the scan's own units — non-ASCII does not misalign it", () => {
  // The fixture's text before `## Log` is deliberately non-ASCII (each
  // em-dash, arrow and accented letter is a byte longer than the character
  // `sectionBounds` indexes by). With a byte cursor in `sweepCount` and a
  // string-index range from `declaringLogRanges`, the fold's own log quote fell
  // outside the exemption and a clean fold failed its own declaration.
  const text = readFileSync(join(ROOT, FIXTURES, "sweep-selfquote-nonascii-unit-doc.md"), "utf8");
  const beforeLog = text.slice(0, text.indexOf("## Log\n"));
  assert.ok(
    Buffer.byteLength(beforeLog, "utf8") > beforeLog.length,
    "the fixture must really carry the offset drift the defect needs",
  );
  const result = coherence([fixture("sweep-selfquote-nonascii-unit-doc.md")]);
  assert.equal(result.verdict, "PASS", result.lines.join("\n"));
  const sweep = result.claims.find((claim) => claim.kind === "sweep");
  assert.equal(sweep.outcome, "pass", "the declaring doc's own log quote is exempt");
  assert.match(sweep.observed, /^0 matches/);
});

test("#315 F2: a doc-sourced pattern outside the sweep's bounds is refused before it is compiled", () => {
  // Both declarations fit the line grammar; one is a quantified group over a
  // quantified body, the other a 240-character body. Compiled, the first is
  // the 83-second-per-line reproducer, so the bound answers in shape and size,
  // never in elapsed time — and the claim is refused, not executed.
  const started = Date.now();
  const result = coherence([fixture("sweep-bounds-unit-doc.md")]);
  const elapsed = Date.now() - started;
  assert.equal(result.verdict, "BLOCKED: sweep-mismatch", result.lines.join("\n"));
  const sweeps = result.claims.filter((claim) => claim.kind === "sweep");
  assert.equal(sweeps.length, 2, "both over-bound declarations are claims, neither is silently dropped");
  for (const claim of sweeps) assert.equal(claim.outcome, "fail");
  assert.match(sweeps[0].observed, /catastrophic-backtracking/);
  assert.match(sweeps[1].observed, /over the sweep bound of 200/);
  assert.match(sweeps[0].observed, /refused before it ran/);
  assert.ok(elapsed < 5_000, `the refusal is a bound check, not a timed-out run (${elapsed} ms)`);
});

test("cycle-2 F15: quantified alternation, a curly group body and adjacent quantifier chains are refused before compile", () => {
  // The F2 pin watched `(x+)+` only. The measured class is wider: `(a|aa)+$
  //` costs 66 s on one line, `(a{2,})+` hides its quantifier from a scan for
  // */+ alone, and `a*a*a*b` overlaps without any group. All three are inside
  // the line grammar and the 200-char budget; the bound must answer in shape
  // and size, never in elapsed time — a refused declaration is a red claim.
  const started = Date.now();
  const result = coherence([fixture("sweep-redos-unit-doc.md")]);
  const elapsed = Date.now() - started;
  assert.equal(result.verdict, "BLOCKED: sweep-mismatch", result.lines.join("\n"));
  const sweeps = result.claims.filter((claim) => claim.kind === "sweep");
  assert.equal(sweeps.length, 3, "all three evading declarations are claims, none is silently dropped");
  for (const claim of sweeps) {
    assert.equal(claim.outcome, "fail");
    assert.match(claim.observed, /refused before it ran/);
    assert.match(claim.observed, /catastrophic-backtracking/);
  }
  assert.ok(elapsed < 5_000, `the bound answers in shape, not in a timed-out run (${elapsed} ms)`);
});

test("#315 F7: the walk honours its file ceiling instead of overshooting it", () => {
  const dir = join(ROOT, "scripts", "fixtures", "promise-coherence");
  const all = sweepFiles(dir, "*.md");
  assert.ok(all.length > 3, `the corpus needs more than three files to prove the bound (${all.length})`);
  for (const max of [1, 2, 3]) {
    assert.equal(sweepFiles(dir, "*.md", max).length, max, `a ceiling of ${max} returns exactly ${max}`);
  }
  assert.equal(sweepFiles(dir, "*.md", 0).length, 0, "a ceiling of zero walks nothing");
  assert.equal(sweepFiles(dir, "*.md").length, all.length, "the default ceiling is not the one in play here");
});

test("#315 F12: a report-validator claim is re-run instead of skipped, and each refusal names itself", () => {
  // The vacuity: every `(validator: …)` cell of a unit doc named a form this
  // pass could not run, so the document passed having checked nothing. Now the
  // bounded class is executed argv-style, and the refusals are specific enough
  // to read as a policy, not an oversight.
  const result = coherence([fixture("validator-runner-unit-doc.md")]);
  const claims = result.claims.filter((claim) => claim.kind === "validator");
  const byCommand = (needle) => claims.find((claim) => claim.claim.includes(needle));

  const checked = byCommand("vocabulary-probe.mjs --root");
  assert.equal(checked?.outcome, "pass", "a committed report validator is re-run, not skipped");
  assert.equal(checked?.observed, "exit 1", "the report validator's real verdict is what the claim promised");

  assert.match(byCommand("node --test")?.skip, /suite runner — this pass never executes the suite/);
  assert.match(byCommand("promise-coherence.mjs")?.skip, /this gate itself/);
  assert.equal(byCommand("unit-route.mjs")?.skip, "command outside the reader allowlist", "not every committed script is a report validator");
  assert.match(result.lines.at(-1), /^claims: 1 checked · 3 skipped$/, "the tally counts what was actually run");
});

// ---------------------------------------------------------------------------
// cycle-2 · F14 / F17 — the doc-sourced execution surface is lexically bounded
// ---------------------------------------------------------------------------

test("F14/F17: a piped interpreter, an expansion, and an escaping validator root are refused by name and never executed", () => {
  // The reader path executed any command whose head was a reader as long as
  // the raw scan missed `;`/`&&`/`||`/`$( `/`>`/`<` — a single `|` into `node`,
  // an unquoted `$HOME`, and a quoted `$$` all reached a shell. The runner
  // class allowlisted the script but not its arguments, so `--root /home`
  // pointed a report validator at arbitrary tree content. Refusals name
  // themselves; the controls prove the bound is lexical, not scorched-earth:
  // quoted alternation, a reader→reader pipeline, and a plain `test` keep
  // running exactly as before.
  const marker = join(ROOT, FIXTURES, ".f14-marker");
  rmSync(marker, { force: true });
  try {
    const result = coherence([fixture("shell-and-args-unit-doc.md")]);
    const claims = result.claims.filter((claim) => claim.kind === "validator");
    const byCommand = (needle) => claims.find((claim) => claim.claim.includes(needle));

    assert.match(byCommand("cat README.md | node")?.skip ?? "", /pipeline stage is outside the reader allowlist \(node\)/);
    assert.match(byCommand("grep -c $HOME")?.skip ?? "", /shell expansion/);
    assert.match(byCommand("a$$b")?.skip ?? "", /shell expansion/);
    assert.equal(byCommand("--root /home")?.outcome, null, "the absolute validator root is not executed");
    assert.match(byCommand("--root /home")?.skip ?? "", /resolves outside the repository/);
    assert.match(byCommand("--root ../..")?.skip ?? "", /resolves outside the repository/);
    assert.ok(!existsSync(marker), "the refused piped command never reached a shell");

    assert.equal(byCommand("agentic|workflow")?.outcome, "pass", "a quoted alternation is a literal argument");
    assert.equal(byCommand("ls scripts | wc -l")?.outcome, "pass", "a reader→reader pipeline still runs");
    assert.equal(byCommand("test -f README.md")?.outcome, "pass", "a plain test still runs");
  } finally {
    rmSync(marker, { force: true });
  }
});

test("#305 the CLI prints the block and exits 1 on a failure, 0 on the head", () => {
  const failing = spawnSync(process.execPath, [path.join(ROOT, "scripts/promise-coherence.mjs"), fixture("unit-doc-count.md")], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(failing.status, 1);
  assert.match(failing.stdout, /^Promise-coherence: validator /m);
  assert.match(failing.stdout, /^verdict BLOCKED: validator-mismatch$/m);

  const head = spawnSync(process.execPath, [path.join(ROOT, "scripts/promise-coherence.mjs")], { cwd: ROOT, encoding: "utf8" });
  assert.equal(head.status, 0, head.stdout);
  assert.match(head.stdout, /^verdict PASS$/m);
});

test("#305 the repository's own head is coherent, and the default set is disclosed", () => {
  const result = coherence([]);
  assert.equal(result.verdict, "PASS", result.lines.filter((line) => line.startsWith("Promise-coherence:")).join("\n"));
  const disclosure = result.lines.find((line) => line.startsWith("skip: closed units"));
  assert.ok(disclosure, "the default set states what it does not scan");
  assert.match(disclosure, /in-flight documents checked/);
  const manifest = result.claims.filter((claim) => claim.kind === "formula" && claim.outcome === "pass");
  assert.ok(manifest.length >= 10, `the manifest's re-bases are recounted: ${manifest.length}`);
});

// ---------------------------------------------------------------------------
// #305 · AC8 — the fold/fix scope is stated in the positive, everywhere
// ---------------------------------------------------------------------------

test("#305 the fold and implement steps state the batch as the change plus its dependents", () => {
  // `fold-findings` 1.9.0 owns the phrasing; the executor and the lane state the
  // same rule in the positive. The old "only the routed findings — nothing extra"
  // wording is what the 12-cycle loop kept re-discovering.
  const sources = {
    "skills/fold-findings/SKILL.md": /covers the change and everything that depends on it/i,
    "skills/execute-phase/references/FOLDING.md": /plus everything that\s+depends on them/i,
    "skills/unit-lane/references/IMPLEMENT.md": /plus everything that depends on it/i,
  };
  for (const [file, pattern] of Object.entries(sources)) {
    const text = readFileSync(path.join(ROOT, file), "utf8");
    assert.match(text, pattern, `${file} states the batch scope in the positive`);
    assert.ok(!/scope: only the routed findings/.test(text), `${file} no longer narrows the batch to the findings alone`);
  }
  for (const file of ["skills/execute-phase/references/FOLDING.md", "skills/unit-lane/references/IMPLEMENT.md"]) {
    assert.match(readFileSync(path.join(ROOT, file), "utf8"), /bun scripts\/promise-coherence\.mjs/, `${file} runs the guard`);
  }
});
