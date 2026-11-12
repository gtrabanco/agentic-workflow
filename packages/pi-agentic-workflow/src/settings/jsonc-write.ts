// src/settings/jsonc-write.ts
// The console's writer: a save edits the file it read instead of re-serializing
// it (issue #521 S7, owner decision D3).
//
// The config files are JSONC, so the operator may keep comments in them. The
// console used to rebuild the whole document with `JSON.stringify`, which
// deleted every comment on the first Save. `jsonc-parser` (Microsoft/VS Code,
// zero dependencies) computes a text edit for one path and applies it, so every
// byte outside the edited span — comments included — survives.
//
// The contract this module owns, stated where the console documents the save:
//  - a save with no change writes the original bytes back, byte for byte;
//  - changing a value rewrites only that value's span;
//  - adding or removing a member re-renders the object that holds it: its
//    comments are kept, its layout is normalized to the file's own indentation
//    and line endings;
//  - a comment attached to a removed member goes with it.

import { applyEdits, modify } from "jsonc-parser";

import { parseJsonc } from "@gtrabanco/agentic-workflow-schema";

import type { ConfigFile } from "../config/types.js";

/** One leaf the draft changed: where it sits and what it must become (`undefined` removes it). */
interface Edit {
  path: (string | number)[];
  value: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The file's own indentation and line endings, so a re-render does not fight the operator. */
function formattingFor(original: string): { insertSpaces: boolean; tabSize: number; eol: string } {
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const indent = /^([ \t]+)\S/m.exec(original)?.[1];
  if (indent === undefined) return { insertSpaces: true, tabSize: 2, eol };
  if (indent.startsWith("\t")) return { insertSpaces: false, tabSize: 1, eol };
  return { insertSpaces: true, tabSize: Math.max(1, indent.length), eol };
}

/**
 * Every leaf that differs, in a stable order: additions in the draft's own key
 * order, then removals. Objects are walked so a nested change stays a leaf
 * edit; arrays and scalars are leaves.
 */
function collectEdits(before: unknown, after: unknown, path: (string | number)[], out: Edit[]): void {
  if (isRecord(before) && isRecord(after)) {
    for (const key of Object.keys(after)) {
      if (!(key in before)) {
        out.push({ path: [...path, key], value: after[key] });
        continue;
      }
      collectEdits(before[key], after[key], [...path, key], out);
    }
    for (const key of Object.keys(before)) {
      if (!(key in after)) out.push({ path: [...path, key], value: undefined });
    }
    return;
  }
  if (JSON.stringify(before) !== JSON.stringify(after)) out.push({ path, value: after });
}

/**
 * The bytes to write for `file`, given the text the console opened.
 *
 * A missing or unparsable original is replaced with plain pretty JSON: there is
 * no comment to preserve, and merging into bytes we could not read would guess.
 */
export function applyConfigEdits(original: string | null, file: ConfigFile): string {
  const parsed = original === null ? null : parseJsonc(original);
  if (parsed === null || !parsed.ok) return `${JSON.stringify(file, null, 2)}\n`;

  const edits: Edit[] = [];
  collectEdits(parsed.value, file, [], edits);
  if (edits.length === 0) return original as string;

  const formattingOptions = formattingFor(original as string);
  let text = original as string;
  for (const edit of edits) {
    // A root leaf can only mean the draft stopped being an object; the validator
    // refuses that before the write, so this is the defensive replacement.
    if (edit.path.length === 0) return `${JSON.stringify(edit.value, null, 2)}\n`;
    text = applyEdits(text, modify(text, edit.path, edit.value, { formattingOptions }));
  }
  return text;
}
