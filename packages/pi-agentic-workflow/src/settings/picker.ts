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
//  - `pagedSelect` is the plain-`select` counterpart: the host's dialog cap
//    (pi-web rejects > 24 options, PE-001) is never a picker concern — a UI
//    without the rich seam still gets a bounded dialog, and an over-cap list
//    pages instead of crashing.
//
// The filter is implemented in this package (not imported from Pi): PE-004
// confirmed pi-coding-agent's `fuzzyFilter` is internal, so the same
// token/subsequence, slash-aware semantics the acceptance criteria pin live here.

import { SelectList, type Component, type SelectItem, type SelectListTheme } from "@earendil-works/pi-tui";

/** Default window height for the SelectList (the built-in position indicator scales to the list). */
export const PICKER_MAX_VISIBLE = 10;

/**
 * The host dialog cap this package must never exceed (PE-001): pi-web rejects a
 * `select` dialog offering more than 24 options with "A select dialog must not
 * offer more than 24 options". It is the single knob if a future host enforces a
 * different bound.
 */
export const SELECT_OPTION_LIMIT = 24;

/** Pager entry offered on every page but the first. */
export const PAGED_SELECT_PREV = "◀ Previous page";
/** Pager entry offered on every page but the last. */
export const PAGED_SELECT_NEXT = "More options…";

/**
 * Data entries per page: `SELECT_OPTION_LIMIT - 3` — room inside one dialog for
 * both pager entries and the caller's trailing option.
 */
const PAGED_SELECT_PAGE_SIZE = SELECT_OPTION_LIMIT - 3;

/**
 * The pager label actually offered: `base`, decorated with `marker` while some
 * value in the dialog spells it, so a label-colliding data entry can never be
 * swallowed by the navigation guard (see the contract above).
 */
function pagerLabel(base: string, marker: string, spoken: readonly string[]): string {
  let label = base;
  while (spoken.includes(label)) label += marker;
  return label;
}

/** The plain-dialog shape `pagedSelect` drives (Pi's `ctx.ui.select`). */
export type SelectFn = (title: string, options: readonly string[]) => string | undefined | Promise<string | undefined>;

/**
 * Present `options` through `select` without ever offering more than
 * `SELECT_OPTION_LIMIT` entries in one dialog (AC6, PE-001, PE-012).
 *
 * - A list that fits — data plus `trailing` — opens exactly one dialog, in the
 *   caller's order with `trailing` last, so a ≤ cap flow is byte-identical to a
 *   plain `select` call.
 * - A longer list pages `PAGED_SELECT_PAGE_SIZE` data entries at a time —
 *   `SELECT_OPTION_LIMIT - 3`, so the derived page never hardcodes the cap —
 *   appending `PAGED_SELECT_PREV` and/or `PAGED_SELECT_NEXT` before `trailing`.
 *   Pager entries navigate; `trailing` and data entries are returned to the
 *   caller; `undefined` (cancel) passes straight through.
 *
 * The two pager labels are reserved: a data value (or a `trailing` value) that
 * spells one is indistinguishable from the pager entry in the string `select`
 * answers with, so a colliding pager label is decorated until it names nothing
 * else on the dialog — the data value stays selectable and so does the pager.
 */
export async function pagedSelect(
  select: SelectFn,
  title: string,
  options: readonly string[],
  { trailing }: { trailing?: string } = {},
): Promise<string | undefined> {
  const items = [...options];
  if (items.length + (trailing !== undefined ? 1 : 0) <= SELECT_OPTION_LIMIT) {
    return await select(title, trailing !== undefined ? [...items, trailing] : items);
  }

  // A label-colliding data value must stay reachable, so compute the offered
  // pager labels once against every string that can appear in a dialog.
  const spoken = trailing !== undefined ? [...items, trailing] : items;
  const prevLabel = pagerLabel(PAGED_SELECT_PREV, " ‹", spoken);
  const nextLabel = pagerLabel(PAGED_SELECT_NEXT, " ›", spoken);

  const pageCount = Math.ceil(items.length / PAGED_SELECT_PAGE_SIZE);
  let page = 0;
  for (;;) {
    const start = page * PAGED_SELECT_PAGE_SIZE;
    const entries = [
      ...items.slice(start, start + PAGED_SELECT_PAGE_SIZE),
      ...(page > 0 ? [prevLabel] : []),
      ...(page < pageCount - 1 ? [nextLabel] : []),
      ...(trailing !== undefined ? [trailing] : []),
    ];
    const answer = await select(title, entries);
    if (answer === undefined) return undefined;
    if (answer === nextLabel && page < pageCount - 1) {
      page += 1;
      continue;
    }
    if (answer === prevLabel && page > 0) {
      page -= 1;
      continue;
    }
    return answer;
  }
}

/**
 * The provider prefix Pi resolves a reference by — everything before the first
 * `/` (SPEC Decision 6).
 *
 * Lenient on purpose, and deliberately distinct from the strict
 * `parseModelReference` in `../config/schema.js`, which validates and rejects:
 * this split must answer for any registry string. Both the console's
 * provider-first grouping and the slash-aware filter below take their provider
 * from here, so the two settings-side consumers cannot drift apart.
 */
export function providerOf(reference: string): string {
  const slash = reference.indexOf("/");
  return slash === -1 ? reference : reference.slice(0, slash);
}

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
    const refProvider = providerOf(ref);
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
 *
 * `initial` — the value in force — is selected in the window the picker opens
 * with, through the SelectList's own `setSelectedIndex` (OB-3).
 */
export function createPickerComponent(options: {
  items: readonly SelectItem[];
  maxVisible: number;
  theme: SelectListTheme;
  /** The value in force, selected in the window the picker opens with (OB-3). */
  initial?: string;
  onSelect: (value: string) => void;
  onCancel?: () => void;
}): Component & { dispose?(): void } {
  const { items, maxVisible, theme, initial, onSelect, onCancel } = options;
  let filterText = "";
  let openSelectionApplied = false;

  const byValue = new Map(items.map((item) => [item.value, item]));
  const buildList = (): SelectList => {
    const visible = filterReferences(filterText, items.map((item) => item.value)).map(
      (value) => byValue.get(value) ?? { value, label: value },
    );
    const list = new SelectList(visible, maxVisible, theme);
    // Preselection is an open-time concern (OB-3): the value in force applies to
    // the first window only, so narrowing afterwards keeps the narrowed window's
    // own first match instead of yanking the selection to a filtered-out value.
    if (!openSelectionApplied) {
      openSelectionApplied = true;
      const index = initial === undefined ? -1 : visible.findIndex((item) => item.value === initial);
      if (index > 0) list.setSelectedIndex(index); // index 0 is already the SelectList default
    }
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
