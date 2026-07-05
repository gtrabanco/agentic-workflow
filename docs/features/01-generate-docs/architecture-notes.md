# 01 — generate-docs — Architecture notes

- **Layer**: skills layer, pure addition. No change to the orchestration
  contract (`orchestration-envelope` schema untouched — `generate-docs` emits
  the existing envelope; `unit.type: docs`).
- **Stack-agnostic rule**: the generic adapter contract is the skill's body;
  Starlight/Docusaurus specifics live only inside a clearly delimited
  "Adapters (reference implementations)" section — mirrors how review-perf
  keeps a "Web only" item n/a-able.
- **Touched skills** (all via `bump-skill`):
  - `execute-phase` — close-out `→ Next:` line (minor bump).
  - `audit-docs` — one checklist item (minor bump).
  - `init-workspace` — one interview item referencing the template's
    `Docs site` block (minor bump).
- **Template** — documentation-map file gains an optional block; copyable as-is
  by `npx degit` users (no interview required for them; block ships commented).
- **Invariants**: findings/review skills stay read-only; only `generate-docs`
  writes docs pages. Generated pages are the only files it may write; source
  code is Forbidden.
