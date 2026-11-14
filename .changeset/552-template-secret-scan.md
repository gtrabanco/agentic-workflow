---
"@gtrabanco/pi-agentic-workflow": patch
---

feat(hooks): ship the push-range secret scan in the template (issue #552)

The deterministic scan #487 built lived in `scripts/secret-scan.mjs`, i.e. only
in the repository that authored it — a target project scaffolded by
`init-workspace` had no barrier against a credential riding a prose-only push,
which is the leak path the issue names. Owner decision (2026-11-14): "secret scan
sin el local-gate debe estar en el template de agentic workflow".

The implementation now lives in `template/.agentic-workflow/hooks/secret-scan.mjs`
— one file, moved, not copied — and this repository's `local-gate` step calls it,
so the gate and the scaffold share one scanner instead of drifting into two.
Beside it, `secret-scan.sh` is the runner a project arms as a `pre-push` hook:
it resolves `bun`, else `node`, execs the module with the caller's argv and
forwards the exit code, and refuses by name when neither runtime exists rather
than skipping the scan. `init-workspace` offers it as one consent question and
never installs it without a yes; the hooks README documents both the hook and the
manual invocation, the exit contract and every degradation.

Two configuration facts changed to make the file portable, neither a behaviour
change: the scanned root is now the caller's git working-tree top (`--root`
overrides) instead of the module's own directory — which after the move would
have scanned almost nothing, and which a subdirectory run would otherwise narrow
— and the allowlist is project configuration, `.agentic-workflow/hooks/
secret-scan-allowlist.json` under that root with `--allowlist <path>` as the
override, an absent file allowing nothing. This repository's
`scripts/secret-scan-allowlist.json` keeps its path and its bytes, handed to the
step as the override.

The rules, the push-range semantics (added lines only, removal never a finding,
the whole-tree fallback), the report shape and the 0/1/2 exit contract are #487's
and unchanged — the base-vs-head differential in the unit doc's Log records the
same verdicts before and after the move. The corpus stays in
`scripts/secret-scan.test.mjs` (the gate inventory's carrier for the step, and the
root suite's discovery pattern) with new cases for the project allowlist, the
never-narrowing root, the single-source pins and the runner; the template gains
its own `tests/test-secret-scan.sh`, which a scaffolded project can run.

The template half ships through the repository tree (`npx degit
gtrabanco/agentic-workflow/template`), which is why this entry is the skill
package's patch: `init-workspace`'s consent offer is the only packaged surface.
