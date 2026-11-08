// Single-owner pin for the canonical turn contract (roadmap row 33, issue #173).
//
// The canonical turn contract — `skills/orchestration-envelope/references/TURN_CONTRACT.md`
// — is the single carrier of the "verify before ending the turn" rules. A
// `## Turn contract` section in a skill's SKILL.md must load the canonical file
// and add only skill-specific additions; a section that carries an inline box
// list and never references the canonical file is exactly the independently
// maintained copy that has drifted (contradicting boxes, duplicated
// docs-language lines, incompatible regimes for read-only skills).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(repoRoot, "skills");
const CANONICAL_REL = "skills/orchestration-envelope/references/TURN_CONTRACT.md";
const CANONICAL_REF = "references/TURN_CONTRACT.md";

/** The whole `## Turn contract` section of a SKILL.md (heading → next `## ` heading), or null. */
function turnContractSection(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^## Turn contract\b/.test(line));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function canonicalLoaders() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillFile = path.join(skillsRoot, entry.name, "SKILL.md");
      if (!existsSync(skillFile)) return null;
      const section = turnContractSection(readFileSync(skillFile, "utf8"));
      if (section === null) return null;
      return {
        skill: entry.name,
        section,
        loads: section.includes(CANONICAL_REF) || section.includes(CANONICAL_REL),
      };
    })
    .filter(Boolean);
}

test("the canonical turn contract exists and states its own single-owner rule", () => {
  const canonicalPath = path.join(repoRoot, CANONICAL_REL);
  assert.ok(existsSync(canonicalPath), `the canonical turn contract is missing: ${CANONICAL_REL}`);
  const canonicalText = readFileSync(canonicalPath, "utf8");
  assert.match(canonicalText, /Single owner:/, "the canonical contract states its own single-owner rule");
});

test("every skill turn-contract section loads the canonical contract", () => {
  const bespoke = canonicalLoaders().filter((entry) => !entry.loads && entry.skill !== "orchestration-envelope");
  assert.deepEqual(
    bespoke.map((entry) => entry.skill),
    [],
    `bespoke turn-contract sections outside ${CANONICAL_REL} (${CANONICAL_REF} not referenced): ${bespoke.map((entry) => entry.skill).join(", ")}`,
  );
});

test("skills carrying a turn contract section are counted and reported", () => {
  const carriers = canonicalLoaders().map((entry) => entry.skill).sort();
  assert.ok(carriers.length > 0, "the scan found at least one turn-contract carrier");
  assert.ok(
    carriers.every((name) => existsSync(path.join(skillsRoot, name, "SKILL.md"))),
    "every reported carrier is a discovered skill directory",
  );
});
