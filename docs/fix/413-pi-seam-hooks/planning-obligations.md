# Planning obligations — fix/413-pi-seam-hooks

Nine-column shape owned by `skills/pre-execution-review/references/LEDGERS.md`:
`obligation-id | authority-source | affected-use-case-or-invariant | phase | task |
implementation-owner | validator | required-evidence | status`. Every row is
`planned` at cut time; a row flips to `verified` only with its validator run in
the foreground (governing request §8).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | Hook config is discovered project-local (`.pi/hooks.json`) then global (`<agentDir>/hooks.json`), the project entry winning per entry, mirroring the established config precedence | P2 | P2 | `src/hooks/config.ts` | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` exits 0 with the precedence case passing | E-line in `## Log` naming the run | verified |
| O2 | S2 · S3 | An untrusted project's hook config is never read — a cloned repository cannot steer execution | P2 | P2 | `src/hooks/config.ts` | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` exits 0 with the untrusted case passing | E-line in `## Log` | verified |
| O3 | S3 | Nothing executes without the explicit consent marker written by init-workspace (`<agentDir>/seam-hooks-consent.json`, keyed by absolute project path); no consent → zero spawned commands | P2 | P2 | `src/hooks/config.ts` | `bun test packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` exits 0 with the no-consent case passing | E-line in `## Log` | verified |
| O4 | S3 | Per-seam opt-in: a matcher group without `"enabled": true` never runs — declaring a hook is not consent; off by default proven by test | P2 | P2 | `src/hooks/config.ts` | `bun test packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` exits 0 with the off-by-default case passing | E-line in `## Log` | verified |
| O5 | S6 | Missing config → declared no-op; broken config (bad JSON, unknown event key, malformed group) → declared no-op + problem notice naming the file and reason, never a silent pass and never a throw into the session | P2 | P2 | `src/hooks/config.ts` | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` exits 0 with the broken-config cases passing | E-line in `## Log` | verified |
| O6 | S9 | Commands are spawned without a shell: argv tokenization only, and a command carrying shell metacharacters (`| & ; < > ( ) $ \` newline glob/brace chars) is refused as `config-invalid` before any spawn | P3 | P3 | `src/hooks/runner.ts` | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 with the metacharacter-refusal cases passing | E-line in `## Log` | verified |
| O7 | S4 · S9 | Captured hook output is bounded (per-stream byte cap with a truncation marker) and each hook has a hard wall-clock timeout | P3 | P3 | `src/hooks/runner.ts` | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 with the bounded-output and timeout cases passing | E-line in `## Log` | verified |
| O8 | S4 | Exit 0 → `allow`; non-zero → `block` whose teaching message quotes the declared requirement (the hook's command at the named seam) using the guard-verdict/rejection-reason grammar | P3 | P3 | `src/hooks/runner.ts` | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 with the teaching-message case passing | E-line in `## Log` | verified |
| O9 | S4 | Hook children spawn through the runtime module (`runtimeBin()`/`runtimeEnv()`), never a hardcoded `node`/`bun` | P3 | P3 | `src/hooks/runner.ts` | `rg -n 'spawn' packages/pi-agentic-workflow/src/hooks/` matches only calls passing `runtimeEnv()`-derived env, and the runner suite passes | E-line in `## Log` | verified |
| O10 | S7 | Config form is hooks.json-compatible: top-level `"hooks"` map → event key → matcher groups → handlers `{type: "command", command, timeout}`; `SessionStart`/`SessionEnd` alias to `session:start`/`session:end`; unknown event keys are `config-invalid`; the compatibility table ships in the package README | P2 · P6 | P2 · P6 | `src/hooks/config.ts` · README | `bun test packages/pi-agentic-workflow/test/hooks-config.test.mjs` exits 0 with the alias and unknown-key cases passing; the README table lists all nine seams + the two aliases | E-line in `## Log` + README table present in the diff | verified |
| O11 | S5 | `autoCommit`/`autoPush` default false, are valid only on `phase:end`/`unit:end` groups (`config-invalid` elsewhere), and `autoPush` requires `autoCommit`; an auto action runs only after the seam's hooks allow | P4 | P4 | `src/hooks/dispatcher.ts` | `bun test packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` exits 0 with the auto-flag cases passing | E-line in `## Log` | verified |
| O12 | S4 · S8 | The extension fires `session:start`/`session:end` from the pi lifecycle and `pre:commit` (block on failure) / `post:commit` / `pre:push` from `git commit`/`git push` interception — the S8 fixture proof: a git sandbox with a declared `pre:commit` check sees it run and block on failure | P5 | P5 | `src/extension/hooks-wiring.ts` | `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` exits 0, including the sandbox fixture case | E-line in `## Log` | verified |
| O13 | S3 · out-of-scope row 4 | The dispatcher never writes or edits a project's hook config; the only consent writer is the init-workspace flow (its deterministic marker write), so `src/hooks/` carries no write path | P4 | P4 | `src/hooks/` | `rg -n 'writeFile|writeFileSync|appendFile' packages/pi-agentic-workflow/src/hooks/` matches nothing | E-line in `## Log` quoting the zero-match count | verified |
| O14 | S10 | Package suites and the touched root suites are green, and the docs (package README, `docs/workflow/SEAM_HOOKS.md`, roadmap + fixes rows, generated projection) ship in the same PR | P6 · P7 · P8 | P6–P8 | whole change | `bun run test` in `packages/pi-agentic-workflow` exits 0; `bun scripts/docs-generate.mjs --check` exits 0; `bun scripts/check-skill-context.mjs --routes` exits 0 | E/G-lines in `## Log` | verified |
| O15 | S4 · S9 | A declared hook whose command cannot be spawned is a `block` naming the spawn failure — never an unhandled `error` event that kills the host and never a seam that never returns | P9 | P9 | `src/hooks/runner.ts` | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 with the unspawnable-command case passing | E-line in `## Log` | verified |
| O16 | S4 | A failing `session:start` / `session:end` hook surfaces its teaching message: a session seam cannot block the session, so it reports — never silent | P9 | P9 | `src/extension/hooks-wiring.ts` | `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` exits 0 with both failing-session-seam cases passing | E-line in `## Log` | verified |
| O17 | S2 · S4 | `pre:commit` / `pre:push` fire for a git invocation that carries an option value or a leading environment assignment (`git -C <p> commit`, `git -c k=v commit`, `git --git-dir=<p> commit`, `GIT_DIR=x git commit`) | P9 | P9 | `src/extension/hooks-wiring.ts` | `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` exits 0 with the interception-matrix cases passing | E-line in `## Log` | verified |
| O18 | S4 | Segment splitting honours quotes: a shell operator inside a quoted argument never creates a phantom segment whose leading word is `git` | P9 | P9 | `src/extension/hooks-wiring.ts` | `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` exits 0 with the quoted-separator case passing | E-line in `## Log` | verified |
| O19 | S4 · S9 | Output volume never changes a verdict: a hook past the per-stream cap is truncated with the marker and its remainder drained, and the verdict stays its exit code | P9 | P9 | `src/hooks/runner.ts` | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 with the loud-but-passing case (verdict `allow`) passing | E-line in `## Log` | verified |
| O20 | S3 · S6 | An `enabled` group without the consent marker announces itself once — inert, naming the consent file — while still spawning nothing | P9 | P9 | `src/hooks/dispatcher.ts` · `src/extension/hooks-wiring.ts` | `bun test packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` and `test/hooks-wiring.test.mjs` exit 0 with the inert-notice cases passing and zero spawns | E-line in `## Log` | verified |
| O21 | S4 | The teaching message quotes the declaration exactly as written — its own quoting preserved, not re-joined from the argv | P9 | P9 | `src/hooks/runner.ts` | `bun test packages/pi-agentic-workflow/test/hooks-runner.test.mjs` exits 0 with the quoted-declaration case passing | E-line in `## Log` | verified |
| O22 | S3 | The consent read honours the injected reader, so config and consent resolve through one seam | P9 | P9 | `src/hooks/dispatcher.ts` | `bun test packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` exits 0 with the injected-reader consent case passing | E-line in `## Log` | verified |
| O23 | S6 · S10 | The docs state the corrected contracts: spawn failure is a block, cap truncates without changing the verdict, enabled-without-consent announces once, the interception residual is named, and `<agentDir>` resolves | P9 | P9 | `README.md` · `docs/workflow/SEAM_HOOKS.md` · `skills/init-workspace/SKILL.md` · `.changeset/413-pi-seam-hooks.md` | `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/skill-lint.mjs` reports 0 findings | E-line in `## Log` | verified |
| O24 | S10 | The receipts reproduce: the unit doc's run counts are the observed ones, and the generated projection's 413 row carries the unit's title rather than template prose | P9 | P9 | `SPEC.md` · `docs/generated/units.md` | `bun scripts/docs-generate.mjs --check` exits 0 with the 413 row reading `fix/413-pi-seam-hooks` | E-line in `## Log` | verified |
| O25 | S1 · S10 | Every finding of the 2026-11-08 external receipt is dispositioned — fixed with its validator, or recorded as not-a-defect with the gate that proves it | P9 | P9 | `SPEC.md` `## Findings` | `sed -n '/^## Findings/,/^## Log/p' docs/fix/413-pi-seam-hooks/SPEC.md` matches 12 finding rows, none classed `fix-now` while open | E-line in `## Log` | verified |
| O26 | DA1 · S6 | The announce latch is per project session: a NEW session (`session_start`) re-announces a broken-config or inert-notice that the previous session already heard, while the seams within one session stay latched | P11 | P11 | `src/extension/hooks-wiring.ts` | `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` exits 0 with the `O25 (DA1)` re-announce case passing | E-line in `## Log` | verified |
| O27 | DA2 · S6 | Git's value-less-legal options are absent from `GIT_VALUE_OPTIONS`: a bare option consumes nothing, and no option in the set can swallow a subcommand that git would otherwise run | P11 | P11 | `src/extension/hooks-wiring.ts` | `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` exits 0 with the `O26 (DA2)` exec-path case passing (`--exec-path=<p> commit` fires, both bare forms quiet) | E-line in `## Log` | verified |
| O28 | S4 | The shutdown seam reports before the process exits and stays inside its budget: the entry returns the handler's promise (pi awaits it before teardown) and every hook at `session:end` is capped at `SHUTDOWN_BUDGET_MS`, so a slow check is a timeout block, never a silent loss and never a held quit | P11 | P11 | `src/extension/index.ts` · `src/extension/hooks-wiring.ts` · `src/hooks/dispatcher.ts` | `bun test packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` and `test/alias-coverage.test.mjs` exit 0 with the bounded-shutdown and returned-promise cases passing | E-line in `## Log` | verified |

Evidence map (2026-11-08, the P9 batch re-ran every row of this batch in the
foreground and recorded it as `P9-V` in the unit doc): O15, O16, O17, O18, O19,
O20, O21, O22 → the four hooks suites at this head (606/0 in the package, 39/0
under `node --test` on the touched three), each named case passing; O23 → the
prose lands in `README.md`, `docs/workflow/SEAM_HOOKS.md`,
`skills/init-workspace/SKILL.md` and the changeset, with `skill-lint` and
`docs-generate --check` green; O24 → `docs-generate --check` exit 0 with the 413
row reading `fix/413-pi-seam-hooks`; O25 → `## Findings` carries 12 rows, F1–F11
folded and F12 `not-a-defect` on `roadmap-settle`'s own word.

Evidence map for the P11 batch (2026-11-08, rows closed in the same
foreground session, recorded as `P11-V` in the unit doc): O26 → the `O25 (DA1)`
case in `test/hooks-wiring.test.mjs` (a second `onSessionStart` re-announces,
the same-session seam run stays latched), suite 14/0 under bun and `node
--test`; O27 → the `O26 (DA2)` case (`git --exec-path=<p> commit` fires, `git
--exec-path` and `git --exec-path <p> commit` stay quiet), same suite — resting
on PE-013's git probe (the value-less form exits before any subcommand). Red
run: `10555db8` · 12 pass / 2 fail; green: `5c8e3f98` · 14/0, package 608/0.
O28 → the wiring and entry suites at this head, 608/0 in the package and 56/0
under `node --test` on the four touched suites, the bounded-shutdown and
returned-promise cases passing (red `d7952e27` · 606/2; green `e135927c`).

Evidence map for the P9 batch (2026-11-08, re-ran every row in the foreground
and recorded it as `P9-V` in the unit doc): O15, O16, O17, O18, O19,
O20, O21, O22 → the four hooks suites at this head (606/0 in the package, 39/0
under `node --test` on the touched three), each named case passing; O23 → the
prose lands in `README.md`, `docs/workflow/SEAM_HOOKS.md`,
`skills/init-workspace/SKILL.md` and the changeset, with `skill-lint` and
`docs-generate --check` green; O24 → `docs-generate --check` exit 0 with the 413
row reading `fix/413-pi-seam-hooks`; O25 → `## Findings` carries 12 rows, F1–F11
folded and F12 `not-a-defect` on `roadmap-settle`'s own word.

Evidence map for the P11 batch (2026-11-08, both rows closed in the same
foreground session, recorded as `P11-V` in the unit doc): O26 → the `O25 (DA1)`
case in `test/hooks-wiring.test.mjs` (a second `onSessionStart` re-announces,
the same-session seam run stays latched), suite 14/0 under bun and `node
--test`; O27 → the `O26 (DA2)` case (`git --exec-path=<p> commit` fires, `git
--exec-path` and `git --exec-path <p> commit` stay quiet), same suite — resting
on PE-013's git probe (the value-less form exits before any subcommand). Red
run: `10555db8` · 12 pass / 2 fail; green: `5c8e3f98` · 14/0, package 608/0.

Evidence map for the first batch (2026-11-08, all rows closed in the same
foreground session): O1,
O2, O3, O4, O5, O6, O7, O8, O9, O10, O11, O12, O13 → SPEC `## Log` **E3** (the
per-suite runs and the O13 zero-match count); O12 additionally rests on the S8
sandbox case inside the dispatcher suite; O14 → **G1**, **E2**, **E4** and
**G2** (root gate, package suite differential, doc/projection/lint checks, and
the version-parity step's red→green). No row is `planned`, `in-progress`,
blank or `deferred`; no validator was skipped.
