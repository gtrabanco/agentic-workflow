#!/usr/bin/env node

/**
 * Seeded residue fixture for `product-audit`'s residue sweeps (#340, issue AC1).
 *
 * Writes two deterministic twin trees into the target directory:
 *   <target>/seeded/ — exactly one seed per residue class:
 *     (a) a duplicated grammar copy      (lib/grammar.md vs docs/grammar-copy.md)
 *     (b) an exported-but-unconsumed fn  (lib/orphan.js, referenced nowhere)
 *     (c) a doc naming a removed surface (docs/legacy-surface.md → --legacy-residue-flag)
 *     (d) a live consumer-facing surface with no doc (lib/api.js, consumed by
 *         lib/main.js, absent from docs/)
 *   <target>/clean/  — the same shape with all four defects repaired.
 *
 * Running the residue sweeps over `seeded/` must yield exactly one finding per
 * seed (four findings); over `clean/`, zero findings. The trees are written on
 * demand outside the repository — never committed.
 *
 * Usage: node scripts/product-audit-residue-fixture.mjs <target-dir>
 */

import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("usage: node scripts/product-audit-residue-fixture.mjs <target-dir>");
  process.exit(1);
}

const GRAMMAR = `demo-grammar@1
kind | shape | what it orders
greeting | hello(<name>) | greets the named caller
farewell | goodbye(<name>) | dismisses the named caller
`;

const files = {
  seeded: {
    "lib/grammar.md": `# Demo grammar\n\n${GRAMMAR}`,
    "docs/grammar-copy.md": `# Grammar reference (copy)\n\n${GRAMMAR}`,
    "lib/orphan.js": `// Seed (b): exported as part of the delivered feature, invoked by nothing.\nexport function orphanResidueFormatter(value) {\n  return String(value).trim();\n}\n`,
    "docs/legacy-surface.md": `# Legacy surface\n\nPass \`--legacy-residue-flag\` to enable the legacy sweep mode. No such flag\nexists anywhere in this tree — the surface it describes was removed.\n`,
    "lib/api.js": `// Seed (d): a live consumer-facing surface (consumed by main.js) with no doc.\nexport function residueApi(bounds) {\n  return { upper: bounds.upper ?? 0 };\n}\n`,
    "lib/main.js": `import { residueApi } from "./api.js";\n\nexport function main(bounds) {\n  return residueApi(bounds);\n}\n`,
  },
  clean: {
    "lib/grammar.md": `# Demo grammar\n\n${GRAMMAR}`,
    "docs/grammar.md": `# Demo grammar — reference\n\nThe single normative grammar lives in \`lib/grammar.md\`; this doc links it\ninstead of copying it.\n`,
    "lib/api.js": `export function residueApi(bounds) {\n  return { upper: bounds.upper ?? 0 };\n}\n`,
    "lib/main.js": `import { residueApi } from "./api.js";\n\nexport function main(bounds) {\n  return residueApi(bounds);\n}\n`,
    "docs/api.md": `# residueApi\n\n\`residueApi(bounds)\` returns \`{ upper }\`, clamping a missing \`upper\` to 0.\nConsumed by \`lib/main.js\`.\n`,
  },
};

for (const [tree, entries] of Object.entries(files)) {
  for (const [rel, content] of Object.entries(entries)) {
    const file = path.join(target, tree, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

console.log(`seeded residue fixture written to ${target} (seeded/ + clean/)`);
