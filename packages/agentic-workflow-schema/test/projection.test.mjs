/**
 * projection — the workflow-projection vocabulary contract (issue #406).
 *
 * This suite is the contract's only judge: the six published vocabularies, the
 * projection-manifest rule grammar (three ops, the four locator selector forms,
 * the except-child keep-list, the per-rule content hash), the guard-verdict
 * fail-closed message contract, and the parity between the hand-written
 * validators and the two published Draft-07 projections.
 *
 * The valid and invalid fixtures are the schema's test corpus: a rule the
 * validator accepts must compile and validate under strict Ajv, and a rule it
 * refuses must be refused by the schema too — otherwise one of the two
 * authorities is the defect.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import {
  PROJECTION_SEAMS,
  PROJECTION_OPS,
  PROJECTION_SELECTOR_KINDS,
  PROJECTION_HASH_ALGORITHMS,
  GUARD_VERDICTS,
  GUARD_REJECTION_REASONS,
  PROJECTION_MANIFEST_CONTRACT_ID,
  PROJECTION_MANIFEST_VERSION,
  GUARD_VERDICT_CONTRACT_ID,
  GUARD_VERDICT_VERSION,
  isProjectionSeam,
  validateProjectionManifestV1,
  validateGuardVerdictV1,
} from "../dist/index.js";

const packageFile = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const fixture = (rel) => JSON.parse(readFileSync(packageFile(`test/fixtures/projection/${rel}`), "utf8"));

const ajv = new Ajv({ strict: true });
const manifestSchema = JSON.parse(readFileSync(packageFile("projection-manifest.schema.json"), "utf8"));
const guardSchema = JSON.parse(readFileSync(packageFile("guard-verdict.schema.json"), "utf8"));
const schemaValidatesManifest = ajv.compile(manifestSchema);
const schemaValidatesGuard = ajv.compile(guardSchema);

const malformed = (value) => {
  const result = validateProjectionManifestV1(value);
  assert.equal(result.ok, false, "the validator accepts a fixture the schema must refuse");
  return result.errors.join("\n");
};

test("publishes the six vocabularies as non-empty, unique closed sets", () => {
  for (const [name, set] of [
    ["PROJECTION_SEAMS", PROJECTION_SEAMS],
    ["PROJECTION_OPS", PROJECTION_OPS],
    ["PROJECTION_SELECTOR_KINDS", PROJECTION_SELECTOR_KINDS],
    ["PROJECTION_HASH_ALGORITHMS", PROJECTION_HASH_ALGORITHMS],
    ["GUARD_VERDICTS", GUARD_VERDICTS],
    ["GUARD_REJECTION_REASONS", GUARD_REJECTION_REASONS],
  ]) {
    assert.ok(Array.isArray(set) && set.length > 0, `${name} is a non-empty published array`);
    assert.equal(new Set(set).size, set.length, `${name} has no duplicate member`);
    for (const token of set) // Selector kinds keep the locator's camelCase JSON keys, so a member is a
    // lowerCamel token or a `lowerCamel:lowerCamel` seam pair.
    assert.match(token, /^[a-z][A-Za-z0-9-]*(?::[a-z][A-Za-z0-9-]*)?$/u, `${name} member ${token}`);
  }
  assert.deepEqual([...PROJECTION_OPS], ["remove", "pointerize", "prereq"]);
  assert.deepEqual([...PROJECTION_SELECTOR_KINDS], ["heading", "path", "headingRegex", "line"]);
  assert.deepEqual([...GUARD_VERDICTS], ["allow", "block", "degrade"]);
  assert.deepEqual([...PROJECTION_HASH_ALGORITHMS], ["sha256"]);
});

test("the seam guard refuses an unknown seam", () => {
  assert.equal(isProjectionSeam(fixture("seams/valid.json").seam), true);
  assert.equal(isProjectionSeam(fixture("seams/unknown.json").seam), false);
  assert.equal(isProjectionSeam("phase:end"), true);
  assert.equal(isProjectionSeam("phase:terminate"), false);
  assert.equal(isProjectionSeam(""), false);
  assert.equal(isProjectionSeam(null), false);
});

test("validates a valid manifest carrying every op and selector form", () => {
  const value = fixture("valid-manifest.json");
  const result = validateProjectionManifestV1(value);
  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));
  assert.equal(result.manifest.contract, PROJECTION_MANIFEST_CONTRACT_ID);
  assert.equal(result.manifest.version, PROJECTION_MANIFEST_VERSION);
  assert.deepEqual(result.manifest.rules.map((rule) => rule.op), ["remove", "pointerize", "prereq", "remove", "remove"]);
  assert.deepEqual(result.manifest.rules[0].selector, { path: ["Preflight", "Diff guard"] });
  assert.deepEqual(result.manifest.rules[0].except, [["Preflight", "Diff guard", "Exemptions"]]);
  assert.equal(schemaValidatesManifest(value), true, JSON.stringify(schemaValidatesManifest.errors));
});

test("validates the empty manifest the stripper ships first", () => {
  const value = fixture("empty-manifest.json");
  const result = validateProjectionManifestV1(value);
  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));
  assert.deepEqual(result.manifest.rules, []);
  assert.equal(schemaValidatesManifest(value), true, JSON.stringify(schemaValidatesManifest.errors));
});

test("refuses an unknown op with the op named in the error", () => {
  const errors = malformed(fixture("unknown-op.json"));
  assert.match(errors, /rules\[0\]\.op/u);
  assert.match(errors, /strip/u);
  assert.equal(schemaValidatesManifest(fixture("unknown-op.json")), false);
});

test("refuses a malformed selector: zero or two forms, within off a line selector", () => {
  const two = malformed(fixture("malformed-two-selectors.json"));
  assert.match(two, /exactly one of heading, path, headingRegex, line/u);
  assert.equal(schemaValidatesManifest(fixture("malformed-two-selectors.json")), false);

  const none = malformed(fixture("malformed-no-selector.json"));
  assert.match(none, /exactly one of heading, path, headingRegex, line/u);
  assert.equal(schemaValidatesManifest(fixture("malformed-no-selector.json")), false);

  const within = malformed(fixture("malformed-within-on-path.json"));
  assert.match(within, /within only scopes a line selector/u);
  assert.equal(schemaValidatesManifest(fixture("malformed-within-on-path.json")), false);
});

test("refuses an uncompilable regex and a malformed content hash", () => {
  const regex = malformed(fixture("malformed-regex.json"));
  assert.match(regex, /not a valid regular expression/u);
  // Draft-07 cannot compile a pattern, so this one is the validator's alone.
  assert.equal(schemaValidatesManifest(fixture("malformed-regex.json")), true);

  const hash = malformed(fixture("malformed-hash.json"));
  assert.match(hash, /contentHash/u);
  assert.equal(schemaValidatesManifest(fixture("malformed-hash.json")), false);
});

test("refuses an undeclared rule field, a duplicate id, and except on a non-remove op", () => {
  const extra = malformed(fixture("unknown-field.json"));
  assert.match(extra, /unknown key: pointer/u);
  assert.equal(schemaValidatesManifest(fixture("unknown-field.json")), false);

  const duplicate = malformed(fixture("duplicate-ids.json"));
  assert.match(duplicate, /duplicate rule id/u);
  // Uniqueness across array members is not a Draft-07 keyword this grammar can
  // express (uniqueItems compares whole rules), so the validator owns it alone.
  assert.equal(schemaValidatesManifest(fixture("duplicate-ids.json")), true);

  const except = malformed(fixture("except-on-pointerize.json"));
  assert.match(except, /except is only legal on a remove rule/u);
  assert.equal(schemaValidatesManifest(fixture("except-on-pointerize.json")), false);
});

test("validates the three guard verdicts and refuses a rejection with no enforcing command", () => {
  for (const name of ["guard/allow.json", "guard/block.json", "guard/degrade.json"]) {
    const value = fixture(name);
    const result = validateGuardVerdictV1(value);
    assert.equal(result.ok, true, `${name}: ${result.ok ? "" : result.errors.join("\n")}`);
    assert.equal(schemaValidatesGuard(value), true, `${name}: ${JSON.stringify(schemaValidatesGuard.errors)}`);
  }

  const missing = fixture("guard/block-missing-command.json");
  const refused = validateGuardVerdictV1(missing);
  assert.equal(refused.ok, false);
  assert.match(refused.errors.join("\n"), /enforcingCommand/u);
  assert.equal(schemaValidatesGuard(missing), false);

  const unknown = fixture("guard/unknown-verdict.json");
  const refusedUnknown = validateGuardVerdictV1(unknown);
  assert.equal(refusedUnknown.ok, false);
  assert.match(refusedUnknown.errors.join("\n"), /verdict must be one of allow\|block\|degrade/u);
  assert.equal(schemaValidatesGuard(unknown), false);
});

test("the published schemas and the validators agree on every closed vocabulary", () => {
  assert.equal(manifestSchema.properties.contract.const, PROJECTION_MANIFEST_CONTRACT_ID);
  assert.equal(manifestSchema.properties.version.const, PROJECTION_MANIFEST_VERSION);
  assert.deepEqual(manifestSchema.definitions.rule.properties.op.enum, [...PROJECTION_OPS]);
  assert.deepEqual(manifestSchema.definitions.rule.properties.contentHash.pattern, `^${PROJECTION_HASH_ALGORITHMS[0]}:[0-9a-f]{64}$`);
  assert.deepEqual(
    manifestSchema.definitions.selector.oneOf.map((branch) => branch.required[0]),
    [...PROJECTION_SELECTOR_KINDS],
  );
  assert.equal(guardSchema.properties.contract.const, GUARD_VERDICT_CONTRACT_ID);
  assert.equal(guardSchema.properties.version.const, GUARD_VERDICT_VERSION);
  assert.deepEqual(guardSchema.properties.verdict.enum, [...GUARD_VERDICTS]);
  assert.deepEqual(guardSchema.properties.reason.enum, [...GUARD_REJECTION_REASONS]);
  assert.equal(manifestSchema.additionalProperties, false);
  assert.equal(guardSchema.additionalProperties, false);
});

test("the README's closed-vocabulary table restates exactly the published sets", () => {
  const readme = readFileSync(packageFile("README.md"), "utf8");
  // Slice to this contract's own section: the README carries further
  // closed-vocabulary tables (issue #201's pass-routing one follows it), and a
  // row outside this contract's section is not this contract's restatement.
  const sectionStart = readme.indexOf("### Closed vocabularies", readme.indexOf("## The workflow-projection contract (issue #406)"));
  const sectionEnd = readme.indexOf("## Review-pass routing vocabularies");
  const section = readme.slice(sectionStart, sectionEnd === -1 ? undefined : sectionEnd);
  const rows = section.split("\n").filter((line) => /^\| `[A-Z_]+` \|/u.test(line));
  const table = new Map(
    rows.map((line) => {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      const name = cells[0].replaceAll("`", "");
      const values = cells[1].split(" · ").map((value) => value.replaceAll("`", ""));
      return [name, values];
    }),
  );
  const published = {
    PROJECTION_SEAMS,
    PROJECTION_OPS,
    PROJECTION_SELECTOR_KINDS,
    PROJECTION_HASH_ALGORITHMS,
    GUARD_VERDICTS,
    GUARD_REJECTION_REASONS,
  };
  assert.equal(table.size, Object.keys(published).length, "one README row per published set");
  for (const [name, set] of Object.entries(published)) {
    assert.deepEqual(table.get(name), [...set], `${name} restates its published members in order`);
  }
});
