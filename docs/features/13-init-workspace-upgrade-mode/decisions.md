# 13 — init-workspace-upgrade-mode · decisions

## D1 — Mode selection: detection, not a flag (RESOLVED)

Upgrade vs. bootstrap is chosen by **Step 0 detection** (an existing
agentic-workflow scaffold is present), not a `--upgrade` flag. Keeps the skill's
"one adaptive door" framing. Marker heuristic: `CLAUDE.md` present **and** a
workflow marker (`docs/features/ROADMAP.md` or `docs/workflow/`). Escape hatch: a
`--upgrade` override is **deferred** (open question below) — only add it if
detection proves ambiguous in practice.

## D2 — Additive-only, never clobber (RESOLVED)

Upgrade mode **adds** missing blocks and **fills** raw placeholders; it **never
rewrites** a block the project already tailored and **never deletes**. This is
the feature's primary invariant. Rationale: an upgrade must be safe on a
heavily-customized substrate. A genuine re-tailor is a separate, explicitly
requested bootstrap-style adapt run.

## D3 — No `template/` change (RESOLVED)

The upgrade logic lives in the skill (`SKILL.md`). The documented recommendation
targets repo-level `README.md`/`README.es.md`/`docs/workflow/MIGRATION.md`, which
are **not** part of the exported `template/` scaffold. So `template/` is
untouched — consistent with "the skill migrates the substrate; the substrate
template is the source, not a consumer."

## D4 — Bump tier: minor (RESOLVED)

A **new mode** added without changing bootstrap behavior is additive and
backward-compatible → **minor** bump (`2.0.0 → 2.1.0`), not major. No flag
removed, no existing output shape changed.

## D5 — `MIGRATION.md` absent → diff-only + note (RESOLVED)

On an older install with no `docs/workflow/MIGRATION.md`, upgrade mode proceeds
on the **template diff alone** and notes that per-block rationale was
unavailable. The diff still surfaces every missing block; only the "why" is
thinner. Acceptable — better than refusing to upgrade.

## Open questions

- **`--upgrade` override** — deferred (D1). Revisit only if detection
  false-negatives are reported. Not built in this feature.
