// runner-mapping-injection.test.mjs — the pi pack delivers the runner mapping
// where it is executed (issue #696, AC1/AC2/AC4).
//
// The failure this pins: `skills/*/SKILL.md` cite `runner <subcommand>` and point
// at `runner-contract/references/RUNNER.md`, but the staged bundle pi actually
// loads carried no mapping — a session that followed a packaged skill literally
// ran `runner <subcommand>` in bash and got exit 127, then went hunting through
// the package tree for a binary the contract never installs.
//
// Four properties, each with its own case:
//
//   * **delivered** — every staged `SKILL.md` that cites the symbolic form
//     carries the block, spliced after its frontmatter (a skill whose first bytes
//     are not `---` stops being a skill);
//   * **targeted** — a staged `SKILL.md` that cites nothing carries nothing, so
//     the block is not a blanket preamble;
//   * **single-owner** — the injected text is byte-equal to the canon block
//     `RUNNER.md` publishes, read from the canonical tree, so there is no second
//     hand-maintained copy (`IR11`);
//   * **executable advice** — the block names the tool, the deferred discovery
//     path and the outside-pi pointer, and names no launcher (the bundle's
//     projection delegates the launcher to the standalone tree).
//
// The last two cases are the cheap invariants: the block stays inside its
// declared ceiling, and the block is a normative surface the drift gate resolves.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const PKG_DIR = resolve(import.meta.dirname, "..");
const REPO_ROOT = resolve(PKG_DIR, "..", "..");
const REPO_SKILLS = join(REPO_ROOT, "skills");
const BUNDLE = join(PKG_DIR, "skills");
const RUNNER_MD = join(REPO_SKILLS, "runner-contract", "references", "RUNNER.md");

const suite = () => import("../scripts/bundle-skills.mjs");
const read = (path) => readFileSync(path, "utf8");
const bundledSlugs = () =>
  readdirSync(BUNDLE, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

/** The incident's own skills, plus the contract that owns the mapping. */
const INCIDENT_SKILLS = ["batch-scheduler", "workflow-status", "unit-lane", "triage-issue", "log-session", "runner-contract"];
/** A bundled skill that cites no runner command at all. */
const NON_CITING = "review-a11y";

test("M1 — the block is injected after the frontmatter of every skill that cites the symbolic form", async () => {
  const { citesRunnerCitation, runnerMappingText } = await suite();
  const mapping = runnerMappingText(REPO_SKILLS);
  assert.ok(mapping, "RUNNER.md publishes the mapping block");
  assert.ok(statSync(BUNDLE).isDirectory(), "the staged skill bundle exists (run bundle:skills)");

  for (const slug of INCIDENT_SKILLS) {
    const text = read(join(BUNDLE, slug, "SKILL.md"));
    assert.ok(text.includes(mapping), `${slug}: the staged SKILL.md carries the canon block`);
    const frontmatterEnd = text.indexOf("\n---\n") + 5;
    assert.ok(frontmatterEnd > 4, `${slug}: the staged SKILL.md still opens with its frontmatter`);
    assert.match(text.slice(frontmatterEnd).trimStart(), /^```text\nrunner-mapping@1\n/u, `${slug}: the block follows the frontmatter, not the file's first byte`);
  }

  // The general rule, recomputed skill for skill: the staged bundle's
  // block-presence set is the source tree's citation set.
  const wrong = bundledSlugs().filter((slug) => {
    const expected = citesRunnerCitation(read(join(REPO_SKILLS, slug, "SKILL.md")));
    return read(join(BUNDLE, slug, "SKILL.md")).includes(mapping) !== expected;
  });
  assert.deepEqual(wrong, [], "every staged SKILL.md carries the block exactly when its source cites the symbolic form");
});

test("M2 — a skill that does not cite the symbolic form carries no block", async () => {
  const { citesRunnerCitation, runnerMappingText } = await suite();
  const mapping = runnerMappingText(REPO_SKILLS);
  assert.equal(citesRunnerCitation(read(join(REPO_SKILLS, NON_CITING, "SKILL.md"))), false, `${NON_CITING} cites no runner command`);
  assert.equal(read(join(BUNDLE, NON_CITING, "SKILL.md")).includes(mapping), false, "the staged copy carries no block");

  const carriers = bundledSlugs().filter((slug) => read(join(BUNDLE, slug, "SKILL.md")).includes(mapping));
  assert.ok(carriers.length > 0, "something carries it");
  assert.ok(carriers.length < bundledSlugs().length, `a targeted rule, not a blanket preamble (${carriers.length} of ${bundledSlugs().length})`);
});

test("M3 — the injected text is byte-equal to RUNNER.md's canon block", async () => {
  const { runnerMappingText, RUNNER_MAPPING_MARKER } = await suite();
  const mapping = runnerMappingText(REPO_SKILLS);
  assert.equal(mapping.includes(`${RUNNER_MAPPING_MARKER}\n`), true, `the owner text carries the ${RUNNER_MAPPING_MARKER} marker line`);
  assert.ok(read(RUNNER_MD).includes(mapping), "the block the bundler reads is the one RUNNER.md publishes, byte for byte");

  // Recompute the injection against the owner text: a hand-edited copy in the
  // bundle, or a paraphrase baked into the bundler, fails here.
  for (const slug of INCIDENT_SKILLS) {
    const stagedText = read(join(BUNDLE, slug, "SKILL.md"));
    const at = stagedText.indexOf(mapping);
    assert.ok(at > 0, `${slug}: the block is present`);
    assert.equal(stagedText.slice(at, at + mapping.length), mapping, `${slug}: the injected bytes are the owner's`);
    assert.equal(stagedText.split(mapping).length - 1, 1, `${slug}: injected once`);
  }
});

test("M4 — the block names the tool, the deferred discovery path and the outside-pi pointer", async () => {
  const { runnerMappingText } = await suite();
  const mapping = runnerMappingText(REPO_SKILLS);
  assert.match(mapping, /`agentic_workflow_run`/u, "it names the tool");
  assert.match(mapping, /deferred/u, "it says the tools are deferred");
  assert.match(mapping, /`tool_search`/u, "it names the discovery call");
  assert.match(mapping, /`agentic-workflow` namespace/u, "it names the namespace the lookup takes");
  assert.match(mapping, /runner-contract\/references\/RUNNER\.md/u, "it points outside pi at the contract");
  assert.match(mapping, /never a shell command/u, "it rules out the shell form");
  assert.doesNotMatch(mapping, /(?:bunx|npx(?:\s+--yes)?|pnpm\s+dlx)\s+@gtrabanco\/agentic-workflow/u, "it names no launcher");
  assert.doesNotMatch(mapping, /runner-set@1/u, "it republishes no closed set");
});

test("M5 — the injected block is inside its declared ceiling", async () => {
  const { runnerMappingText, RUNNER_MAPPING_ESTIMATE_MAX } = await suite();
  const mapping = runnerMappingText(REPO_SKILLS);
  const estimate = Math.ceil(Buffer.byteLength(mapping, "utf8") / 4);
  assert.ok(
    estimate <= RUNNER_MAPPING_ESTIMATE_MAX,
    `the block costs ${estimate} est, above the declared ceiling ${RUNNER_MAPPING_ESTIMATE_MAX} (AC1: the ceiling is fixed after the block, never before)`,
  );
  assert.ok(RUNNER_MAPPING_ESTIMATE_MAX <= 200, "the ceiling stays short enough to be a preamble, not a section");
});

// Issue #734: the block deferred arity to the door, and the emitter that reads it
// rendered `"subcommand": "journal write"` — one argv token to a door that never
// splits. The block therefore pins the shape it hands the model: the service
// stands alone, and the rest of the citation is `args`.
test("M7 — the block pins the call shape the runner door executes", async () => {
  const { runnerMappingText } = await suite();
  const mapping = runnerMappingText(REPO_SKILLS);
  assert.match(mapping, /`subcommand` is the service alone/u, "it says the service stands alone in `subcommand`");
  assert.match(mapping, /every later token an `args` entry/u, "it says the rest of the citation travels in `args`");
  assert.match(mapping, /`agentic_workflow_run`/u, "and it still names the tool that receives the call");
});

test("M6 — a toy skills tree proves the rule without the real tree", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-mapping-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");
  const { bundleSkills, citesRunnerCitation, runnerMappingText } = await suite();

  // The toy tree carries its own owner file, copied: the fixture proves the rule
  // (read the owner, splice after the frontmatter) without touching the real one.
  mkdirSync(join(sourceDir, "runner-contract", "references"), { recursive: true });
  writeFileSync(join(sourceDir, "runner-contract", "SKILL.md"), "---\nname: runner-contract\nuser-invocable: false\n---\n\nbody\n");
  writeFileSync(join(sourceDir, "runner-contract", "references", "RUNNER.md"), read(RUNNER_MD));

  mkdirSync(join(sourceDir, "citing"), { recursive: true });
  writeFileSync(join(sourceDir, "citing", "SKILL.md"), "---\nname: citing\nuser-invocable: true\n---\n\nRun `runner workflow-status`.\n");
  mkdirSync(join(sourceDir, "quiet"), { recursive: true });
  writeFileSync(join(sourceDir, "quiet", "SKILL.md"), "---\nname: quiet\nuser-invocable: true\n---\n\nNo runner here.\n");

  assert.equal(citesRunnerCitation("Run `runner workflow-status` here.\n"), true);
  assert.equal(citesRunnerCitation("runner <subcommand> [args...]\n"), true, "the symbolic form in a fenced block is a citation");
  assert.equal(citesRunnerCitation("No runner here.\n"), false);
  assert.equal(citesRunnerCitation("A narrower runner later.\n"), false, "prose about a runner is not a citation");

  const mapping = runnerMappingText(sourceDir);
  assert.ok(mapping, "the toy tree's own RUNNER.md is the owner the fixture reads");

  bundleSkills({ sourceDir, targetDir });
  const citing = read(join(targetDir, "citing", "SKILL.md"));
  const quiet = read(join(targetDir, "quiet", "SKILL.md"));
  assert.ok(citing.includes(mapping), "the citing skill carries the block");
  assert.match(citing, /^---\nname: citing\nuser-invocable: true\n---\n/u, "its frontmatter is untouched and first");
  assert.equal(quiet.includes(mapping), false, "the quiet skill carries none");
});

test("M7 — the block is a normative surface the drift gate resolves", () => {
  const guide = read(join(REPO_ROOT, "AGENTS.md"));
  const row = guide.split("\n").find((line) => line.startsWith("runner-mapping |"));
  assert.ok(row, "AGENTS.md's normative-surfaces@1 declares the block");
  assert.match(row, /\| skills\/runner-contract\/references\/RUNNER\.md \| block:runner-mapping@1 \|/u);
  assert.match(read(RUNNER_MD), /```text\nrunner-mapping@1\n/u, "RUNNER.md publishes it under that id");
});
