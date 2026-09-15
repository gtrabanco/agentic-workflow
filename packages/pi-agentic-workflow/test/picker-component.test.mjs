// picker-component.test.mjs — F8 fold (fix #214)
// The rich picker's open-time preselection. `PickerOptions.initial` is declared
// "preselected when the picker opens (OB-3)" (src/routing/types.ts), pi-tui's
// SelectList supports it (`setSelectedIndex`), and the console passes the value
// in force at every rich-pick call site — but the component the adapter builds
// ignored it. Written red-first against the pre-fold bytes: every case asserting
// the initial value failed with the first item selected instead.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createPickerComponent } from "../dist/settings/picker.js";

const VALUES = ["model-01", "model-02", "model-03", "model-04"];

/** The five theme hooks SelectList needs; the selected row keeps its `→ ` prefix. */
const theme = {
  selectedPrefix: (text) => `→ ${text}`,
  selectedText: (text) => text,
  description: (text) => text,
  scrollInfo: (text) => text,
  noMatch: (text) => `  ${text}`,
};

/** Build the component over the fixed fixture and drive it with scripted keys. */
function drive(keys, options = {}) {
  const selected = [];
  const component = createPickerComponent({
    items: VALUES.map((value) => ({ value, label: value })),
    maxVisible: 10,
    theme,
    onSelect: (value) => selected.push(value),
    ...options,
  });
  for (const key of keys) component.handleInput(key);
  return { selected, component };
}

test("F8: the picker opens on the value in force, not the first item", () => {
  const { selected, component } = drive(["\r"], { initial: "model-03" });

  assert.deepEqual(selected, ["model-03"], "Enter accepts the preselected value in force");
  assert.ok(
    component.render(60).some((line) => line.includes("→ model-03")),
    `the selected row is the value in force, got ${JSON.stringify(component.render(60))}`,
  );
});

test("F8: an initial value outside the offered list keeps the default first item", () => {
  const { selected } = drive(["\r"], { initial: "model-09" });

  assert.deepEqual(selected, ["model-01"], "an unmatched value in force preselects nothing");
});

test("F8: no initial value keeps the default first item (unchanged behavior)", () => {
  const { selected } = drive(["\r"]);

  assert.deepEqual(selected, ["model-01"]);
});

test("F8: preselection is an open-time concern, not re-applied on every keystroke", () => {
  // "m" matches every fixture value, so a per-rebuild re-application of
  // `initial` would keep model-03 selected after typing; the contract preselects
  // "when the picker opens", so the rebuilt window starts at its first match.
  const { selected } = drive(["m", "\r"], { initial: "model-03" });

  assert.deepEqual(selected, ["model-01"], "the widened window keeps its own first match");
});
