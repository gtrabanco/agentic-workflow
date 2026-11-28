# Arm summary — definitive counts (recomputed by `harness/score.mjs` over the packed outputs)

Effective review-countable ground truth: **U1 = 8 defect sources** (of the
ledger's F1–F8; see VERIFICATION.md for the nuances), **U2 = 9 file-matchable
defect sources** (11 recorded ids minus F4/F5, whose implicated sentences live
outside the changed diff and are unreachable for a content-reader arm at any
strength — an instrument note, not an arm note).

## Recall (matched ids per run: r1 / r2) and token cost per run

| unit | model | arm | matched ids (r1/r2) | findings/run median | tokens per run (r1/r2) | best |
|---|---|---|---|---|---|---|
| U1 | qwen3.6 | mono | 3 / 5 | 6 | 35,167 / 35,089 | 5 |
| U1 | qwen3.6 | slices | **7 / 7** | 15 | 39,241 / 40,530 | **7** |
| U1 | gemma4 | mono | 4 / 4 | 2 | 35,726 / 35,690 | 4 |
| U1 | gemma4 | slices | 6 / 5 | 6 | 38,344 / 38,402 | **6** (7 counting F1's r2 catch, the only call in the whole grid that hit U1-F1's re-based ceilings) |
| U2 | qwen3.6 | mono | 3 / 3 | 5 | 175,117 / 175,529 | 3 |
| U2 | qwen3.6 | slices | 6 / 6 | 32 | 204,920 / 205,293 | **6** |
| U2 | gemma4 | mono | 3 / 0 | 2 | 183,261 / 183,269 | 3 |
| U2 | gemma4 | slices | 6 / 8 | 16 | 191,162 / 191,485 | **8** |
| U2 | glm5.3-flash | mono | 7 / 5 | 10 | 177,110 / 174,058 | 7 (F1,F2,F3,F6,F13,F14,F15) |
| U2 | glm5.3-flash | slices | 7 / 8 | 44 | 196,601 / 201,154 | **8** |
| U2 | deepseek-v4-flash | mono | 8 / 8 | 70 | 183,717 / 183,937 | 8 |
| U2 | deepseek-v4-flash | slices | 8 / 9 | 167 | 202,119 / 209,736 | **9 = every file-matchable id** |

The packed cell ids are in `harness/out-*.json` (112 call records + the
metadata dumps); the full per-call table (tokens, wall, findings, parse state,
salvage flags) is [all-calls.csv](all-calls.csv).

## Cross-run unions (the ids any run of the arm produced)

- U1 qwen3.6 — mono: F2,F3,F5,F7,F8 (5); slices: F2,F3,F4,F5,F6,F7,F8 (7).
- U1 gemma4 — mono: F2,F3,F4,F8 (4); slices: F1,F2,F3,F4,F5,F7,F8 (7 — every
  id the mono arm's 2 runs missed except F6; F1 came from exactly one
  artifacts-budget slice call).
- U2 qwen3.6 — mono: F6,F13,F14 (3); slices: F2,F3,F7,F13,F15,F19 (6).
- U2 gemma4 — mono: F2,F13,F15 (3); slices: F2,F3,F6,F7,F13,F14,F15,F19 (8).
- U2 glm5.3-flash — mono: F1,F2,F3,F6,F13,F14,F15 (7); slices: F1,F2,F3,F6,F7,F13,F14,F15 (8).
- U2 deepseek-v4-flash — mono: F2,F3,F6,F7,F13,F14,F15,F19 (8); slices: F1,F2,F3,F6,F7,F13,F14,F15,F19 (9/9).

## Headline deltas this table pins

- **Slices ≥ mono in all 6 (unit × model) cells; no cell lost recall in the slices arm.**
- Gradient with reviewer strength on U2 (best mono → best slices): 3 → 6,
  3 → 8, 7 → 8, 8 → 9. The mono arm first saturates as strength rises; the
  slices arm keeps the lead, chiefly through two stores: the changed-anchor
  classes (U2-F1 registry row, caught in both strong models' runs and in the
  cross-run U1-F1 case) and mid-execution defects whose owner hunk is not the
  review call's center of gravity (U2-F19 byte ceilings, U2-F3 glued pipes).
- **Token cost of the slices arm: +4% (gemma4 U2) to +17% (qwen3.6 U2)** vs the
  mono call; wall-clock in production would pipeline at task boundaries (the
  measured per-call medians: slices 5–85 s vs mono 33–167 s on the strong tier).
- The recall the extra tokens buy arrives with **precision debt** on the
  recall-leaning models (deepseek slice unions: 129–205 raw findings/run vs the
  mono call's 66) — consumed downstream by the classification pack that
  `review-change` already runs.
