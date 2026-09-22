/**
 * Changelog — versioned row add per named skill section.
 *
 * The changelog file uses headings like:
 *   #### `skillName`
 * followed by a Markdown table of version rows.
 *
 * rowAdd inserts a new row below the table header of the named section,
 * respecting the table's column order.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// ── Helpers ──────────────────────────────────────────────────────────────

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function shaPrefix(hex) {
  return hex.slice(0, 8);
}

function makeReceipt(service, op, path, schema, before, after, ok) {
  return { service, op, path, schema, before, after, ok };
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * rowAdd(table, sectionName, { version, date, type, what })
 * Inserts a new row below the table header of the named #### `skillName` section.
 *
 * table is the absolute path to the CHANGELOG.md (or similar).
 * sectionName is the skill name to target (matches #### `skillName`).
 * version, date, type, what are the column values for the new row.
 *
 * Returns a receipt.  Throws if the section is not found.
 */
export function rowAdd(table, sectionName, { version, date, type, what }) {
  const content = readFileSync(table, "utf8");
  const beforeHash = sha256(content);
  const lines = content.split("\n");

  // Find the section heading and insert the new row below its table header
  let inserted = false;
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);

    // Check if this is the target section heading
    const sectionMatch = lines[i].match(/^#### `(.+)`/);
    if (sectionMatch && sectionMatch[1] === sectionName) {
      // We're in the target section — look for the next table header
      let j = i + 1;
      for (; j < lines.length; j++) {
        if (lines[j].includes("|---|")) {
          // Found the table separator — insert the row after it
          const newRow = `| ${version} | ${date} | ${type} | ${what} |`;
          newLines.push(newRow);
          inserted = true;
          break;
        }
        // Stop if we hit a new section before finding the table
        if (lines[j].match(/^#{1,4} /)) {
          break;
        }
      }
      break;
    }
  }

  if (!inserted) {
    throw new Error(`Could not find section "#### \`${sectionName}\`" with a table in ${table}`);
  }

  const newContent = newLines.join("\n");
  writeFileSync(table, newContent, "utf8");
  const afterHash = sha256(newContent);

  return makeReceipt(
    "changelog",
    "rowAdd",
    table,
    "changelog-table@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    true,
  );
}