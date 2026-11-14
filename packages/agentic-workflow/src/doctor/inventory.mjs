/**
 * inventory.mjs — the documented tool inventory (issue #537 S8).
 *
 * The crate README is the single declaration of every default third-party tool:
 * what it is, why the workflow needs it, whether it is required or optional, how
 * it is detected, what the alternative is, and which install route it takes. The
 * code (`checks.mjs`) owns only the probes, keyed by the same ids, so neither a
 * documented tool without a probe nor a probe without a documented row can ship
 * (`doctor.inventory.test.mjs` refuses either half alone).
 *
 * The block is a `tool-inventory@1` marker line followed by a pipe table inside a
 * fence — the same shape `scripts/prose-gate-inventory.mjs` owns for the gate
 * inventory, read here by a parser that is pure: it returns errors instead of
 * throwing, so a fixture and the shipped README go through one path.
 */

export const INVENTORY_MARKER = "tool-inventory@1";

/** The closed column order. Extending it is a SPEC change in the unit doc. */
export const INVENTORY_COLUMNS = Object.freeze([
  "id",
  "what",
  "why",
  "requirement",
  "detected-by",
  "alternative",
  "install-route",
]);

/** Where the declaration lives, relative to the package root. */
export const INVENTORY_SOURCE = "packages/agentic-workflow/README.md";

const FENCE = /^\s*(```+|~~~+)/u;
const SLUG = /^[a-z0-9][a-z0-9-]*$/u;

/**
 * Parse the documented inventory out of a document's bytes.
 *
 * @param {string} text
 * @returns {{marker: string|null, columns: string[], rows: object[], errors: {message:string, line:number}[]}}
 */
export function parseInventory(text) {
  const errors = [];
  const rows = [];
  const seen = new Set();
  const lines = String(text ?? "").split("\n");

  let fence = null;
  let inBlock = false;
  let skipMarker = false;
  let header = null;
  let blockLine = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const trimmed = raw.trim();

    if (fence !== null) {
      if (skipMarker) {
        skipMarker = false;
        continue;
      }
      if (trimmed !== "" && /^(`{3,}|~{3,})$/u.test(trimmed) && trimmed[0] === fence[0]) {
        fence = null;
        continue;
      }
      if (!inBlock) continue;
      if (trimmed === "" || trimmed.startsWith("# ")) continue;
      const cells = trimmed.split("|").map((cell) => cell.trim());
      while (cells.length > 0 && cells[0] === "") cells.shift();
      while (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
      if (header === null) {
        header = cells;
        if (cells.length !== INVENTORY_COLUMNS.length || cells.some((cell, at) => cell !== INVENTORY_COLUMNS[at])) {
          errors.push({ message: `the ${INVENTORY_MARKER} header must be exactly \`${INVENTORY_COLUMNS.join(" | ")}\`, got \`${cells.join(" | ")}\``, line: index + 1 });
        }
        continue;
      }
      if (cells.every((cell) => /^:?-{2,}:?$/u.test(cell) || cell === "")) continue;
      if (cells.length !== INVENTORY_COLUMNS.length) {
        errors.push({ message: `inventory row \`${cells[0] ?? "?"}\` has ${cells.length} cells, expected ${INVENTORY_COLUMNS.length}`, line: index + 1 });
        continue;
      }
      const row = {};
      INVENTORY_COLUMNS.forEach((column, at) => {
        row[column] = cells[at];
      });
      if (!SLUG.test(row.id)) {
        errors.push({ message: `inventory row \`${row.id}\` is not a kebab-case id`, line: index + 1 });
        continue;
      }
      if (seen.has(row.id)) {
        errors.push({ message: `duplicate inventory id \`${row.id}\``, line: index + 1 });
        continue;
      }
      seen.add(row.id);
      rows.push(row);
      continue;
    }

    const opened = FENCE.exec(trimmed);
    if (opened && lines[index + 1]?.trim() === INVENTORY_MARKER) {
      fence = opened[1];
      inBlock = true;
      skipMarker = true;
      blockLine = index + 2;
    }
  }

  if (blockLine === 0) {
    return { marker: null, columns: [], rows: [], errors: [{ message: `no ${INVENTORY_MARKER} block was found`, line: 0 }] };
  }
  if (rows.length === 0 && errors.length === 0) {
    errors.push({ message: `the ${INVENTORY_MARKER} block declares no row`, line: blockLine });
  }
  return { marker: INVENTORY_MARKER, columns: header ?? [], rows, errors };
}
