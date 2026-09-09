// src/settings/picker.ts
// The searchable windowed picker primitive (OB-1, OB-2, OB-12, PE-004).
//
// Two concerns live here on purpose:
//  - `filterReferences` is the pure, session-free subsequence/slash-aware filter
//    (OB-2). It is unit-tested in `test/picker-filter.test.mjs`.
//  - `createPickerComponent` wraps `@earendil-works/pi-tui`'s `SelectList` as a
//    `Component` so the adapter (extension/index.ts) can drive it through
//    `ctx.ui.custom()` — windowed rendering with a position indicator, typing
//    to narrow the list, selection, and cancel. The Pi-free `SettingsUi.pick`
//    seam stays separated so the filter and the component are exercisable
//    without a live session.
//
// The filter is implemented in this package (not imported from Pi): PE-004
// confirmed pi-coding-agent's `fuzzyFilter` is internal, so the same
// token/subsequence, slash-aware semantics the acceptance criteria pin live here.

import { SelectList, type Component, type SelectItem, type SelectListTheme } from "@earendil-works/pi-tui";

/** Default window height for the SelectList (the built-in position indicator scales to the list). */
export const PICKER_MAX_VISIBLE = 10;

/**
 * Token/subsequence, slash-aware reference filter (OB-2).
 *
 * - An empty query returns every reference.
 * - The query is split on whitespace; every token must match for a reference to
 *   survive.
 * - A token matched as a *subsequence* (characters in order, not necessarily
 *   contiguous): `flash` matches any reference containing `flash`, `a/c`
 *   matches `anthropic/claude`.
 * - A token ending in `/` constrains to the provider: `nan/` matches provider
 *   `nan` only, never a model id that merely contains `nan`.
 */
export function filterReferences(query: string, refs: readonly string[]): string[] {
  const tokens = query.trim().split(/\s+/u).filter((token) => token !== "");
  if (tokens.length === 0) return [...refs];
  return refs.filter((ref) => tokens.every((token) => matchesToken(token, ref)));
}

function matchesToken(token: string, ref: string): boolean {
  // Slash-aware: a trailing slash makes the token a provider prefix.
  if (token.endsWith("/")) {
    const provider = token.slice(0, -1);
    if (provider === "") return true;
    const refProvider = ref.split("/")[0] ?? "";
    return refProvider.startsWith(provider);
  }
  return isSubsequence(token, ref);
}

/** True when `needle` appears in `haystack` with its characters in order. */
function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
    if (haystack.charCodeAt(j) === needle.charCodeAt(i)) i += 1;
  }
  return i === needle.length;
}

/**
 * Wrap a `SelectList` as a pi-tui `Component`, rebuilding it client-side from
 * `filterReferences` as the operator types so the subsequence/slash-aware
 * filter (OB-2) — not `SelectList`'s own prefix `setFilter` — drives what the
 * window shows. Control keys (arrows, Enter, Escape) forward to the list.
 */
export function createPickerComponent(options: {
  items: readonly SelectItem[];
  maxVisible: number;
  theme: SelectListTheme;
  onSelect: (value: string) => void;
  onCancel?: () => void;
}): Component & { dispose?(): void } {
  const { items, maxVisible, theme, onSelect, onCancel } = options;
  let filterText = "";

  const byValue = new Map(items.map((item) => [item.value, item]));
  const buildList = (): SelectList => {
    const visible = filterReferences(filterText, items.map((item) => item.value)).map(
      (value) => byValue.get(value) ?? { value, label: value },
    );
    const list = new SelectList(visible, maxVisible, theme);
    list.onSelect = (item) => onSelect(item.value);
    list.onCancel = onCancel;
    return list;
  };

  let list: SelectList = buildList();

  return {
    render: (width) => list.render(width),
    invalidate: () => list.invalidate(),
    handleInput(data) {
      // Enter / Ctrl+C / ANSI sequences (arrows) go to the SelectList; any other
      // single character narrows the in-package filter and rebuilds the window.
      if (data === "\r" || data === "\u0003" || data.startsWith("\u001b") || data.length > 1) {
        list.handleInput(data);
        return;
      }
      filterText += data;
      list = buildList();
    },
    dispose: () => {
      // The SelectList holds no resources beyond the rendered lines.
    },
  };
}
