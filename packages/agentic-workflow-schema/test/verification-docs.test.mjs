// P13 registration + P14 content — the executable documentation suite AC6 names.
//
// Driven by `npm run test:verification-docs` (and by `npm test`, so docs drift can
// never pass the main gate). P13 registered the harness; P14 added the content
// assertions below: the six AC6 topics in both languages, every D14 limit with its
// number, the projection boundary, the D16 diagnostic contract, the freshness
// vocabulary, EN/ES code parity, and examples that compile AND run.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");
const README_EN = read("../README.md");
const README_ES = read("../README.es.md");
const verificationModule = await import("../dist/index.js");
const { VERIFICATION_LIMITS, VERIFICATION_FRESHNESS_CODES, VERIFICATION_DIAGNOSTIC_CODES } = verificationModule;

const both = { "README.md": README_EN, "README.es.md": README_ES };

/** Fenced TypeScript example blocks, in document order. */
function tsBlocks(text) {
  return [...text.matchAll(/```ts\n([\s\S]*?)```/g)].map((match) => match[1]);
}

/** Example code with comments and blank lines removed — the parity unit. */
function codeOnly(block) {
  return block
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trimEnd())
    .filter((line) => line.trim() !== "" && !/^\s*\/?\*/.test(line))
    .join("\n");
}

// ---------------------------------------------------------------------------
// AC6 — the six statements, in both languages
// ---------------------------------------------------------------------------

const AC6_TOPICS = [
  {
    name: "two-stage model",
    en: /\*\*Two-stage model:?\*\*|Two-stage model/i,
    es: /modelo de dos etapas/i,
  },
  {
    name: "delivery-gate rule",
    en: /\*\*Delivery-gate rule:?\*\*|delivery gate is satisfied/i,
    es: /regla del gate de entrega|regla de la puerta de entrega|gate de entrega se satisface/i,
  },
  {
    name: "no-execution boundary",
    en: /\*\*No-execution boundary:?\*\*|does not execute commands/i,
    es: /límite de no-ejecución|no ejecuta comandos/i,
  },
  {
    name: "single validation authority",
    en: /two (public )?authoritative entr|sole plan-validation authority|single validation authority/i,
    es: /dos entradas autoritativas|autoridad de validación única|única autoridad/i,
  },
  {
    name: "structural-projection status",
    en: /non-authoritative/i,
    es: /no\s+autoritativa|no es autorizada|proyecci[oó]n(es)?\s+estructural/i,
  },
  {
    name: "v1 usability limits",
    en: /Usability limits/i,
    es: /L[íi]mites de usabilidad/i,
  },
];

test("AC6: both references state the two-stage model, gate rule, no-execution, authority, projection status and limits", () => {
  for (const topic of AC6_TOPICS) {
    assert.match(README_EN, topic.en, `README.md never states the ${topic.name}`);
    assert.match(README_ES, topic.es, `README.es.md never states the ${topic.name}`);
  }
});

// ---------------------------------------------------------------------------
// Every v1 usability limit, published with its number (AC6 / AC10)
// ---------------------------------------------------------------------------

/** `| key | value | … |` rows of the limits table in a reference. */
function limitRows(text) {
  const rows = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/^\|\s*`?([a-zA-Z]+)`?\s*\|\s*([^|]+)\|/);
    if (match && match[1] in VERIFICATION_LIMITS) rows.set(match[1], match[2].trim());
  }
  return rows;
}

test("AC6: every published limit appears in the table with its exact number", () => {
  const keys = Object.keys(VERIFICATION_LIMITS);
  for (const [name, text] of Object.entries(both)) {
    const rows = limitRows(text);
    assert.deepEqual(
      keys.filter((key) => !rows.has(key)),
      [],
      `${name} documents no row for these VERIFICATION_LIMITS keys`,
    );
    for (const key of keys) {
      assert.ok(
        rows.get(key).includes(String(VERIFICATION_LIMITS[key])),
        `${name} states ${key} as "${rows.get(key)}", not ${VERIFICATION_LIMITS[key]}`,
      );
    }
    assert.match(text, /VERIFICATION_LIMITS/, `${name} never names the published limits object`);
  }
});

test("AC6: the aggregate stage budgets and the p95 ceiling are documented in both languages", () => {
  for (const [name, text] of Object.entries(both)) {
    for (const phrase of [/10 min|10 minutos/, /15 min|15 minutos/, /60 min|60 minutos/, /2 h|120 min|2 horas/]) {
      assert.match(text, phrase, `${name} omits a D14 time bound (${phrase})`);
    }
    assert.match(text, /256 KiB/, `${name} omits the plan byte budget`);
    assert.match(text, /512 KiB/, `${name} omits the receipt byte budget`);
    assert.match(text, /100 ms/, `${name} omits the declared p95 ceiling`);
  }
});

// ---------------------------------------------------------------------------
// Projection boundary + diagnostic contract
// ---------------------------------------------------------------------------

test("AC9: both references name the projections, their generator and their authority", () => {
  for (const [name, text] of Object.entries(both)) {
    for (const file of ["verification-plan.schema.json", "verification-receipt.schema.json"]) {
      assert.ok(text.includes(file), `${name} never mentions ${file}`);
    }
    assert.match(text, /generate-verification-schemas\.mjs/, `${name} never names the generator`);
    assert.match(text, /check:verification-schemas/, `${name} never names the drift check`);
    for (const entry of ["validateVerificationPlanV1", "validateVerificationReceiptAgainstPlan"]) {
      assert.ok(text.includes(entry), `${name} never documents ${entry}`);
    }
  }
});

test("D16: both references describe the bounded diagnostic failure shape", () => {
  for (const [name, text] of Object.entries(both)) {
    assert.match(text, /diagnostics/, `${name} never names the diagnostics field`);
    assert.match(text, /truncated/, `${name} never names the truncation flag`);
    assert.match(text, /RFC 6901|puntero RFC 6901/i, `${name} never states the path form`);
    assert.match(
      text,
      /no[\s\S]{0,40}message|never[\s\S]{0,20}a message|sin mensajes|nunca[\s\S]{0,40}mensaje/i,
      `${name} does not state that messages and values are never returned`,
    );
    assert.ok(text.includes(String(VERIFICATION_LIMITS.diagnostics)), `${name} omits the diagnostic ceiling`);
  }
});

test("AC4: all six freshness reason codes appear in both references", () => {
  for (const [name, text] of Object.entries(both)) {
    for (const code of VERIFICATION_FRESHNESS_CODES) {
      assert.ok(text.includes(code), `${name} omits freshness code ${code}`);
    }
  }
});

test("D16: the diagnostic vocabulary is disclosed, not just referenced", () => {
  // Every code must be findable in each limits/diagnostics table row.
  for (const [name, text] of Object.entries(both)) {
    const missing = VERIFICATION_DIAGNOSTIC_CODES.filter((code) => !text.includes(code));
    assert.deepEqual(missing, [], `${name} omits diagnostic codes: ${missing.join(", ")}`);
  }
});

// ---------------------------------------------------------------------------
// Examples: compilable, runnable, coherent, and never stale
// ---------------------------------------------------------------------------

test("AC6: no reference mentions a validator the package does not export", async () => {
  const exported = new Set(Object.keys(await import("../dist/index.js")));
  for (const [name, text] of Object.entries(both)) {
    // Only call-like identifiers: prose verbs such as "validates" are not API.
    const candidates = new Set(
      [...text.matchAll(/\b(validate[A-Z][A-Za-z0-9]*|canonicalize[A-Z][A-Za-z0-9]*|digest[A-Z][A-Za-z0-9]*|derive[A-Z][A-Za-z0-9]*|compare[A-Z][A-Za-z0-9]*)\(/g)]
        .map((match) => match[1]),
    );
    for (const id of candidates) {
      assert.ok(exported.has(id), `${name} calls ${id}(), which the package does not export`);
    }
  }
});

test("AC6: the retired standalone receipt validator appears in no example or section", () => {
  for (const [name, text] of Object.entries(both)) {
    assert.ok(!text.includes("validateVerificationReceiptV1"), `${name} still names validateVerificationReceiptV1`);
  }
});

const TEMP_ROOT = join(fileURLToPath(new URL("..", import.meta.url)), ".tmp-verification-docs");

/**
 * Only the feature-26 example is compiled and run. The pre-existing blocks in both
 * references use undeclared placeholders (`snapshot`, `headSha`, an `invokeAgent`
 * the reader supplies) and are already tracked as a routed review proposal to make
 * every snippet self-contained; asserting on them here would hide the claim this
 * unit actually owns.
 */
const VERIFICATION_EXAMPLES = [...tsBlocks(README_EN), ...tsBlocks(README_ES)].filter((block) =>
  block.includes("validateVerificationPlanV1"),
);

/**
 * Compile (typecheck) and run one extracted example inside the package tree, so
 * `../dist/index.js` resolves against the published types. The example imports the
 * package by name, which the harness rewrites to that relative specifier: the
 * shipped entry point is the same module, and a self-referential import would not
 * prove anything about the local build.
 */
function compileAndRun(index, block) {
  const dir = join(TEMP_ROOT, `example-${index}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const rewritten = block.replace(
    /from "@gtrabanco\/agentic-workflow-schema"/g,
    'from "../../dist/index.js"',
  );
  writeFileSync(join(dir, "example.ts"), rewritten, "utf8");
  // Compiled through a project file: TypeScript 6 refuses command-line files when
  // a tsconfig would otherwise be discovered upwards, and the project pins the same
  // options the package builds with.
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        files: ["example.ts"],
      },
      null,
      2,
    ),
    "utf8",
  );
  try {
    execFileSync(
      process.execPath,
      [join(process.cwd(), "node_modules", "typescript", "bin", "tsc"), "-p", dir],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    assert.fail(`example ${index + 1} does not typecheck:\n${error.stdout || error.stderr || error.message}`);
  }
  try {
    execFileSync(process.execPath, [join(dir, "example.ts")], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    assert.fail(`example ${index + 1} failed at runtime:\n${error.stdout || ""}${error.stderr || error.message}`);
  }
}

test("AC6: the feature-26 example in each reference typechecks against the published types and runs", () => {
  assert.equal(VERIFICATION_EXAMPLES.length, 2, "exactly one verification example per reference");
  mkdirSync(TEMP_ROOT, { recursive: true });
  try {
    VERIFICATION_EXAMPLES.forEach((block, index) => compileAndRun(index, block));
  } finally {
    rmSync(TEMP_ROOT, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// F93 / F96 (review @8213ebd) — runner-side disclosure of the opaque path and
// of the frozen vocabulary exports. Red first: neither exists yet.
// ---------------------------------------------------------------------------

test("F93: both references disclose workingDirectory as an opaque, never-percent-decoded path", () => {
  for (const [name, text] of Object.entries(both)) {
    assert.match(text, /opaque|opaca/, `${name} never calls the validated path opaque`);
    assert.match(text, /percent-decod/i, `${name} never warns against percent-decoding before resolution`);
  }
});



test("F96: both references name every frozen verification vocabulary export", () => {
  const VOCABULARY = [
    "VERIFICATION_STAGES",
    "VERIFICATION_COST_CLASSES",
    "VERIFICATION_FRESHNESS_CODES",
    "VERIFICATION_CANONICAL_VECTORS",
  ];
  for (const [name, text] of Object.entries(both)) {
    for (const constant of VOCABULARY) {
      assert.ok(text.includes(constant), `${name} never names ${constant}`);
    }
  }
});

// F102-F105 (adversarial review @3112e34): the published reference must be
// usable from the tarball boundary, disclose the complete verification API,
// name every public contract validator, and tell callers how to recover from
// redacted diagnostics.
test("F102: repository-only verification commands are marked source-checkout-only in both references", () => {
  const sourceOnly = [
    "check:verification-schemas",
    "check:verification-package",
    "bench:verification",
    "test:verification-docs",
    "gate:verification",
  ];
  for (const [name, text] of Object.entries(both)) {
    assert.match(text, /source-checkout-only|solo (?:en|para) (?:un )?checkout (?:del código )?fuente/i, `${name} omits the source-checkout-only boundary`);
    for (const command of sourceOnly) {
      assert.ok(text.includes(command), `${name} never marks npm run ${command} as source-checkout-only`);
    }
    assert.doesNotMatch(
      text,
      /then run\s+`npm run check:verification-schemas`|y ejecuta\s+`npm run check:verification-schemas`/i,
      `${name} still instructs installed-package consumers to run a missing target`,
    );
  }
});

// F110: marking the table is not enough — the prose that *offers* a source-only
// command as proof has to carry the same boundary, or an installed consumer
// follows the sentence and hits a missing script.
test("F110: every prose mention of a source-checkout-only command carries the qualifier in both references", () => {
  const qualifier =
    /source[- ]checkout[- ]only|solo (?:en|para) (?:un )?checkout (?:del c[oó]digo )?fuente/i;
  const sourceOnlyCommands = [
    "check:verification-schemas",
    "check:verification-package",
    "bench:verification",
    "test:verification-docs",
    "gate:verification",
  ];
  for (const [name, text] of Object.entries(both)) {
    const lines = text.split("\n");
    for (const command of sourceOnlyCommands) {
      lines.forEach((line, index) => {
        if (!line.includes(command)) return;
        // A ±6-line window is one markdown paragraph: the qualifier has to be in
        // the sentence that offers the command, not somewhere in the file.
        const window = lines.slice(Math.max(0, index - 6), index + 7).join(" ");
        assert.ok(
          qualifier.test(window),
          `${name}:${index + 1} offers \`npm run ${command}\` without the source-checkout-only qualifier (F110)`,
        );
      });
    }
  }
});

test("F103: both references inventory the exact public verification runtime and type surfaces", () => {
  const runtime = [
    "VERIFICATION_CANONICAL_VECTORS",
    "VERIFICATION_COMMAND_STATUSES",
    "VERIFICATION_COST_CLASSES",
    "VERIFICATION_DIAGNOSTIC_CODES",
    "VERIFICATION_FRESHNESS_CODES",
    "VERIFICATION_LIMITS",
    "VERIFICATION_PLAN_CONTRACT_ID",
    "VERIFICATION_RECEIPT_CONTRACT_ID",
    "VERIFICATION_STAGES",
    "VERIFICATION_VERDICTS",
    "canonicalizeVerificationPlan",
    "canonicalizeVerificationReceipt",
    "compareVerificationReceiptToCurrent",
    "deriveVerificationVerdict",
    "digestVerificationPlan",
    "digestVerificationReceipt",
    "validateVerificationPlanV1",
    "validateVerificationReceiptAgainstPlan",
  ];
  const runtimeOnDisk = Object.keys(verificationModule)
    .filter((name) => name.startsWith("VERIFICATION_") || name.includes("Verification"))
    .sort();
  assert.deepEqual(runtimeOnDisk, runtime, "the pinned verification runtime inventory drifted");

  const types = [
    "EvidenceReferenceV1",
    "VerificationCommandStatus",
    "VerificationCommandV1",
    "VerificationCostClass",
    "VerificationDiagnosticCode",
    "VerificationDiagnosticV1",
    "VerificationFreshnessReasonCode",
    "VerificationFreshnessResult",
    "VerificationPlanV1",
    "VerificationPlanValidationResult",
    "VerificationReceiptV1",
    "VerificationReceiptValidationResult",
    "VerificationResultV1",
    "VerificationStage",
    "VerificationStageRequest",
    "VerificationVerdict",
    "WorkingDirectoryPolicy",
  ];
  const dts = read("../dist/index.d.ts");
  const section = dts.slice(
    dts.indexOf("export { VERIFICATION_PLAN_CONTRACT_ID };"),
    dts.indexOf("export declare const VERIFICATION_CANONICAL_VECTORS"),
  );
  const declaredTypes = [
    ...section.matchAll(/^export (?:type|interface) ([A-Za-z0-9_]+)/gm),
  ].map((match) => match[1]);
  if (section.includes("export type { VerificationDiagnosticV1 };")) declaredTypes.push("VerificationDiagnosticV1");
  assert.deepEqual(declaredTypes.sort(), types, "the pinned verification type inventory drifted");

  for (const [name, text] of Object.entries(both)) {
    for (const identifier of [...runtime, ...types]) {
      assert.ok(text.includes(identifier), `${name} omits public verification identifier ${identifier}`);
    }
  }
});

test("F104: both references name every public contract validator", () => {
  const validators = [
    "validateEnvelopeV2Strict",
    "validateSkillOutcomeV1",
    "validateWorkflowSnapshotV1",
    "validateCandidateSnapshotV1",
    "validateReviewReceiptV1",
    "validateVerificationPlanV1",
    "validateVerificationReceiptAgainstPlan",
  ];
  for (const [name, text] of Object.entries(both)) {
    for (const validator of validators) {
      assert.ok(text.includes(validator), `${name} omits public validator ${validator}`);
    }
  }
});

test("F105: every diagnostic row gives caller recovery without submitted values", () => {
  for (const [name, text] of Object.entries(both)) {
    for (const code of VERIFICATION_DIAGNOSTIC_CODES) {
      const row = text.split("\n").find((line) => line.startsWith(`| \`${code}\` |`));
      assert.ok(row, `${name} has no diagnostic row for ${code}`);
      const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
      assert.equal(cells.length, 3, `${name} ${code} row has no recovery column`);
      assert.ok(cells[2].length > 0, `${name} ${code} recovery is empty`);
    }
    assert.match(text, /without copying submitted values|sin copiar los valores enviados/i, `${name} recovery guidance omits the no-echo rule`);
  }
});

// ---------------------------------------------------------------------------
// Deferred consumer boundary (D15) — documented, no issue created
// ---------------------------------------------------------------------------

test("D15: both references record the deferred AWL consumer boundary", () => {
  for (const [name, text] of Object.entries(both)) {
    assert.match(text, /AWL/, `${name} never mentions AWL`);
    assert.match(text, /not\s+part\s+of|out of scope|no\s+forma\s+parte|fuera\s+del\s+alcance|no\s+es\s+parte/i, `${name} does not mark it deferred`);
  }
});

// ---------------------------------------------------------------------------
// P13 registration facts still hold (harness wiring)
// ---------------------------------------------------------------------------

test("both language references exist and carry content", () => {
  for (const [name, text] of Object.entries(both)) {
    assert.ok(text.length > 4000, `${name} is unexpectedly short (${text.length} chars)`);
    assert.match(text, /^# /m, `${name} has no top-level heading`);
  }
});

test("npm run test:verification-docs is the command the acceptance names", () => {
  const manifest = JSON.parse(read("../package.json"));
  assert.equal(
    manifest.scripts["test:verification-docs"],
    "node --test test/verification-docs.test.mjs",
    "the docs command must drive this file",
  );
});

// ---------------------------------------------------------------------------
// Review folds — guidance that must never drift back
// ---------------------------------------------------------------------------

// F78 — the consumer example's binding comment contradicted `computeAcceptanceFingerprint`,
// which hashes the ordered `{ id, blobSha256 }` rows, not the raw `ACCEPTANCE.md` blob.
// A consumer that followed the comment derives a fingerprint the predicate calls stale.
const FALSE_FINGERPRINT_CLAIMS = [
  /digest\s+of\s+the\s+`?ACCEPTANCE\.md`?\s+blob/i,
  /digesto\s+del\s+blob\s+de\s+`?ACCEPTANCE\.md`?/i,
];

test("the acceptance-fingerprint guidance names the real derivation in both languages", () => {
  for (const [name, text] of Object.entries(both)) {
    for (const claim of FALSE_FINGERPRINT_CLAIMS) {
      assert.doesNotMatch(
        text,
        claim,
        `${name} still calls the acceptance fingerprint the digest of the raw ACCEPTANCE.md blob (F78)`,
      );
    }
    assert.match(
      text,
      /computeAcceptanceFingerprint/,
      `${name} must name the function that produces the acceptance fingerprint`,
    );
    assert.match(
      text,
      /\{\s*id\s*,\s*blobSha256\s*\}/,
      `${name} must state the ordered { id, blobSha256 } rows the fingerprint hashes`,
    );
  }
});

// F79 — the CHANGELOG pair is the declared source of truth for what shipped, and its
// package table had no row for the version the package was actually carrying. The check
// is scoped to that table: `| 3.4.0 |` rows for unrelated skills must not mask the gap.
const PACKAGE_HEADING = "#### [`@gtrabanco/agentic-workflow-schema`](packages/agentic-workflow-schema/)";

test("the changelog of record carries a row for the version being shipped", () => {
  const { version } = JSON.parse(read("../package.json"));
  const row = new RegExp(`^\\|\\s*${version.replace(/\./g, "\\.")}\\s*\\|`, "m");
  for (const relative of ["../../../CHANGELOG.md", "../../../CHANGELOG.es.md"]) {
    const text = read(relative);
    const start = text.indexOf(PACKAGE_HEADING);
    assert.notStrictEqual(start, -1, `${relative} no longer carries the package table`);
    const after = text.slice(start + PACKAGE_HEADING.length);
    const end = after.search(/^#{2,4} /m);
    const section = end === -1 ? after : after.slice(0, end);
    assert.match(
      section,
      row,
      `${relative} has no @gtrabanco/agentic-workflow-schema ${version} row (F79)`,
    );
  }
});

// F90 (review @8213ebd): the shipped row claimed a "13-case" docs suite while
// 15 cases were on disk — a number a human cannot re-derive. This case makes
// the claim self-checking: the count BOTH changelog languages state must equal
// the count this file's own source ships (1:1 with the registered cases the
// runner reports). One changelog regex per language; both must exist.
test("F90: the changelog's docs-suite case count equals this suite's real case count", () => {
  const shipped = (read("../test/verification-docs.test.mjs").match(/^test\(/gm) || []).length;
  const claims = {
    "../../../CHANGELOG.md": /a (\d+)-case bilingual docs suite/,
    "../../../CHANGELOG.es.md": /suite bilingüe de documentación de (\d+) casos/,
  };
  for (const [relative, claim] of Object.entries(claims)) {
    const text = read(relative);
    const start = text.indexOf(PACKAGE_HEADING);
    const after = text.slice(start + PACKAGE_HEADING.length);
    const end = after.search(/^#{2,4} /m);
    const section = end === -1 ? after : after.slice(0, end);
    const stated = section.match(claim);
    assert.ok(stated, `${relative} no longer states the docs-suite case count (F90)`);
    assert.equal(Number(stated[1]), shipped, `${relative} claims ${stated[1]} cases; the suite ships ${shipped}`);
  }
});
