# Decisions — fix/567-path-protection-bypass

Owner decisions and process rulings this unit rests on. Appended-only: a later
correction is a new dated row, never an edit of the row it corrects.

- **D1 — 2026-11-16** — **Route: this unit rides the fix-560 branch and PR #577** (same ruling as fix #566's D1): the owner selected `fix-here` ("Fix both here, on this branch & PR #577") after ordering "don't work on 566 worktree", and `refs-no-reopen` — the forge stays closed, the PR carries `Refs #567`, he handles forge state. One-PR-per-unit is knowingly overridden by prompt precedence. Evidence: PE-006, L2.
- **D2 — 2026-11-16** — **Enforcement shape (owner: `a-enforce`), full design.** The decision the issue's AC1 orders, recorded:
  1. **Where:** the extension's `tool_call` handler gains a shell-write guard call in the bash branch *after* the git-identity guard and *before* the seam dispatch; the seam hooks and the edit/write path are untouched (PE-001, PE-003).
  2. **What is evaluated (static visibility):** the command text is split at unquoted shell operators; per segment the guard extracts *literal* write targets — output-redirect operands (`>`, `>>`, `&>`), destinations of `cp|mv|install` (last operand), file args of `touch|mkdir|rmdir|rm|ln`, `tee` operands, `writeFile`/`appendFile`/`createWriteStream`-style **string literals** in the segment (which covers `node -e`/`bun -e` inline code), and heredoc redirect targets. A direct interpreter+script execution (`bun|node|bash|… <local file>`) additionally scans that file's own source (readable, ≤ `PATH_POLICY_MAX_BYTES`) for the same literals — one level, no recursion. The pure module exports `analyzeShellWrite` and `decideShellWrite` (PE-008).
  3. **Containment, mirroring `edit` fail-closed:** each candidate resolves through the same canonicalisation the handler already uses (`resolveRealTarget`: absent tails re-appended, symlinks followed, resolution errors fail closed); an unresolvable target blocks with the same reason family as `edit`.
  4. **Temp carve-out (before anything else):** a target under the OS temp dirs (`os.tmpdir()`, `/tmp`, `/var/tmp`) passes — this repository's own live-tree guard *mandates* bash scratch writes there, and temp is not a durable surface (PE-005). Without this carve-out the fix would break the workflow's §3 scratch rule.
  5. **Durable out-of-root:** owner-visible approval — `ctx.ui.confirm` when `ctx.hasUI === true`, block when headless or declined, the git-identity guard's exact posture (PE-004); no consent/remember store (D3).
  6. **In-root visible targets:** existing + protected → the same `evaluateToolCall` Tier 2 decision `edit` gets (policy + records corpus), never a looser path (PE-003); new/absent or unprotected pass.
  7. **Recorded boundary:** a write-shaped command with no statically visible literal target (computed destinations, runtime-built paths inside dependencies) **passes**, and the contract says so in those words ("not statically visible"). Fail-closing dynamic writes would block ordinary builds; re-opening this line is an owner decision (Future cost). Evidence: PE-009.
- **D3 — 2026-11-16** — **No consent surface.** The approval is per-call `ctx.ui.confirm("path protection", question)`; repeated legitimate flows re-ask. A remember/approval store would be a new receipt-class surface (receipt-neutrality cost) and is explicitly out of scope (Non-goals).
- **D4 — 2026-11-16** — **Contract placement.** The enforcement statement lands as section prose directly under the `path-protection@1` fence in `TURN_CONTRACT.md` — the fence keeps its reason table byte-identical (the block grammar and `PATH_GUARD_REASONS` never move), so `normative-drift` and the registry row stay green while AC3/AC4's prose pins (`shell-bound writes`, `not statically visible`) live on the section. The refusal messages keep `edit`'s wording for shared verdicts and add one shell-specific reason naming the bash call and the pre-execution block. Evidence: PE-007.
- **D5 — 2026-11-16** — **This unit authors one new test file** (the sibling suite); the Tier 1 plan block below declares it so a future preflight gate never reads the create as undeclared. This unit runs no Tier 1 gate (the deterministic gate does not carry one) and therefore writes no `path-protection-records@1` rows — a record without `execute-phase` authority would be a false receipt.

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | packages/pi-agentic-workflow/test/shell-write-guard.test.mjs | the red-first sibling suite pinning the shell-write guard (issue #567 AC1) |
```
