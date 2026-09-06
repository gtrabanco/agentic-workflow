// Feature 28 AC8 — the executable documentation suite for the pre-execution family.
//
// Documentation drift is a contract bug: a consumer that reads only the reference
// must be able to reproduce every name, limit, code, and example the runtime
// publishes. This suite therefore compares the prose against the compiled surface
// (so an undocumented export fails here), asserts each statement in BOTH language
// versions, and compiles and runs the TypeScript example out of each README.
//
// Driven by `npm run test:pre-execution-docs`, and by `npm test` through
// `node --test test/*.test.mjs`, so docs drift can never pass the main gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEMP_ROOT = join(ROOT, ".tmp-pre-execution-docs");
const README_EN = readFileSync(join(ROOT, "README.md"), "utf8");
const README_ES = readFileSync(join(ROOT, "README.es.md"), "utf8");
const schema = await import("../dist/index.js");

const DOCS = { "README.md": README_EN, "README.es.md": README_ES };

/** The feature-28 section of a README, up to the next `## ` heading. */
function featureSection(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^## .*(Pre-Execution Review|pre-ejecución)/i.test(line));
  assert.ok(start >= 0, "no feature-28 section found");
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines.slice(start, end === -1 ? lines.length : end).join("\n");
}

/** Fenced TypeScript blocks inside the feature-28 section. */
function tsBlocks(section) {
  return [...section.matchAll(/```ts\n([\s\S]*?)```/g)].map((match) => match[1]);
}

/** Example code with comments and blank lines removed — the parity unit. */
function codeOnly(block) {
  return block
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trimEnd())
    .filter((line) => line.trim() !== "" && !/^\s*\/?\*/.test(line))
    .join("\n");
}

const SECTIONS = { "README.md": featureSection(README_EN), "README.es.md": featureSection(README_ES) };

// ---------------------------------------------------------------------------
// AC8 — the statements a reader must be able to find, in both languages
// ---------------------------------------------------------------------------

const CLAIMS = [
  {
    name: "pre-execution purpose: no code exists yet",
    en: /before any code exists/i,
    es: /antes de que exista c[óo]digo/i,
  },
  {
    name: "no substitution for candidate or verification receipts",
    en: /never validates as a pre-execution receipt|no\s+contract in this family substitutes/i,
    es: /nunca valida como recibo pre-ejecuci[óo]n|ning[úu]n contrato de esta familia sustituye/i,
  },
  {
    name: "the binding is to the projection, not the mutable file",
    en: /never to the mutable file|binds the \*\*selection\*\*|digests? .*never to the file/i,
    es: /nunca al archivo mutable|jam[áa]s al archivo mutable|la \*\*selecci[óo]n\*\*, no el archivo/i,
  },
  {
    name: "staleness precedence and no resurrection",
    en: /cannot be\s*\n?resurrected|stale-artifact-revision/i,
    es: /no puede resucitar|stale-artifact-revision/i,
  },
  {
    name: "diagnostics are redacted",
    en: /never a submitted value|codes? and field pointers only/i,
    es: /jam[áa]s un valor enviado|c[óo]digos y\s*\n?punteros/i,
  },
  {
    name: "no quorum over an unresolved finding",
    en: /no quorum|votes never erase/i,
    es: /no hay qu[óo]rum|los votos nunca borran/i,
  },
  {
    name: "the package never reads Git or the filesystem",
    en: /never touches Git or the filesystem|caller-supplied bytes|bytes the caller supplied/i,
    es: /nunca toca Git ni el sistema de archivos|bytes del llamante|bytes que el llamante/i,
  },
];

for (const claim of CLAIMS) {
  test(`AC8: "${claim.name}" is stated in both reference languages`, () => {
    for (const [file, section] of Object.entries(SECTIONS)) {
      const pattern = file === "README.md" ? claim.en : claim.es;
      assert.match(section.replace(/\s+/g, " "), new RegExp(pattern.source.replace(/\\\n/g, ""), "i"),
        `${file} loses the ${claim.name} claim`);
    }
  });
}

// ---------------------------------------------------------------------------
// Names, numbers and codes: the reference must equal the compiled surface
// ---------------------------------------------------------------------------

const PRE_EXECUTION_EXPORTS = Object.keys(schema).filter(
  (name) => /^PRE_EXECUTION_/.test(name)
    || /^(validate|build|select|canonicalize|digest|compare)PreExecution/.test(name)
    || name === "selectSpecProduct"
    || name === "isImpossibleReceiptTimeline"
    || name === "VERDICTS_BY_STAGE",
);

test("AC8: every runtime export of the family is named in both references", () => {
  assert.ok(PRE_EXECUTION_EXPORTS.length >= 26,
    `only ${PRE_EXECUTION_EXPORTS.length} exports found — the surface shrank`);
  for (const [file, section] of Object.entries(SECTIONS)) {
    for (const name of PRE_EXECUTION_EXPORTS) {
      // Constants and functions must appear; type-only names are exercised through
      // the example, which imports them by name.
      if (!(name in schema)) continue;
      assert.ok(section.includes(name), `${file} never names ${name}`);
    }
  }
});

test("AC8: the TypeScript declarations publish the family's types", () => {
  const types = readFileSync(join(ROOT, "dist", "index.d.ts"), "utf8");
  for (const name of [
    "PreExecutionArtifactSnapshotV1", "PreExecutionReviewReceiptV1", "PreExecutionArtifactRow",
    "PreExecutionContextBinding", "PreExecutionFinding", "PreExecutionParentReceipt",
    "PreExecutionDiagnostic", "PreExecutionFreshnessResult", "SpecProductSelection",
    "PreExecutionSnapshotBuildInput", "PreExecutionVerdict", "PreExecutionStage",
  ]) {
    assert.ok(types.includes(name), `${name} is not reachable from dist/index.d.ts`);
  }
});

test("AC8: every published limit is documented with its exact number", () => {
  for (const [file, section] of Object.entries(SECTIONS)) {
    for (const [key, value] of Object.entries(schema.PRE_EXECUTION_LIMITS)) {
      assert.ok(section.includes(key), `${file} omits the ${key} limit`);
      assert.ok(section.includes(String(value)), `${file} omits the value of ${key} (${value})`);
    }
  }
});

test("AC8: every freshness and vocabulary code is documented", () => {
  for (const [file, section] of Object.entries(SECTIONS)) {
    for (const code of schema.PRE_EXECUTION_FRESHNESS_CODES) {
      assert.ok(section.includes(code), `${file} omits freshness code ${code}`);
    }
    for (const code of ["spec-review-pass", "spec-review-fail", "plan-review-pass", "plan-review-fail",
      "needs-design"]) {
      assert.ok(section.includes(code), `${file} omits verdict ${code}`);
    }
    for (const kind of schema.PRE_EXECUTION_ARTIFACT_KINDS) {
      assert.ok(section.includes(kind), `${file} omits artifact kind ${kind}`);
    }
    for (const kind of schema.PRE_EXECUTION_CONTEXT_KINDS) {
      assert.ok(section.includes(kind), `${file} omits context kind ${kind}`);
    }
  }
});

test("AC8: the reference names both contract ids and both projection files", () => {
  for (const [file, section] of Object.entries(SECTIONS)) {
    assert.ok(section.includes(schema.PRE_EXECUTION_SNAPSHOT_CONTRACT_ID), file);
    assert.ok(section.includes(schema.PRE_EXECUTION_RECEIPT_CONTRACT_ID), file);
    assert.ok(section.includes("pre-execution-artifact-snapshot.schema.json"), file);
    assert.ok(section.includes("pre-execution-review-receipt.schema.json"), file);
    assert.ok(section.includes("npm run gate:pre-execution"), `${file} omits the gate command`);
  }
});

test("AC8: the selector is documented as a closed contract, not a heuristic", () => {
  for (const [file, section] of Object.entries(SECTIONS)) {
    assert.ok(section.includes("spec-product-v1"), file);
    assert.ok(/whole-file/.test(section), file);
    assert.match(section.replace(/\s+/g, " "), /byteLength\/digest|byteLength[^\n]{0,40}digest/i,
      `${file} must say the row describes the selection, not the file`);
  }
});

// ---------------------------------------------------------------------------
// EN/ES parity + runnable examples
// ---------------------------------------------------------------------------

test("AC8: the English and Spanish examples are the same code", () => {
  const en = tsBlocks(SECTIONS["README.md"]).map(codeOnly);
  const es = tsBlocks(SECTIONS["README.es.md"]).map(codeOnly);
  assert.equal(en.length, 1, "exactly one feature-28 example in README.md");
  assert.equal(es.length, 1, "exactly one feature-28 example in README.es.md");
  assert.equal(en[0], es[0], "a divergent example is a second, untested contract");
});

const EXAMPLES = tsBlocks(SECTIONS["README.md"]).concat(tsBlocks(SECTIONS["README.es.md"]));

test("AC8: the example in each reference typechecks against the published types and runs", () => {
  assert.equal(EXAMPLES.length, 2, "one example per reference language");
  mkdirSync(TEMP_ROOT, { recursive: true });
  try {
    EXAMPLES.forEach((block, index) => compileAndRun(index, block));
  } finally {
    rmSync(TEMP_ROOT, { recursive: true, force: true });
  }
});

/**
 * Compile and run one extracted example inside the package tree, so `../../dist/index.js`
 * resolves against the published types. The example imports the package by name, which
 * the harness rewrites to that relative specifier: the shipped entry point is the same
 * module, and a self-referential import would not prove anything about the local build.
 */
function compileAndRun(index, block) {
  const dir = join(TEMP_ROOT, `example-${index}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "example.ts"), block.replace(
    /from "@gtrabanco\/agentic-workflow-schema"/g,
    'from "../../dist/index.js"',
  ), "utf8");
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      files: ["example.ts"],
    }, null, 2),
    "utf8",
  );
  try {
    execFileSync(
      process.execPath,
      [join(ROOT, "node_modules", "typescript", "bin", "tsc"), "-p", dir],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    assert.fail(`example ${index + 1} does not typecheck:\n${error.stdout || error.stderr || error.message}`);
  }
  let out;
  try {
    out = execFileSync(process.execPath, [join(dir, "example.ts")], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    assert.fail(`example ${index + 1} failed at runtime:\n${error.stdout || ""}${error.stderr || error.message}`);
  }
  // The example prints an object, and the formatter differs by runtime: node
  // emits single-line, single-quoted JSON-ish output; bun emits multi-line with
  // double quotes and trailing commas. Both carry the same proof, so match the
  // semantic tokens (freshness, the reasonCode, the review binding) across
  // whitespace/quote variation instead of node's exact formatting.
  assert.match(
    out,
    /review bound \d+ [a-f0-9]{12}[\n ]*\{[\s\S]*?fresh:\s*true[\s\S]*?fresh:\s*false[\s\S]*?reasonCode:\s*["']stale-artifact-revision["']/,
    "the example must actually demonstrate freshness and revocation, not just compile",
  );
}
