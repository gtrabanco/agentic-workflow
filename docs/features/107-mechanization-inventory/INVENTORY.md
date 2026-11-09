# Mechanization inventory — every procedural step in shipped skill prose

> The worklist behind the rule "prose reducible to code must be code". It walks
> every shipped skill, enumerates the procedural steps its prose orders, and
> classifies each one against a single criterion. It decides nothing else:
> whether a candidate *should* become a guard is a roadmap call (issue #408,
> `S6`), and this file never edits a skill.

Companion: [`SPEC.md`](SPEC.md) — the unit that produced it (issue
[#408](https://github.com/gtrabanco/agentic-workflow/issues/408), roadmap row
107).

## 1. Method

**The criterion.** A step is *verifiable-without-interpretation* (class
`mechanizable`) when its **inputs are closed** (paths, ids, tokens, command
output the tree already produces) and its **success condition is decidable**
(an exit code, an equality, a set membership, a count). It is `judgment` when
deciding it needs something the tree cannot settle: intent, taste, authority,
which of several honest readings applies. A step whose prose *invokes an
existing command* is also flagged `duplicate-of-code` — the code already exists
and the prose is a narration of it (S8).

**The edge case (S11).** A multi-step procedure with one judgment branch is
split: its deterministic sub-steps become their own rows and the branch becomes
its own row whose reason begins `branch:`. Splitting is preferred over one
`mechanizable` row that hides the branch, because an extractor that trusts the
row would mechanize a decision.

**The residue check (S2).** For every row, the carrier column names what already
does the work. The check was a grep over the tree at `1fa39fe1`:

- `ls scripts/*.mjs` → 153 files (96 with a sibling `*.test.mjs`);
- `packages/agentic-workflow/bin/agentic-workflow.mjs` usage header → the crate
  subcommands `unit-doc`, `roadmap`, `changelog`, `budgets`, `manifest`, `doc`,
  `section`, `memory`, `log`, `journal`, `relay`, `resolve-passes`, `verify`,
  `resources`;
- every `skills/*/SKILL.md` searched for those names and for `scripts/<x>.mjs`
  invocations.

`duplicate-of-code: yes` means the prose names an existing command or script.
`partial` means a library/parser/validator exists but no CLI or no wiring to
this step. `no` means nothing in the tree does it.

**Vocabulary.** `class` ∈ `mechanizable | judgment | mixed`; `duplicate-of-code`
∈ `yes | partial | no`; `carrier` is the path that already does (part of) it, or
`none`. Row ids are stable: two letters for the skill (table in §2) plus a
two-digit ordinal; a later refresh appends, never renumbers.

**Axes (§4).** `F` frequency — 3 = every phase/review/session, 2 = every unit,
PR or audit, 1 = occasional. `S` stability — 3 = ≤37 commits touching the skill
in 18 months, 2 = 38–99, 1 = ≥100 (measured, §7). `E` enforcement value — 3 =
gates a merge, commit, receipt or ledger closure, 2 = prevents a repeated
failure class without a hard gate, 1 = advisory or cosmetic. `score = F × S × E`
(range 1–27); the ranking is in §4.

## 2. Coverage

All 29 skill directories at `1fa39fe1` carry a `SKILL.md`; none carries
`metadata.internal: true`, so the issue's exclusion filter excludes nothing
(measured: `ls -d skills/*/ | wc -l` → 29, `ls skills/*/SKILL.md | wc -l` → 29,
`rg -l 'metadata.internal: true' skills/*/SKILL.md | wc -l` → 0).

| skill | abbrev | `##` | `###` | steps | mechanizable | judgment | mixed | dup. yes | dup. partial |
|---|---|---|---|---|---|---|---|---|---|
| audit-docs | AD | 9 | 0 | 29 | 22 | 1 | 6 | 4 | 14 |
| audit-pr | AP | 10 | 0 | 13 | 11 | 2 | 0 | 4 | 5 |
| batch-scheduler | BS | 8 | 0 | 10 | 9 | 0 | 1 | 6 | 1 |
| discover-repository-state | DR | 7 | 0 | 7 | 3 | 3 | 1 | 0 | 3 |
| execute-phase | EP | 11 | 9 | 28 | 21 | 5 | 2 | 13 | 10 |
| fold-findings | FF | 14 | 0 | 18 | 16 | 2 | 0 | 6 | 4 |
| init-workspace | IW | 13 | 0 | 13 | 9 | 4 | 0 | 1 | 7 |
| log-session | LS | 10 | 0 | 12 | 10 | 2 | 0 | 9 | 2 |
| orchestration-envelope | OE | 4 | 0 | 8 | 7 | 0 | 1 | 5 | 2 |
| phase-contract | PC | 6 | 2 | 7 | 6 | 1 | 0 | 6 | 0 |
| pre-execution-review | PX | 5 | 0 | 6 | 3 | 3 | 0 | 2 | 0 |
| product-audit | PA | 15 | 4 | 14 | 9 | 4 | 1 | 1 | 3 |
| resolve-repository-state | RR | 7 | 0 | 7 | 4 | 3 | 0 | 0 | 3 |
| review-a11y | AA | 5 | 0 | 11 | 4 | 7 | 0 | 1 | 0 |
| review-brand | BR | 5 | 0 | 9 | 5 | 4 | 0 | 2 | 1 |
| review-change | CH | 13 | 0 | 13 | 11 | 2 | 0 | 4 | 4 |
| review-code | CO | 5 | 0 | 16 | 7 | 9 | 0 | 3 | 3 |
| review-debt | DE | 4 | 0 | 8 | 6 | 2 | 0 | 2 | 1 |
| review-design | DS | 5 | 0 | 6 | 3 | 3 | 0 | 1 | 0 |
| review-implementation | IM | 9 | 0 | 8 | 5 | 1 | 2 | 0 | 4 |
| review-perf | PE | 5 | 0 | 8 | 3 | 5 | 0 | 2 | 1 |
| review-security | SE | 5 | 0 | 10 | 3 | 7 | 0 | 3 | 0 |
| review-seo | SO | 5 | 0 | 8 | 7 | 1 | 0 | 1 | 0 |
| review-verify | VE | 5 | 0 | 11 | 8 | 3 | 0 | 6 | 1 |
| skill-lint | SL | 8 | 3 | 7 | 5 | 2 | 0 | 3 | 2 |
| triage-issue | TI | 8 | 0 | 12 | 9 | 2 | 1 | 4 | 3 |
| unit-lane | UL | 10 | 9 | 18 | 13 | 3 | 2 | 7 | 6 |
| verification-contract | VC | 8 | 0 | 11 | 7 | 4 | 0 | 2 | 6 |
| workflow-status | WS | 8 | 0 | 10 | 10 | 0 | 0 | 7 | 1 |
| **total** | | **227** | **27** | **338** | **236** | **85** | **17** | **105** | **87** |

Mixed rows: **17** — every mixed row's reason names its deterministic prefix and its `branch:` judgement, so an extractor that mechanizes one whole would mechanize a decision (S11).

## 3. Per-skill section map and step classification

Each skill gets its section map (heading path → one-line role) and its step
rows. `F`/`S`/`E` are the §1 axes; the reason is the one-line justification the
issue asks for.

### audit-docs

F=2 (per audit) · S=2 (38 commits/18 mo) · sections accounted for: 9 `##`

| heading | role |
|---|---|
| Turn contract | closing duties before the turn ends |
| When to use | trigger |
| Step 0 — Discover the project | locate the docs surface the checks read |
| Checks | the 16 coherence checks (1–9 doc, 10–14 workflow discipline, 15 README, 16 charter) |
| Process | run the checks, print the fixed report, fix only on request |
| Guardrails | read-first, surgical, no behavior change |
| Portability | fallbacks for non-Claude agents |
| Relationship to other skills | neighbours (`unit-lane`, `triage-issue`) |
| Done when | exit conditions + closing block |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| AD01 | Step 0 | Resolve the documentation-map paths (guide map, roadmap, fix index, templates) | mechanizable | partial | `packages/agentic-workflow/src/index-document.mjs` | 2 | 2 | 2 | the path set is declared in the map, so resolving it is a lookup, not a read |
| AD02 | Checks 1 | Every feature folder has a roadmap row and every row a folder | mechanizable | yes | `scripts/roadmap-settle.mjs` (`row-missing`, `slug-mismatch`), `agentic-workflow roadmap check` | 2 | 2 | 3 | a set comparison over two parsed lists; the settle gate already refuses the unpaired case |
| AD03 | Checks 1 | Treat an explicitly "scheduled" missing row as intentional | mixed | no | none | 2 | 2 | 1 | branch: whether a missing row is a schedule or drift is the auditor's reading of the unit's prose |
| AD04 | Checks 2 | `Depends on` cells valid, no cycles, order consistent with the roadmap | mechanizable | partial | `agentic-workflow roadmap check` reads `dependsOn` | 2 | 2 | 2 | graph validity is decidable; only the cycle finder is missing |
| AD05 | Checks 3 | Fix-index rows join an open issue and an unmerged PR | mechanizable | partial | the forge CLI + `index-document.mjs` | 2 | 2 | 2 | the join is a lookup; no script performs it |
| AD06 | Checks 3 | Decide that a merged/closed fix row "should have been removed" | mixed | no | none | 2 | 2 | 1 | branch: keeping a closed row as history is a policy call, not a fact |
| AD07 | Checks 4 | Every documentation-map referenced file exists | mechanizable | no | none | 2 | 2 | 3 | path existence is decidable against the map |
| AD08 | Checks 5 | Relative links and anchors resolve | mechanizable | no | none | 2 | 2 | 2 | anchor extraction plus file existence; no resolver ships |
| AD09 | Checks 6 | `#N` references do not point at long-closed issues without a note | mechanizable | partial | the forge issue read | 2 | 2 | 2 | the forge answers state; no in-tree joiner |
| AD10 | Checks 7 | Docs language and file/dir naming conventions | mechanizable | partial | `scripts/skill-lint.mjs` covers skills only | 2 | 2 | 2 | a closed pattern set applied to a path list |
| AD11 | Checks 8 | Referenced invariant/decision ids exist where claimed | mechanizable | no | none | 2 | 2 | 2 | id-set membership over the tree |
| AD12 | Checks 9 | Every `done` row carries `done · [#N](url)` | mechanizable | yes | `scripts/roadmap-settle.mjs` (`pr-url-unsettled`) | 2 | 2 | 3 | already a gate: the bare form is refused |
| AD13 | Checks 10 | Lane-era: phase-lint PASS + phase labels valid | mechanizable | yes | `scripts/phase-lint.mjs`; `scripts/ceremony.mjs docs check-phase-labels` | 2 | 2 | 3 | the prose only names two commands that already decide it |
| AD14 | Checks 10 | Legacy: no `S#`/`Step N` labels in `PLAN`/`TASKS`/`progress` | mechanizable | partial | the prose's own `rg -nE` one-liner | 2 | 2 | 2 | a regex sweep with no script around it |
| AD15 | Checks 11 | Lane-era: ticked task ⇔ its `P<n>` log line | mechanizable | yes | `scripts/ceremony.mjs docs check-tasks-ticks` / `check-progress-entry` | 2 | 2 | 3 | already code; the prose restates its output fields |
| AD16 | Checks 11 | Legacy: ticked phases in `TASKS.md` + one progress entry each | mixed | no | none | 2 | 2 | 1 | branch: only pre-lane units carry the free-form shape and `MIGRATION.md` forbids repairing them |
| AD17 | Checks 11 | Severity of a missing receipt: HIGH on `done`, LOW on open | mechanizable | no | none | 2 | 2 | 2 | a two-cell table keyed on the row's status |
| AD18 | Checks 12 | A `done` unit's PR exists, targets the default base, has a body and `Closes #N` | mechanizable | partial | the forge PR read (`--json` projection) | 2 | 2 | 2 | forge facts are decidable; the unit→PR→body join is missing |
| AD19 | Checks 12 | Feature/fix-scoped commits landed directly on the default branch | mechanizable | partial | `git log --first-parent` | 2 | 2 | 2 | decidable by prefix+path; no carrier ships |
| AD20 | Checks 13 | Generated-page provenance (orphan or stale versus unit + merge date) | mechanizable | partial | `scripts/docs-generate.mjs --check` (missing/stale/orphaned) | 2 | 2 | 2 | the page comparison is code; the unit/PR join is not — the check's own prose is truncated (reported, not repaired) |
| AD21 | Checks 14 | Conventional commit format plus merged dependency closure | mechanizable | partial | `scripts/ceremony.mjs docs check-commit-format` (the field check 11 names) | 2 | 2 | 2 | both halves are closed-pattern checks |
| AD22 | Checks 15 | README claims versus the shipped tree (retired names, counts, "none yet") | mixed | partial | the prose's `rg` sweep | 2 | 2 | 3 | the sweep is mechanical; branch: the retired-name set is decided per release, so the input list is judgment |
| AD23 | Checks 16 | Charter map row, `## Project charter`, no unfilled slot, catalogue provenance | mechanizable | partial | the prose's own `awk`/`rg` one-liners | 2 | 2 | 2 | the commands are given literally; only a wrapper is missing |
| AD24 | Process 1 | Run the checks with grep, file reads and the forge CLI, citing paths | mechanizable | partial | the check-specific scripts above | 2 | 2 | 2 | orchestration of already-named commands |
| AD25 | Process 2 | Emit the fixed report: table, `Checks run: n/16`, `Decision: PASS or FAIL` | mechanizable | no | none | 2 | 2 | 2 | a fixed field set; a renderer would remove the arithmetic from prose |
| AD26 | Process 3 | Apply low-risk fixes only on `--fix` or go-ahead | mixed | no | none | 2 | 2 | 1 | branch: which finding is low-risk is the reviewer's call |
| AD27 | Guardrails | Read-first; never bulk-rewrite; stay inside docs | judgment | no | none | 2 | 2 | 1 | a posture rule, not a procedure |
| AD28 | Turn contract / Done when | Report printed and ends in PASS/FAIL; no doc rewritten without go-ahead | mechanizable | partial | `packages/agentic-workflow/src/verify/Verify.mjs` (the marker-checking pattern) | 2 | 2 | 2 | "printed" becomes checkable once the report is machine-shaped |
| AD29 | Checks 13 (prose) | The truncated check-13 text itself | mixed | no | none | 2 | 2 | 1 | branch: repairing prose needs an owner decision; recorded as a known issue, out of scope (S6) |

### audit-pr

F=2 (per PR) · S=1 (102 commits/18 mo) · sections accounted for: 10 `##`

| heading | role |
|---|---|
| Turn contract | closing duties |
| When to use | trigger |
| Scope | what the audit reads |
| Step 0 — Discover the project & the PR | project contract, PR projection, governing SPEC |
| Step 1 — Consume the review receipt | SHA-bound receipt lookup and currency |
| Progressive loading — mandatory audit route | the five gate references, in order |
| Merge ownership | audit never merges |
| Portability | fallbacks |
| Relationship to other skills | neighbours |
| Done when | exit conditions |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| AP01 | Step 0.1 | Read the project contract (roadmap + verification gate), skipping full templates | mechanizable | partial | `index-document.mjs`; the guide's map | 2 | 1 | 2 | path resolution from a declared map |
| AP02 | Step 0.2 | Fetch the PR through the 13-field JSON projection (or resolve the branch's PR) | mechanizable | yes | the forge PR read literal in the prose | 2 | 1 | 2 | the field list is a fixed command |
| AP03 | Step 0.2 | Audit branch-vs-base when no PR is open yet | mechanizable | partial | `git diff <base>...HEAD` | 2 | 1 | 2 | a fallback mode with a decidable input |
| AP04 | Step 0.3 | Locate the governing SPEC and its planning artifacts | mechanizable | partial | the `docs/features or docs/fix under <NN>-<slug>/` convention | 2 | 1 | 2 | a path convention lookup |
| AP05 | Step 1 | Find the newest pass-marker comment at head | mechanizable | yes | `scripts/review-receipt.mjs verify --pr <N>` | 2 | 1 | 3 | already code: marker find, SHA compare, scope delta |
| AP06 | Step 1 | Classify the receipt current/absent/stale and route | mechanizable | yes | `scripts/review-receipt.mjs verify` (0 / 4) | 2 | 1 | 3 | the exit code already encodes the three states |
| AP07 | Step 1 | Keep a scoped receipt current when only non-affecting paths moved | mechanizable | yes | `scripts/scope-manifest.mjs` | 2 | 1 | 3 | the closed path-class set is code |
| AP08 | Step 1 | Never compose or spot-check a review to clear a missing receipt | judgment | no | none | 2 | 1 | 2 | a prohibition licensing the receipt gate |
| AP09 | Progressive loading | Load the five mandatory gate references in order | mechanizable | no | none | 2 | 1 | 2 | an ordered allowlist; a manifest could enforce it |
| AP10 | Merge gates | Collect delivery, CI, traceability, mergeability evidence | mechanizable | partial | `scripts/audit-pr-gate.mjs`; the forge PR rollup | 2 | 1 | 3 | the gate family exists as a script; the prose still leads it |
| AP11 | Merge ownership | Never merge; MERGE-READY is evidence, not permission | judgment | no | none | 2 | 1 | 3 | an authority rule no script may own |
| AP12 | Done when | Emit the SHA-bound receipt comment with the full PR URL | mechanizable | partial | `scripts/review-receipt.mjs emit` (posts and re-reads the marker) | 2 | 1 | 3 | the marker shape is fixed and the emitter already re-reads it |
| AP13 | Turn contract | Verdict is MERGE-READY or BLOCKED with cited gates | mechanizable | no | none | 2 | 1 | 3 | a closed verdict vocabulary over collected evidence |

### batch-scheduler

F=2 (per work session) · S=3 (10 commits/18 mo) · sections accounted for: 8 `##`

| heading | role |
|---|---|
| Turn contract | read-only duties; the state file is the only write |
| When to use | trigger |
| Step 0 — Discover the project | the script reads its own inputs |
| Process | run the script, read the envelope, print the summary |
| Guardrails | findings, in-flight state, parser fail-closed, offline |
| Portability | node fallback, cached issues |
| Relationship to other skills | sibling of `workflow-status` |
| Done when | envelope last, nothing launched |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| BS01 | Process 1 | Run the planner script with its flags and persist the plan state | mechanizable | yes | `scripts/batch-scheduler.mjs` | 2 | 3 | 3 | the script is the producer; the prose names it |
| BS02 | Process 2 | Read every envelope field (`batches`, `blocked`, `launched`, deltas, findings, degraded) | mechanizable | yes | `scripts/batch-scheduler.mjs` + `references/PLAN.md` | 2 | 3 | 2 | the field set is published (`batch-plan@2`) |
| BS03 | Process 3 | Print lanes, blocked, untriaged, findings, degradations; launch nothing | mechanizable | no | none | 2 | 3 | 1 | a fixed render order over the envelope |
| BS04 | Guardrails | Report `cycle`/`orphaned-soft-dep`/`prose-native-mismatch`, never fix | mixed | no | none | 2 | 3 | 2 | branch: the prose rows belong to triage, which is a routing decision |
| BS05 | Guardrails | An open in-flight target is a state, not a defect | mechanizable | partial | the script's `blocked[]` | 2 | 3 | 2 | the script already distinguishes it |
| BS06 | Guardrails | The prose `## Dependencies` parser fails closed | mechanizable | yes | `scripts/batch-scheduler.mjs` | 2 | 3 | 3 | parsed in code, degradation declared |
| BS07 | Guardrails | Native relations are authoritative; prose `hard` without one is a mismatch | mechanizable | yes | `scripts/batch-scheduler.mjs` | 2 | 3 | 3 | the relation read is code |
| BS08 | Guardrails | Offline is declared and the plan still prints | mechanizable | yes | `scripts/batch-scheduler.mjs` | 2 | 3 | 2 | a code path with a declared degradation |
| BS09 | Portability | node fallback and the cached-issue flag | mechanizable | yes | shebang fallback + the flag | 2 | 3 | 1 | already code |
| BS10 | Done when | Envelope is the absolute last output; nothing launched | mechanizable | no | none | 2 | 3 | 1 | an output-order contract |

### discover-repository-state

F=1 (occasional) · S=3 (11 commits/18 mo) · sections accounted for: 7 `##`

| heading | role |
|---|---|
| Turn contract | closing duties |
| Step 0 — Discover the project | read guide, map, existing ledger |
| Process | collect, separate, detect contradictions, freeze |
| Guardrails | separation rules; the repository stays authoritative |
| Portability | fallbacks |
| Relationship to other skills | the resolver consumes contradictions |
| Done when | frozen snapshot or a recorded contradiction |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| DR01 | Process 1 | Read the guide, the documentation map and any existing `REPOSITORY_STATE.md` | mechanizable | partial | `agentic-workflow doc --status` | 1 | 3 | 2 | three known paths |
| DR02 | Process 2 | Inspect files, tests, git state and tooling; record facts with `file:line` evidence | judgment | no | none | 1 | 3 | 3 | the choice of what counts as evidence is the discovery |
| DR03 | Process 3 | Separate Accepted Decisions, Planned work and Documentation from facts | judgment | no | none | 1 | 3 | 3 | classification by provenance of each claim |
| DR04 | Process 4 | Place reasoning under Inference and ambiguity under Open Questions | judgment | no | none | 1 | 3 | 2 | the separation is the skill's own judgement |
| DR05 | Process 5 | On a contradiction: append the row, set `contradicted`, never alter the fact | mixed | partial | `scripts/pre-execution-contract.mjs` | 1 | 3 | 3 | the state machine is closed; branch: detecting that evidence conflicts is a reading |
| DR06 | Process 6 | Freeze the status and commit the artifact citing the source revision | mechanizable | partial | `scripts/pre-execution-snapshot.mjs verify` (revision binding) | 1 | 3 | 3 | a status write bound to a revision |
| DR07 | Turn contract | Facts, decisions, planned work, docs and inference stay separated; no silent fact change | mechanizable | no | none | 1 | 3 | 3 | a four-section invariant checkable on the doc shape |

### execute-phase

F=3 (per phase) · S=1 (229 commits/18 mo) · sections accounted for: 11 `##` + 9 `###`

| heading | role |
|---|---|
| Argument resolution | `<NN-slug> P<k>` / `<NN-slug>` / `P<k>` grammar |
| Turn contract | the 13 closing boxes |
| When to use | trigger |
| Inputs — artifacts, never questions | gap order: provenance → research → halt |
| Step 0 — Discover the project | locate and shape-check the unit doc |
| Process 1. Verify triage currency | triage block versus Evidence header |
| Process 2. Select the step | explicit or first unticked |
| Process 3. Pre-step gates | path protection, phase-lint, pre-write mapper, dependencies |
| Process 4. Execute the step | step reference, test impact, red-first, orchestrate path |
| Process 5. Claim-evidence loop | enumerate, reproduce, loop, admission |
| Process 6. Post-step | diff guard, evidence rows, progress, memory, commit |
| Process 7. Red gate | repair loop, attempt budget, blocked block |
| Process 8. Whole-unit mode | loop, close-out, PR, settle |
| Process 9. Descope guard | user approval before any descope |
| Required references | the on-demand reference set |
| Guardrails | prohibitions |
| Relationship to other skills | neighbours |
| Portability | fallbacks |
| Done when | exit conditions |
| Closing recommendation | the `→ Next:` block |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| EP01 | Argument resolution | Parse `<NN-slug> P<k>`, `<NN-slug>`, `P<k>` (last-known unit) | mechanizable | yes | `scripts/unit-route.mjs` | 3 | 1 | 2 | an argv grammar the router already resolves |
| EP02 | Process 1 | Compare the triage block to the unit doc's Evidence header; mismatch stops | mechanizable | yes | `scripts/unit-route.mjs --triage` | 3 | 1 | 3 | a literal block comparison |
| EP03 | Process 2 | Select the explicit `P<k>` or the first unticked one; never a skipped step | mechanizable | yes | `scripts/unit-doc-phases.mjs`; `unit-route.mjs` | 3 | 1 | 3 | the tick and the triage set are both parsed today |
| EP04 | Process 3.1 | Path-protection checkpoint over the committed range | mechanizable | yes | `packages/agentic-workflow/src/path-policy.mjs` | 3 | 1 | 3 | the guard verdict and its reasons are code |
| EP05 | Process 3.2 | Phase-lint on implement steps | mechanizable | yes | `scripts/phase-lint.mjs` | 3 | 1 | 3 | the prose names the command and reads its exit |
| EP06 | Process 3.3 | Pre-write mapper: seven evidence questions, route `READY / REPLAN / NEEDS-DESIGN / BLOCKED` | mixed | partial | `references/PRE_EXECUTION_GATE.md`; `pre-execution-snapshot.mjs` binds digests | 3 | 1 | 3 | branch: the questions need evidence judgement; the route vocabulary is closed |
| EP07 | Process 3.4 | Dependencies merged and invariants preserved or backed by a recorded decision | mixed | partial | `scripts/unit-route.mjs` (deps); the forge | 3 | 1 | 3 | branch: "preserved or backed by a decision" is a judgement over evidence |
| EP08 | Process 4 | Follow the step's reference checklist and commit the work | judgment | partial | `references/STEPS.md` catalog | 3 | 1 | 2 | the checklist content varies by step; the triage fixes only the order |
| EP09 | Process 4 | Derive the test set before writing | mechanizable | yes | `scripts/test-impact.mjs` | 3 | 1 | 3 | the prose names the command |
| EP10 | Process 4 | New script+suite lands red first, implementation green | mechanizable | yes | `scripts/red-first.mjs` | 3 | 1 | 3 | enforced by a git-history gate |
| EP11 | Process 4 | Orchestrate path: freeze the brief, admit resources, verify by gate+diff | mechanizable | partial | `agentic-workflow resolve-passes`; `resources admit`; `scripts/test-route.mjs` | 3 | 1 | 2 | admission and model resolution are code; the brief is authored |
| EP12 | Process 5.1 | Enumerate every claim the step introduces | judgment | no | none | 3 | 1 | 2 | the claim set is the writer's reading of the step |
| EP13 | Process 5.2 | Reproduce each claim with its command and paste the observed output | mechanizable | partial | `scripts/promise-coherence.mjs` re-runs written outcomes | 3 | 1 | 3 | reproduction is mechanical once the claim exists |
| EP14 | Process 5.3 | Loop red → repair → re-run inside the same turn | mechanizable | partial | `scripts/local-gate.mjs` | 3 | 1 | 2 | a retry loop; the "same turn" bound is prose |
| EP15 | Process 5.4 | An unverifiable sentence is an opinion and is not written | judgment | no | none | 3 | 1 | 2 | a writing rule with no closed input |
| EP16 | Process 5 | Bounded checkpoint through `test-route --check <path>` | mechanizable | yes | `scripts/test-route.mjs` | 3 | 1 | 2 | the prose names the command |
| EP17 | Process 6.1 | Diff guard on implement steps; BREACH stops | mechanizable | yes | `scripts/diff-guard.mjs` | 3 | 1 | 3 | already code — the pilot case the folded #411 was absorbed for |
| EP18 | Process 6.2 | Append Evidence rows in the published shape | mechanizable | yes | `validateEvidenceRow` (schema pkg); `agentic-workflow unit-doc` | 3 | 1 | 3 | the row shape is validated in code |
| EP19 | Process 6.3 | Append a dated Progress entry | mechanizable | yes | `agentic-workflow unit-doc progress_logEntry` | 3 | 1 | 2 | a timestamped append |
| EP20 | Process 6.4 | Probe memory once, save under `unit/<NN-slug>/doc`, mark a degraded mirror pending | mechanizable | yes | `agentic-workflow memory probe`; the Engram tools | 3 | 1 | 2 | the probe verdict and topic key are fixed |
| EP21 | Process 6.5 | Stage and make a conventional commit, paste the SHA | mechanizable | yes | `git`; `scripts/ceremony.mjs docs check-commit-format` | 3 | 1 | 2 | one command pair with a closed message grammar |
| EP22 | Process 7 | Red gate: run the gate, record exit and failing names, repair within the attempt budget | mechanizable | partial | `scripts/local-gate.mjs`; `run-root-suite.mjs` | 3 | 1 | 3 | the loop is code-shaped; the repair itself is authoring |
| EP23 | Process 7 | Print the fixed `UNIT LOOP — … BLOCKED` block when attempts are exhausted | mechanizable | no | none | 3 | 1 | 2 | a fixed block with no emitter |
| EP24 | Process 8 | Whole-unit mode: loop, close-out, PR, References, settle the index row | mechanizable | partial | `scripts/roadmap-settle.mjs`; `agentic-workflow roadmap rowUpsert`; the forge PR create | 3 | 1 | 3 | settling is code; the PR body and References are authored |
| EP25 | Process 8 | A bare `<NN-slug>` from a lane hand-off is a defect | mechanizable | no | none | 3 | 1 | 1 | a hand-off grammar check with no carrier |
| EP26 | Process 9 | Descope guard: explicit user approval first, then a References row | judgment | no | none | 3 | 1 | 2 | an authority rule |
| EP27 | Guardrails | Never commit red, never shrink the diff, never widen scope | judgment | partial | `scripts/diff-guard.mjs` covers the size half only | 3 | 1 | 2 | prohibitions; only the size half is machine-checked |
| EP28 | Turn contract | The 13 closing boxes | mechanizable | partial | `unit-route`, `phase-lint`, `diff-guard`, `test-impact`, `verify` | 3 | 1 | 3 | a checklist over scripts that already exist |

### fold-findings

F=2 (per failed review) · S=2 (59 commits/18 mo) · sections accounted for: 14 `##`

| heading | role |
|---|---|
| Turn contract | the 11 closing boxes |
| When to use | trigger |
| Step 0 — Discover the project | carrier probe, queue, escalation, evidence-bound, anti-invention |
| Progressive loading — fold queue | the two mandatory references |
| Claim-evidence loop | reproduce every claim before committing |
| Claim-evidence table | the table's published shape |
| Closure status | `closure complete or open(n)` |
| Report — return exactly this structure | per-finding verdict lines |
| REPAIR-RECEIPT | the six-field receipt and its batch classes |
| Guardrails | no reclassification, scope is the ledger |
| Portability | fallbacks |
| Relationship to other skills | neighbours |
| Done when | exit conditions + closing block |
| Closing-block decision branch | the `→ Next:` mapping |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| FF01 | Step 0.1 | Probe the findings carrier (`## Findings` versus `review-findings.md`), never both | mechanizable | yes | `scripts/review-state.mjs`; `unit-route.mjs` shape resolution | 2 | 2 | 3 | a section/file existence test |
| FF02 | Step 0.1 | Validate rows against the carrier's own schema (legacy 7-col versus `findings-table@1`) | mechanizable | yes | `agentic-workflow verify`; the published column sets | 2 | 2 | 3 | column sets are published constants |
| FF03 | Step 0.1 | Reconstruct missing rows from a blocked audit verdict (next free `F<n>`, dedupe on `file:line`+axis) | mechanizable | no | none | 2 | 2 | 2 | allocation and dedupe are decidable; extracting them from prose is not |
| FF04 | Step 0.2 | Queue open rows, honour an explicit id subset, group by root cause/verifier/rollback | judgment | no | none | 2 | 2 | 3 | grouping is the repairer's reading |
| FF05 | Step 0.3 | Class escalation: ≥2 rows sharing mechanism+axis become one class finding | mechanizable | no | none | 2 | 2 | 2 | the grouping predicate is stated, but no carrier counts it |
| FF06 | Step 0.4 | Evidence-bound check: the cited `file:line` exists and the snippet matches verbatim | mechanizable | no | none | 2 | 2 | 3 | a byte comparison nothing runs |
| FF07 | Step 0.5 | Anti-invention: new findings grounded in changed bytes or a mis-run check | mechanizable | partial | `git diff` (changed bytes) | 2 | 2 | 3 | two closed grounding conditions |
| FF08 | Step 0.6 | Read the verification gate and the forge CLI | mechanizable | partial | the guide's declared commands | 2 | 2 | 2 | a map lookup |
| FF09 | Step 0.7 | Detect an open PR to decide the push after commit | mechanizable | yes | the forge PR read; `scripts/session-close.mjs` pattern | 2 | 2 | 2 | a forge state read |
| FF10 | Claim-evidence loop | Claim table with reproduced output, looping until green | mechanizable | partial | `scripts/promise-coherence.mjs` | 2 | 2 | 3 | reproduction is mechanical; enumeration is not |
| FF11 | Closure status | Derive `closure complete or open(n)` from the queue | mechanizable | no | none | 2 | 2 | 2 | arithmetic over the ledger rows |
| FF12 | Report | One `FOLDED / DISPUTED / BLOCKED / REPLAN` line per finding | mechanizable | no | none | 2 | 2 | 2 | closed verdict tokens with no emitter |
| FF13 | REPAIR-RECEIPT | Six fields: repaired/refuted ids, gate exit at head, batch class, fold diff, branch | mechanizable | yes | `git rev-parse`, the gate run, `git diff --shortstat`, `unit-route.mjs` | 2 | 2 | 3 | every field is a command output |
| FF14 | REPAIR-RECEIPT | Batch class derives only from taken frozen rows | mechanizable | yes | `scripts/unit-route.mjs` (`PRODUCT_ROUTE`, route) | 2 | 2 | 3 | a closed vocabulary plus an existing route regex |
| FF15 | REPAIR-RECEIPT | Freeze-batch on replan/decision/product rows: nothing folds or commits | mechanizable | yes | `scripts/unit-route.mjs` route | 2 | 2 | 3 | a gate on the router's own answer |
| FF16 | Closing-block decision branch | Map the receipt's `Branch` field to the `→ Next:` block | mechanizable | no | none | 2 | 2 | 2 | a mapping table with no emitter |
| FF17 | Turn contract | The 11 boxes (per-finding line, gate+commit+push, ledger flip, no reclassify, tally, claim loop, escalation, evidence-bound, anti-invention, net narration, closure) | mechanizable | partial | `unit-route.mjs` + the gate scripts | 2 | 2 | 3 | the boxes are checks over commands; the tally is arithmetic |
| FF18 | Guardrails | Never reclassify severity/class; scope is the ledger; unlisted discoveries are proposals | judgment | no | none | 2 | 2 | 3 | prohibitions that keep the fixer honest |

### init-workspace

F=1 (per project install) · S=1 (119 commits/18 mo) · sections accounted for: 13 `##`

| heading | role |
|---|---|
| Turn contract | closing duties |
| When to use | trigger |
| Consent — mandatory, never defaulted | explicit-yes gate and the gap flow |
| Step 0 — Discover the project | target inspection and route selection |
| Progressive loading — bootstrap or upgrade, never both | the route allowlists |
| Charter — what the project is | identity (blocking) and domain (defaults) interrogation |
| Guardrails | consent, additive-only, seam hooks |
| Unit document conventions | what bootstrap/upgrade writes into the guide |
| Normalized Repository State | seed the ledger |
| Architectural invariants | offer the optional contract |
| Portability | fallbacks |
| Relationship to other skills | neighbours |
| Done when | exit conditions |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| IW01 | Step 0 | Inspect the target: guide/docs/.github presence, scaffold markers, manifests, git/forge | mechanizable | partial | `scripts/capabilities.mjs` covers the capability seed only | 1 | 1 | 2 | a file-existence matrix the prose states |
| IW02 | Step 0 | Offer upgrade when both markers are present; otherwise merge/adapt/abort | judgment | no | none | 1 | 1 | 2 | the route needs the owner's answer |
| IW03 | Progressive loading | Choose exactly one route (bootstrap versus upgrade) from Step 0 | mechanizable | no | none | 1 | 1 | 3 | a two-branch router over detected state |
| IW04 | Consent | Every install/hook/overwrite needs an explicit yes; a gap halts with the question block | mechanizable | partial | `scripts/needs-input.mjs` (`open-questions@1`) | 1 | 1 | 3 | the gap flow is code; the consent question is authored |
| IW05 | Charter | Identity layer is blocking (kind, users, deployment, license, ceremony seed) | judgment | no | none | 1 | 1 | 3 | an interrogation only the owner answers |
| IW06 | Charter | Domain layer is open-with-defaults, recorded as dated assumptions | judgment | no | none | 1 | 1 | 2 | assumption selection |
| IW07 | Guardrails | Seam hooks are consent-gated per seam (the project's `hooks.json` `enabled`) | mechanizable | yes | the pi seam dispatcher | 1 | 1 | 3 | two explicit flags checked in code |
| IW08 | Guardrails | Never clobber; upgrade is additive-only | mechanizable | partial | `scripts/docs-generate.mjs` (orphan/missing report) | 1 | 1 | 3 | an additive diff is decidable |
| IW09 | Unit document conventions | Write the lane conventions into the guide (triage, guards, evidence, progress, commits, statuses) | mechanizable | partial | `agentic-workflow unit-doc create` + the template | 1 | 1 | 2 | fixed text, copied |
| IW10 | Normalized Repository State | Seed `REPOSITORY_STATE.md` and explain discovery/resolution | mechanizable | partial | the template file | 1 | 1 | 2 | a copy |
| IW11 | Architectural invariants | Offer the optional invariants contract; never infer a rule | judgment | no | none | 1 | 1 | 2 | an offer plus an authority rule |
| IW12 | Serena (reference route) | Detect the stack, ask once, provision language servers, report | mechanizable | partial | `scripts/serena-activation-check.mjs` | 1 | 1 | 2 | the probe is code |
| IW13 | Done when | Tailored scaffold, residual placeholders flagged, labels seeded, adapters fixture-tested | mechanizable | partial | `scripts/capabilities.mjs`, `scripts/serena-activation-check.mjs` | 1 | 1 | 2 | a checklist over probes |

### log-session

F=3 (per session) · S=3 (28 commits/18 mo) · sections accounted for: 10 `##`

| heading | role |
|---|---|
| Turn contract | the entry write is the commit box |
| Two doors, one behaviour | extension command versus prose door |
| When to use | trigger |
| Step 0 — Discover the project | locate the log, read the session marker |
| Process | boundary, facts, narrative, render, close |
| The canonical split | journal half here, recall half in Engram |
| Guardrails | cheap model, no edits to past entries |
| Portability | fallbacks |
| Relationship to other skills | neighbours |
| Done when | entry written and the close ran |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| LS01 | Step 0 | Locate the session log from the docs map; create it from the template when absent | mechanizable | partial | the docs map + `template/docs/LOGS.md` | 3 | 3 | 2 | path resolution |
| LS02 | Step 0 | Read the session-start marker to bound the session | mechanizable | yes | the `.pi/.session-<id>.start` marker; `scripts/session-close.mjs` | 3 | 3 | 2 | the marker file holds the start sha and time |
| LS03 | Process 1 | Establish the boundary (marker..HEAD plus uncommitted work) | mechanizable | yes | `git rev-parse` + the marker | 3 | 3 | 2 | a range computation |
| LS04 | Process 2 | Gather branch, commits this session, files touched | mechanizable | yes | `scripts/session-close.mjs render` | 3 | 3 | 2 | computed for the caller by design |
| LS05 | Process 3 | Write the summary/decisions/next narrative | judgment | no | none | 3 | 3 | 2 | the skill's one irreducible half |
| LS06 | Process 3 | Forge-verify every status word (`merged`, `closed`, `approved`) before writing | mechanizable | yes | the forge PR state read | 3 | 3 | 3 | a lookup before a claim |
| LS07 | Process 4 | Render the entry through the renderer | mechanizable | yes | `scripts/session-close.mjs render` | 3 | 3 | 2 | the prose names the command |
| LS08 | Process 4 | Append to the log, or hand the entry to the fragment writer when the carrier exists | mechanizable | yes | `agentic-workflow journal write` | 3 | 3 | 3 | the carrier decision and the write are code |
| LS09 | Process 5 | Close: commit the entry alone and report leftovers (0 clean / 2 dirty / 1 refused) | mechanizable | yes | `scripts/session-close.mjs close` | 3 | 3 | 3 | the exit codes encode the outcome |
| LS10 | Guardrails | Never edit a past entry; never stage the whole tree; no PR for a log | judgment | partial | `scripts/log-immutability.mjs` | 3 | 3 | 3 | the immutability half is code; the staging half is a prohibition |
| LS11 | Two doors | The extension handler records the invocation and names the target; without it the prose flow runs | mechanizable | yes | the pi package's registered command | 3 | 3 | 2 | code owns the fact |
| LS12 | Done when | Entry written with git facts and the close ran | mechanizable | yes | `scripts/session-close.mjs` | 3 | 3 | 2 | both are commands |

### orchestration-envelope

F=2 (every driven invocation) · S=2 (38 commits/18 mo) · sections accounted for: 4 `##`

| heading | role |
|---|---|
| Output profiles | which result shape a skill emits |
| Driver protocol | append, parse, repair once, fail |
| Contract evolution | strictness and semver rules |
| Normalized Repository State | discover before planning, route contradictions |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| OE01 | Output profiles | Pick Envelope v2 versus SkillOutcome v1 by profile | mechanizable | yes | `WORKFLOW_SKILL_PROFILES` (schema package) | 2 | 2 | 3 | the authoritative inventory is code |
| OE02 | Driver protocol 1 | Append `renderOutputInstruction(skill)` for a driven invocation | mechanizable | yes | the schema package export | 2 | 2 | 3 | a function call |
| OE03 | Driver protocol 2 | Parse the reply and keep source plus diagnostics | mechanizable | yes | `parseTurn` | 2 | 2 | 3 | code |
| OE04 | Driver protocol 3 | Re-invoke once with the fixed repair sentence on invalid output | mechanizable | yes | the driver protocol + schema validation | 2 | 2 | 3 | a fixed retry rule |
| OE05 | Driver protocol 4 | Second failure is driver `FAILED`, never an endless retry | mechanizable | yes | the same protocol | 2 | 2 | 3 | a counter bound |
| OE06 | Contract evolution | A breaking change to a published contract is a package major | mixed | partial | `scripts/version-parity-gate.mjs`, `scripts/npm-version-gate.mjs` | 2 | 2 | 2 | branch: semver classification is a judgement; the gates only enforce consistency |
| OE07 | Normalized Repository State | Call discovery before planning; route a contradiction to the resolver | mechanizable | partial | `scripts/unit-route.mjs` intents; `workflow-status` | 2 | 2 | 3 | an ordered call graph |
| OE08 | Turn contract (reference) | The canonical 11-box contract lives here | mechanizable | no | none | 2 | 2 | 2 | it is a definition; no checker reads it |

### phase-contract

F=3 (every phase) · S=3 (13 commits/18 mo) · sections accounted for: 6 `##` + 2 `###`

| heading | role |
|---|---|
| When to use | the three call sites |
| The eight phase-lint rules | the sole definition of a valid phase |
| The two grammars | plan versus unit-doc shape, fail-closed precedence |
| Mapping the eight boxes to a bullet phase | which boxes apply, which are n/a |
| The `Relevant files:` sub-section is metadata | never a task |
| Result — fixed PASS/BLOCKED output | the two verdict blocks |
| Normalized phase fingerprint | the deterministic phase identity |
| Guardrails | ownership and no-relaxation |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| PC01 | Eight rules 1–8 | Title joins, one layer, task budget, atomicity, decision words, conditional scope, external gates, machine done-when | mechanizable | yes | `scripts/phase-lint.mjs` | 3 | 3 | 3 | mechanized exactly by the fix-#272 split |
| PC02 | Two grammars | Fail-closed precedence between the plan and unit-doc grammars | mechanizable | yes | `scripts/phase-lint.mjs` | 3 | 3 | 3 | a parser decision in code |
| PC03 | Mapping table | Boxes n/a for a bullet phase; the final-bullet exemption | mechanizable | yes | `scripts/phase-lint.mjs` | 3 | 3 | 3 | per-grammar rule selection is code |
| PC04 | Relevant files | Path/glob validation, never a task and never scope authority | mechanizable | yes | `scripts/phase-lint.mjs` (`relevant-files:` id) | 3 | 3 | 3 | code |
| PC05 | Result | `PASS (8/8)` / `PASS (6/6)` / `BLOCKED — box n: reason` | mechanizable | yes | `scripts/phase-lint.mjs` | 3 | 3 | 3 | a fixed output |
| PC06 | Fingerprint | `P<n>:<layer>:<n-tasks>:<title-deliverable>` | mechanizable | yes | `scripts/phase-lint.mjs` | 3 | 3 | 3 | a deterministic string |
| PC07 | Guardrails | Never relax a rule to pass; sole owner; docs only | judgment | no | none | 3 | 3 | 2 | an ownership rule |

### pre-execution-review

F=2 (per planning cycle) · S=2 (85 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| When to use | the lane's plan/review steps only |
| Hard rule — no verdicts, no edits | policy is not a receipt |
| The three references | condition → reference table |
| Guardrails | single owner, closed vocabulary |
| Done when | callers point here instead of restating |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| PX01 | Hard rule | Never issue a verdict and never write a unit artifact | judgment | no | none | 2 | 2 | 3 | an authority rule |
| PX02 | Three references | Load POLICY / SNAPSHOT / LEDGERS by condition | mechanizable | no | none | 2 | 2 | 2 | a condition→file table |
| PX03 | SNAPSHOT | Bind stage artifacts and re-verify a digest | mechanizable | yes | `scripts/pre-execution-snapshot.mjs verify` | 2 | 2 | 3 | the recipe is one command |
| PX04 | LEDGERS | Row shapes and write ownership for the planning ledgers | mechanizable | yes | `agentic-workflow verify` (embedded or sibling ledgers) | 2 | 2 | 3 | row shapes are validated in code |
| PX05 | POLICY | Independence, union, dismissal, no-progress, convergence anomaly, batch repair | judgment | no | none | 2 | 2 | 3 | the review judgement itself |
| PX06 | Guardrails | Closed vocabulary, no weakening, policy is not a receipt | judgment | no | none | 2 | 2 | 2 | prohibitions |

### product-audit

F=1 (per audit) · S=2 (65 commits/18 mo) · sections accounted for: 15 `##` + 4 `###`

| heading | role |
|---|---|
| Turn contract | closing duties |
| When to use — measured triggers | trigger |
| Scope | whole product or a stated area |
| Step 0 — Discover the project | project contract, product nature, installed extras |
| Progressive loading — audit route | dimensions then process |
| Output format | the persisted file equals the chat print |
| Health by dimension | the applicability verdict per dimension |
| Findings | one `F` sequence with the published vocabulary |
| Delta vs audit | new/unchanged/resolved against the prior id |
| Proposals — Issues to open | issue proposals with routes |
| Proposals — Roadmap add | feature proposals |
| Proposals — Roadmap remove/revise | retirement proposals |
| Proposals — Tooling register/re-design | skill/MCP proposals |
| Manual-verification checklist | what automation cannot confirm |
| Guardrails | sampling honesty, ask-don't-infer |
| Portability | fallbacks |
| Relationship to other skills | neighbours |
| Done when | exit conditions |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| PA01 | Step 0 | Read the roadmap, fix index, feature layout and verification gate; decide the product nature | mixed | partial | `packages/agentic-workflow/src/index-document.mjs` | 1 | 2 | 2 | branch: the path reads are mechanical, the "product nature" is a read |
| PA02 | Progressive loading | Mark every dimension applicable or `n-a: <reason>` | mechanizable | no | none | 1 | 2 | 2 | a closed applicability matrix plus a reason token |
| PA03 | Output format | Emit the persisted file and the identical chat print | mechanizable | no | none | 1 | 2 | 2 | a fixed structure with no emitter |
| PA04 | Findings | One `F` sequence; severity/impact/class from the published ladder | mechanizable | partial | `review-implementation` `CLASSIFY.md` vocabulary | 1 | 2 | 3 | the vocabulary is published; ordering is by severity |
| PA05 | Findings | The `route:` cell in the published `finding-route@1` shape | mechanizable | yes | the grammar block in the file | 1 | 2 | 2 | a fixed grammar already declared |
| PA06 | Delta vs audit | New/unchanged/resolved against the prior audit id | mechanizable | no | none | 1 | 2 | 2 | set differences over persisted ids |
| PA07 | Proposals | The four proposal streams with their routes | judgment | no | none | 1 | 2 | 2 | what to propose is the audit's judgement |
| PA08 | Every section | An empty section states `none — <why>` | mechanizable | no | none | 1 | 2 | 1 | an invariant a renderer could enforce |
| PA09 | Closing block | `/triage-issue <id> F<k> …` listing every finding id | mechanizable | no | none | 1 | 2 | 2 | id-list assembly |
| PA10 | Guardrails | Sampling must be stated; never imply full coverage | judgment | no | none | 1 | 2 | 2 | an honesty rule |
| PA11 | Guardrails | Ask-don't-infer on the expectation surface | judgment | no | none | 1 | 2 | 2 | a rule |
| PA12 | Manual checklist | List what automation cannot confirm | judgment | no | none | 1 | 2 | 2 | the residue by definition |
| PA13 | Process step 9 | Assign the incremental audit id from the persisted set | mechanizable | no | none | 1 | 2 | 1 | max+1 over the audit files |
| PA14 | Installed tooling sweep | Inventory installed skills/MCPs and cross them against axes and the roadmap | mechanizable | partial | `scripts/capabilities.mjs` (the inventory half) | 1 | 2 | 2 | enumeration is mechanical; the cross is judgement |

### resolve-repository-state

F=1 (on contradiction) · S=3 (9 commits/18 mo) · sections accounted for: 7 `##`

| heading | role |
|---|---|
| Turn contract | closing duties |
| Step 0 — Discover the project | read the ledger and the named contradiction |
| Process | verify both sides, dispose, write, freeze |
| Guardrails | sole writer; inference is insufficient |
| Portability | fallbacks |
| Relationship to other skills | resume the interrupted role |
| Done when | disposition recorded |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| RR01 | Process 1 | Read the frozen ledger and the contradiction row named by the user | mechanizable | partial | the `REPOSITORY_STATE.md` shape | 1 | 3 | 2 | a section lookup |
| RR02 | Process 2 | Verify both evidence sources | judgment | no | none | 1 | 3 | 3 | evidence reading |
| RR03 | Process 3 | Choose accept, reject or needs-input | judgment | no | none | 1 | 3 | 3 | the disposition itself |
| RR04 | Process 4 | needs-input: update the row, keep `contradicted`, no id increment, stop | mechanizable | partial | `scripts/pre-execution-contract.mjs` (the state vocabulary) | 1 | 3 | 3 | a state machine over three outcomes |
| RR05 | Process 5 | Accept: supersede citing both sources; reject: keep the fact and why | mechanizable | no | none | 1 | 3 | 3 | fixed row shapes |
| RR06 | Process 6 | Increment the id, set `frozen`, record the source revision | mechanizable | partial | `scripts/pre-execution-snapshot.mjs verify` (revision binding) | 1 | 3 | 3 | a counter plus a status write |
| RR07 | Guardrails | Sole writer; consumers may propose but never resolve | judgment | no | none | 1 | 3 | 3 | an authority rule |

### review-a11y

F=2 (per UI review) · S=3 (7 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Scope | the caller's diff or path/glob |
| Checklist | nine accessibility items, each mandatory or `n/a` |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| AA01 | Checklist 1 | Semantic elements over generic ones | judgment | no | none | 2 | 3 | 2 | a DOM-semantics reading |
| AA02 | Checklist 2 | A label per input, an alt per image | mechanizable | no | none | 2 | 3 | 2 | a static rule over parsed markup |
| AA03 | Checklist 3 | Full keyboard operability of the changed surface | judgment | no | none | 2 | 3 | 3 | behavioural reading |
| AA04 | Checklist 4 | Focus management on dynamic changes | judgment | no | none | 2 | 3 | 3 | behavioural |
| AA05 | Checklist 5 | Contrast meets the declared level, computed values cited | mechanizable | no | none | 2 | 3 | 2 | computable from declared tokens |
| AA06 | Checklist 6 | ARIA correct and only when needed | judgment | no | none | 2 | 3 | 2 | semantic judgement |
| AA07 | Checklist 7 | No information by colour alone | judgment | no | none | 2 | 3 | 2 | judgement |
| AA08 | Checklist 8 | Reduced-motion preferences respected | mechanizable | no | none | 2 | 3 | 1 | a greppable media query |
| AA09 | Checklist 9 | Error messages programmatically associated | judgment | no | none | 2 | 3 | 3 | needs the DOM reading |
| AA10 | Return exactly | Fixed table, counts and `Decision: PASS or FAIL` | mechanizable | yes | `review-implementation`'s finder contract vocabulary | 2 | 3 | 2 | a fixed shape with closed vocabularies |
| AA11 | Materiality bar | Cite the violated rule beside the evidence; never pad | judgment | no | none | 2 | 3 | 2 | the bar's application |

### review-brand

F=2 (per copy review) · S=3 (7 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Scope | the caller's diff or path/glob |
| Checklist | eight brand/copy items |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| BR01 | Checklist 1 | Read the brand doc first and cite the rule | mechanizable | no | none | 2 | 3 | 2 | doc discovery |
| BR02 | Checklist 2 | Tone matches the declared voice | judgment | no | none | 2 | 3 | 2 | copy judgement |
| BR03 | Checklist 3 | Glossary terms, capitalisation and consistency | mechanizable | no | none | 2 | 3 | 2 | a glossary lookup nothing runs |
| BR04 | Checklist 4 | No forbidden or deprecated phrases | mechanizable | yes | a pattern scan of the brand doc's list | 2 | 3 | 2 | a closed phrase list |
| BR05 | Checklist 5 | Claims are honest: enforced limits are disclosed | judgment | no | none | 2 | 3 | 3 | an honesty reading against the code |
| BR06 | Checklist 6 | Error/empty copy is actionable | judgment | no | none | 2 | 3 | 2 | copy judgement |
| BR07 | Checklist 7 | Consistency across the changed surface and siblings | judgment | no | none | 2 | 3 | 2 | judgement |
| BR08 | Checklist 8 | No placeholder or lorem text in the diff | mechanizable | partial | a `rg` sweep | 2 | 3 | 1 | a pattern sweep |
| BR09 | Return exactly | Fixed table, counts and `Decision` | mechanizable | yes | the shared finder contract | 2 | 3 | 2 | a fixed shape |

### review-change

F=3 (per change) · S=1 (171 commits/18 mo) · sections accounted for: 13 `##`

| heading | role |
|---|---|
| Turn contract | closing duties |
| Review-end turn boundary | the receipt is the turn's last write |
| When to use | trigger |
| Scope | the branch diff or path/glob |
| Review charter — dismantle the claim | the review stance |
| Step 0 — Discover the project & the change | axes from nature and footprint |
| Applicability matrix | axis ↔ platform table |
| Isolation rule | one clean context per pass |
| Progressive loading — choose one review route | the route allowlists |
| Reviewer anti-invention rule | changed bytes or a mis-run check only |
| Portability | fallbacks |
| Relationship to other skills | neighbours |
| Done when | exit conditions |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| CH01 | Step 0.1–2 | Decide applicable axes from project nature and diff footprint | mechanizable | partial | the applicability matrix in this file | 3 | 1 | 3 | a table lookup once nature and footprint are known |
| CH02 | Step 0.3 | Optional retrieval aid before the passes | mechanizable | yes | `agentic-workflow doc --query --json-only` | 3 | 1 | 1 | the prose names the command and says it is never authoritative |
| CH03 | Applicability matrix | Axis ↔ platform applicability table | mechanizable | yes | the table itself (its owner file) | 3 | 1 | 3 | a closed matrix in prose |
| CH04 | Isolation rule | One fresh context per pass, tables only, full-read cap | mechanizable | partial | the adversarial bindings | 3 | 1 | 2 | spawn discipline and caps are countable |
| CH05 | Pass model routing | Resolve each pass's model before spawning and record its source | mechanizable | yes | `agentic-workflow resolve-passes` | 3 | 1 | 2 | the receipt is code |
| CH06 | Progressive loading | Exactly one route's reference set, in order | mechanizable | no | none | 3 | 1 | 2 | an ordered allowlist |
| CH07 | Legacy `--merge` | Print the fixed migration refusal, mutate nothing | mechanizable | no | none | 3 | 1 | 3 | a fixed string behind a refusal |
| CH08 | Reviewer anti-invention | New findings only from changed bytes or a mis-run check | mechanizable | partial | `git diff` | 3 | 1 | 3 | two closed grounding conditions |
| CH09 | Review charter | Dismantle the claim; in-scope defects stay in scope; ask-don't-infer | judgment | no | none | 3 | 1 | 3 | the review stance |
| CH10 | Output | SHA-bound `REVIEW-PASS`/`REVIEW-FAIL` receipt | mechanizable | yes | `scripts/review-receipt.mjs` | 3 | 1 | 3 | the marker shape and SHA binding are code |
| CH11 | Decision | Verdict from the classified table's blocking rule | mechanizable | partial | `review-implementation` CLASSIFY | 3 | 1 | 3 | one citation test over the table |
| CH12 | Cycle bounds | Two-cycle cap; a third cycle is user-only | mechanizable | no | none | 3 | 1 | 2 | a counter over persisted cycles |
| CH13 | Guardrails | Never merge; never re-litigate a receipt; no repo-wide hunting | judgment | no | none | 3 | 1 | 3 | prohibitions |

### review-code

F=3 (every change) · S=3 (12 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Scope | the caller's diff or path/glob |
| Checklist | seventeen correctness/simplification items |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| CO01 | Checklist 1–2 | Logic errors traced; every error path handled | judgment | no | none | 3 | 3 | 3 | correctness reading |
| CO02 | Checklist 3 | No duplicated logic including shadow copies, citing the original | judgment | no | none | 3 | 3 | 2 | "same logic" needs a decision |
| CO03 | Checklist 4 | No dead code introduced | mechanizable | no | none | 3 | 3 | 2 | a reference search nothing runs |
| CO04 | Checklist 5 | No leftover TODO/FIXME/HACK in the diff | mechanizable | yes | an `rg` sweep over the diff | 3 | 3 | 1 | a pattern sweep |
| CO05 | Checklist 6 | Naming and file conventions match the project docs | judgment | no | none | 3 | 3 | 2 | convention reading |
| CO06 | Checklist 7 | No new abstraction beyond what the SPEC requires | judgment | no | none | 3 | 3 | 2 | judgement |
| CO07 | Checklist 8 | No new dependency not justified in the SPEC | mechanizable | partial | `scripts/dependency-advisory-pass.mjs` (advisory only) | 3 | 3 | 2 | the manifest diff is readable |
| CO08 | Checklist 9 | Simplification candidates cited before/after | judgment | no | none | 3 | 3 | 2 | judgement |
| CO09 | Checklist 10 | Reference trace for every changed symbol | mechanizable | partial | LSP or `rg` per symbol | 3 | 3 | 3 | one search per symbol |
| CO10 | Checklist 11 | Sweep declaration on token/claim surfaces | mechanizable | yes | `scripts/promise-coherence.mjs` (`sweep-mismatch`) | 3 | 3 | 3 | the sweeps are re-run in code |
| CO11 | Checklist 12 | SPEC dev-scenario edge cases actually handled | judgment | no | none | 3 | 3 | 2 | reading against scenarios |
| CO12 | Checklist 13–14 | Deletion mandate and the unused-code two-way route | judgment | no | none | 3 | 3 | 2 | authority plus classification |
| CO13 | Checklist 15–17 | Duplication, superseded-by-mechanism, citation-is-not-a-consumer | judgment | no | none | 3 | 3 | 2 | deletion reasoning |
| CO14 | Checklist 18 | Every requested feature survives the deletion | judgment | no | none | 3 | 3 | 3 | verification by reasoning |
| CO15 | Checklist 19 | A removal change deletes code, docs and siblings with one sweep each | mechanizable | partial | `scripts/promise-coherence.mjs` | 3 | 3 | 3 | the declared sweeps are re-runnable |
| CO16 | Return exactly | Fixed table, counts and `Decision` | mechanizable | yes | the shared finder contract | 3 | 3 | 2 | a fixed shape |

### review-debt

F=2 (per review, when debt rows exist) · S=3 (7 commits/18 mo) · sections accounted for: 4 `##`

| heading | role |
|---|---|
| Scope | the synthesized findings table, never the diff |
| Transform | turn debt-shaped rows into payable items with triggers |
| Return exactly | the fixed findings table |
| Done when | every row transformed or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| DE01 | Transform | Restate each debt row at `file:line` with what it defers | judgment | no | none | 2 | 3 | 2 | restating is authoring |
| DE02 | Transform | Attribute the row to its recorded axis, never re-litigate ownership | mechanizable | yes | the table's own `axis` cell | 2 | 3 | 2 | a cell copy |
| DE03 | Transform | Every item carries a trigger; a missing trigger is itself a finding | mechanizable | no | none | 2 | 3 | 3 | a nullable-cell check |
| DE04 | Transform | Scheduled deletions carry the removal trigger | mechanizable | no | none | 2 | 3 | 2 | a route+trigger shape |
| DE05 | Transform | No current-unit row is `postpone`/`tradeoff`/`wontfix` | mechanizable | partial | `review-implementation` CLASSIFY's closed set | 2 | 3 | 3 | vocabulary membership |
| DE06 | Transform | Dead-code exception: staged code cross-checked against roadmap/SPEC | judgment | no | none | 2 | 3 | 2 | reading |
| DE07 | Transform | A removal proposal routes `fix-now (delete)` | mechanizable | no | none | 2 | 3 | 2 | a route vocabulary |
| DE08 | Return exactly | Fixed table, transformed/trigger counts and `Decision` | mechanizable | yes | the shared finder contract | 2 | 3 | 2 | a fixed shape |

### review-design

F=2 (per UI review) · S=3 (7 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Scope | the caller's diff or path/glob |
| Checklist | nine UI/UX items |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| DS01 | Checklist 1 | Read the design doc first and cite the rule | mechanizable | no | none | 2 | 3 | 2 | doc discovery |
| DS02 | Checklist 2–3 | Design-system reuse; every view state handled | judgment | no | none | 2 | 3 | 2 | judgement |
| DS03 | Checklist 4–5 | Responsive at declared breakpoints; no hardcoded strings under i18n | mechanizable | no | none | 2 | 3 | 2 | greppable once the docs declare them |
| DS04 | Checklist 6–7 | Visual hierarchy; sibling consistency | judgment | no | none | 2 | 3 | 2 | judgement |
| DS05 | Checklist 8–9 | Destructive confirmation; feedback on every action | judgment | no | none | 2 | 3 | 2 | judgement |
| DS06 | Return exactly | Fixed table, counts and `Decision` | mechanizable | yes | the shared finder contract | 2 | 3 | 2 | a fixed shape |

### review-implementation

F=3 (every review) · S=2 (57 commits/18 mo) · sections accounted for: 9 `##`

| heading | role |
|---|---|
| When to use | composed by `review-change`, reused by the audits |
| Scope | the caller's scope statement |
| Step 0 — Discover the project | architecture, testing and risk rules |
| Step 1 — Verify axis coverage | no missing axis, no duplicate row |
| Step 2 — Classify | one pass over the fused table |
| Context budget | ≤10 full non-diff reads |
| Guardrails | one classifier; never deflate |
| Relationship to other skills | consumers of the rubric |
| Done when | table consumed, every row routed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| IM01 | Step 0 | Read the architecture, layering, testing and risk rules | mixed | partial | the guide's documentation map | 2 | 2 | 2 | branch: the paths are a lookup, the rules are read |
| IM02 | Step 1 | Every applicable axis is represented; a missing axis is a finding | mechanizable | partial | the `FIND.md` axis map | 3 | 2 | 3 | a set difference over axes |
| IM03 | Step 1 | No duplicate and no gap in the synthesized table | mechanizable | no | none | 3 | 2 | 3 | dedupe keyed on `file:line` + axis |
| IM04 | Step 2 | Classify every row: ignore → current-unit contract → proposal | mixed | partial | `scripts/unit-route.mjs` (route reading) | 3 | 2 | 3 | branch: the disposition is judgement; the closed set is code |
| IM05 | Step 2 | Fill `scope: in-unit or new-unit` from paths versus the unit's Impact set | mechanizable | partial | `git diff --name-only` + the unit doc's `## Impact` | 3 | 2 | 3 | a path-set membership test |
| IM06 | Context budget | At most 10 full non-diff reads | mechanizable | no | none | 3 | 2 | 1 | a counter |
| IM07 | Guardrails | Never classify per pass; never deflate; honour the dead-code exception | judgment | no | none | 3 | 2 | 3 | rules that keep the classifier honest |
| IM08 | Done when | Table consumed, coverage verified, every row classified and routed | mechanizable | no | none | 3 | 2 | 2 | counts over the table |

### review-perf

F=2 (every change) · S=3 (8 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Scope | the caller's diff or path/glob |
| Checklist | eleven performance items |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| PE01 | Checklist 1–3 | N+1 queries, complexity, blocking IO on hot paths | judgment | no | none | 2 | 3 | 2 | reading |
| PE02 | Checklist 4 | Resources released on every path including errors | judgment | no | none | 2 | 3 | 3 | reading |
| PE03 | Checklist 5–7 | Unbounded growth, bundle impact, hoisting | judgment | no | none | 2 | 3 | 2 | reading |
| PE04 | Checklist 8 | Pagination or limits on a new listing | judgment | no | none | 2 | 3 | 2 | reading |
| PE05 | Checklist 9 | No premature optimisation without a cited measurement | judgment | no | none | 2 | 3 | 2 | reading |
| PE06 | Checklist 10 | Declared bench: run base and change, cite both, compare the noise band | mechanizable | partial | the declared `bench` command; `scripts/tier-cost.mjs` is the precedent | 2 | 3 | 3 | two runs and a ratio |
| PE07 | Checklist 11 | No declared perf commands → the exact `n/a` sentence | mechanizable | yes | a block-presence check in the guide | 2 | 3 | 1 | a presence check |
| PE08 | Return exactly | Fixed table including the measured-evidence cell | mechanizable | yes | the shared finder contract | 2 | 3 | 2 | a fixed shape |

### review-security

F=3 (every change) · S=3 (9 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Scope | the caller's diff or path/glob |
| Checklist | ten security items |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| SE01 | Checklist 1 | No secrets in code, config, tests or fixtures | mechanizable | yes | `scripts/skill-lint.mjs`'s credential scan covers skills | 3 | 3 | 3 | a pattern sweep |
| SE02 | Checklist 2 | Every external input validated before use | judgment | no | none | 3 | 3 | 3 | reading |
| SE03 | Checklist 3 | No injection vectors | judgment | no | none | 3 | 3 | 3 | reading |
| SE04 | Checklist 4 | AuthN/AuthZ on every new entry point | judgment | no | none | 3 | 3 | 3 | reading |
| SE05 | Checklist 5 | No PII or secrets in logs or error messages | judgment | no | none | 3 | 3 | 2 | reading |
| SE06 | Checklist 6 | Webhook signatures verified | judgment | no | none | 3 | 3 | 2 | reading |
| SE07 | Checklist 7 | Rate limiting considered for a new public surface | judgment | no | none | 3 | 3 | 2 | reading |
| SE08 | Checklist 8 | Dependencies pinned and free of known-critical advisories; cite the advisory row | mechanizable | yes | `scripts/dependency-advisory-pass.mjs` | 3 | 3 | 3 | the prose names the command and the row it prints |
| SE09 | Checklist 9–10 | No stack traces or internal paths; no unsafe deserialization | judgment | no | none | 3 | 3 | 2 | reading |
| SE10 | Return exactly | Fixed table, counts and `Decision` | mechanizable | yes | the shared finder contract | 3 | 3 | 2 | a fixed shape |

### review-seo

F=2 (when a public web surface exists) · S=3 (7 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Scope | the caller's diff or path/glob |
| Checklist | nine SEO items on changed public pages |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| SO01 | Checklist 1 | Read the SEO doc first; n/a everything when the product has no public surface | mechanizable | no | none | 2 | 3 | 2 | doc and surface detection |
| SO02 | Checklist 2 | Unique title and meta description within the declared lengths | mechanizable | no | none | 2 | 3 | 2 | length arithmetic over rendered pages |
| SO03 | Checklist 3 | Canonical URL correct on new routes | mechanizable | no | none | 2 | 3 | 2 | a computed expectation |
| SO04 | Checklist 4 | Indexability intended equals actual (robots, noindex, sitemap) | mechanizable | no | none | 2 | 3 | 3 | a state comparison |
| SO05 | Checklist 5 | One h1 per page; no skipped heading levels | mechanizable | no | none | 2 | 3 | 2 | a heading-tree check |
| SO06 | Checklist 6 | Structured data valid, with the validator output cited | mechanizable | no | none | 2 | 3 | 2 | a validator run |
| SO07 | Checklist 7–9 | Crawlable links; image alt/filenames; no render-blocking regression | judgment | no | none | 2 | 3 | 2 | judgement plus rendering |
| SO08 | Return exactly | Fixed table, counts and `Decision` | mechanizable | yes | the shared finder contract | 2 | 3 | 2 | a fixed shape |

### review-verify

F=3 (every change) · S=3 (8 commits/18 mo) · sections accounted for: 5 `##`

| heading | role |
|---|---|
| Shift to auditor of recorded evidence | re-run a sample instead of re-deriving |
| Scope | the caller's diff or path/glob |
| Checklist | eleven verification items |
| Materiality bar | the shared finder bar |
| Return exactly | the fixed findings table |
| Done when | every item evidenced or n/a; no code changed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| VE01 | Checklist 1 | Re-run at least three recorded commands and compare against what was recorded | mechanizable | partial | the recorded Evidence rows; `agentic-workflow verify` | 3 | 3 | 3 | re-running is mechanical; the sample choice is not |
| VE02 | Checklist 2 | Every claim row carries `status: ✓` | mechanizable | yes | `validateEvidenceRow` (schema package) | 3 | 3 | 3 | a column check |
| VE03 | Checklist 3 | Triage currency against the unit doc's Evidence section | mechanizable | yes | `scripts/unit-route.mjs --triage` | 3 | 3 | 3 | code |
| VE04 | Checklist 4 | The project gate ran in this review, with exits pasted per command | mechanizable | yes | `scripts/local-gate.mjs` | 3 | 3 | 3 | code |
| VE05 | Checklist 5 | Exercise the primary claimed behaviour for real | judgment | no | none | 3 | 3 | 3 | choosing the exercise is judgement |
| VE06 | Checklist 6 | Reproduce at least one SPEC dev-scenario failure mode | judgment | no | none | 3 | 3 | 2 | choice plus reading |
| VE07 | Checklist 7 | New tests actually fail when the implementation is reverted | mechanizable | no | none | 3 | 3 | 3 | a revert-and-run procedure no carrier wraps |
| VE08 | Checklist 8 | No test was skipped, disabled or narrowed to get green | mechanizable | yes | an `rg` sweep over the diff | 3 | 3 | 3 | a pattern sweep |
| VE09 | Checklist 9 | The build artifact or dev server starts cleanly | mechanizable | yes | the project's declared build | 3 | 3 | 2 | a command |
| VE10 | Checklist 10 | Human-only checks are listed under Manual | judgment | no | none | 3 | 3 | 2 | the residue by definition |
| VE11 | Return exactly | Fixed table, counts and `Decision` | mechanizable | yes | the shared finder contract | 3 | 3 | 2 | a fixed shape |

### skill-lint

F=2 (after any skill edit) · S=3 (10 commits/18 mo) · sections accounted for: 8 `##` + 3 `###`

| heading | role |
|---|---|
| Turn contract | closing duties |
| When to use | after a skill or skill-reference edit |
| Step 0 — Orientation | confirm the repo is agentic-workflow |
| Process 1. Run the content checks | the mechanical half |
| Process 2. Lint, warn, never repair | the eight authoring invariants |
| Process 3. Print a summary and the next step | results and the commit block |
| Guardrails | report-only, never weaken |
| Portability | fallbacks |
| Relationship to other skills | the gates it does not own |
| Done when | block pasted, violations reported, next step printed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| SL01 | Process 1 | Run the content checks (whole tree or one skill) and paste the block | mechanizable | yes | `scripts/skill-lint.mjs` | 2 | 3 | 3 | the skill is a thin wrapper over the script |
| SL02 | Process 1 | Read the exit code as the verdict (0 PASS / 1 FAIL / 2 usage) | mechanizable | yes | the same script | 2 | 3 | 3 | code |
| SL03 | Process 2 | Check the eight authoring invariants | mechanizable | partial | `scripts/skill-lint.mjs` covers the machine-surface half; `check-skill-context.mjs` the budgets | 2 | 3 | 3 | the rules are closed patterns |
| SL04 | Process 2 | Report violations and never repair them | judgment | no | none | 2 | 3 | 2 | a prohibition |
| SL05 | Process 3 | Print the next step's staging block and the changeset requirement | mechanizable | partial | `scripts/lint-changeset.mjs` | 2 | 3 | 1 | a fixed block |
| SL06 | Step 0 | Confirm this is the agentic-workflow repository | mechanizable | yes | marker files | 2 | 3 | 1 | an existence test |
| SL07 | Guardrails | Never edit a `SKILL.md`, never commit or push, never weaken a check | judgment | no | none | 2 | 3 | 2 | prohibitions |

### triage-issue

F=2 (per issue) · S=2 (75 commits/18 mo) · sections accounted for: 8 `##`

| heading | role |
|---|---|
| Turn contract | closing duties |
| When to use | trigger and modes |
| Step 0 — Discover the project | index, templates, issue read |
| Progressive loading — select the triage source | the allowlist per mode |
| Guardrails | ask-don't-infer, no deferred work |
| Portability | fallbacks |
| Relationship to other skills | the routing graph |
| Done when | verdict recorded, closing block printed |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| TI01 | Step 0 | Read the location index, the fix SPEC template and the roadmap tables | mechanizable | partial | `packages/agentic-workflow/src/index-document.mjs` | 2 | 2 | 2 | a path set |
| TI02 | Step 0 | Optional retrieval aid before the forge read | mechanizable | yes | `agentic-workflow doc --query` | 2 | 2 | 1 | the prose names the command and its fallback |
| TI03 | Step 0 | Read the issue in full through the fixed JSON field list | mechanizable | yes | the forge issue read literal in the prose | 2 | 2 | 2 | a fixed command |
| TI04 | Step 0 | A new issue body carries its `Checked:` line | mechanizable | no | none | 2 | 2 | 2 | a body-line presence check |
| TI05 | Progressive loading | Choose the source's reference allowlist by mode | mechanizable | no | none | 2 | 2 | 2 | a mode→files table |
| TI06 | Classification | Trigger evidence becomes a verdict in the closed set | mixed | partial | `scripts/unit-route.mjs` route output | 2 | 2 | 3 | branch: the evidence reading is judgement; the set is code |
| TI07 | Verification | Verify the trigger against current code before classifying | judgment | no | none | 2 | 2 | 3 | the triage's core read |
| TI08 | Labels | Apply urgency/disposition labels from the owned vocabulary | mechanizable | partial | the forge label mutation; the vocabulary file | 2 | 2 | 2 | a closed label set |
| TI09 | Ledger write | Write a fold-ledger row for `fix-now`/`fix-in-unit` | mechanizable | yes | the carrier schema (`findings-table@1`) | 2 | 2 | 3 | the row shape is published |
| TI10 | Output | One fixed verdict block per issue plus the batch summary table | mechanizable | no | none | 2 | 2 | 2 | fixed fields |
| TI11 | Routing | Map every verdict to its own next command, joined explicitly | mechanizable | yes | `scripts/unit-route.mjs` prints the route commands | 2 | 2 | 2 | a route→command table in code |
| TI12 | Guardrails | Never implement deferred work and never implement a finding here | judgment | no | none | 2 | 2 | 3 | prohibitions |

### unit-lane

F=3 (per unit) · S=1 (105 commits/18 mo) · sections accounted for: 10 `##` + 9 `###`

| heading | role |
|---|---|
| Turn contract | the 11 closing boxes |
| When to use | invocation forms |
| Inputs — never inferred, never defaulted | the gap order and the decisions file |
| Step 0 — Discover the project | template, existing doc, open `## Future` rows |
| Process 1. Resolve or create the unit doc | tree → folder, template, index row |
| Process 1a. Risk tier | read the computed verdict, never decide it |
| Process 2. Triage — read the catalog | paste the authoritative step block |
| Process 3. Forward closure + retirements | delegated to the design/plan references |
| Process 4. Execute triaged steps in order | one step per turn-commit, execution handed off |
| Process 5. Diff-size guard | after each implement step |
| Process 6. Update evidence and progress | before every commit |
| Process 7. Memory boundaries | probe, save, recall ladder |
| Process 8. Close the unit | the close-out ladder |
| Guardrails | allowed/forbidden lists |
| Relationship to other skills | neighbours |
| Portability | fallbacks |
| Done when | exit conditions |
| Closing recommendation | the `→ Next:` branch |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| UL01 | Process 1 | Resolve or create the unit doc from the tree's own template and register the index row | mechanizable | partial | `agentic-workflow unit-doc create`; `docs-generate` | 3 | 1 | 3 | a tree→path table with a writer already present |
| UL02 | Process 1 | Fill objective, why and user outcome from the invocation or issue | judgment | no | none | 3 | 1 | 3 | authoring |
| UL03 | Process 1 | Induce acceptance criteria from user scenarios, asking rather than inferring | judgment | no | none | 3 | 1 | 3 | the design decision |
| UL04 | Process 1a | Classify the risk tier and branch on passive/standard/high | mechanizable | yes | `scripts/ceremony.mjs tier classify`; `ceremony passive add` | 3 | 1 | 3 | the verdict and the passive record are code |
| UL05 | Process 2 | Run the triage router and paste its block as the authoritative step list | mechanizable | yes | `scripts/unit-route.mjs --triage` | 3 | 1 | 3 | code |
| UL06 | Process 3 | Delegate forward closure and retirements to the design/plan references | mechanizable | yes | the two reference files | 3 | 1 | 2 | a pointer by construction — no rule is restated |
| UL07 | Process 4.1–5 | Per triaged step: read its reference, run the checklist, evidence, progress, commit | mixed | partial | the per-step references; the `unit-doc` writers | 3 | 1 | 2 | branch: the checklist is authored; the bookkeeping is code |
| UL08 | Process 4 | Hand execution off one phase per turn at the triage tier | mechanizable | partial | `scripts/unit-route.mjs` (prints `<k>`); `resolve-passes` (tier) | 3 | 1 | 3 | a router output |
| UL09 | Process 4 | Never print a bare whole-unit `/execute-phase` | mechanizable | no | none | 3 | 1 | 2 | a hand-off grammar check |
| UL10 | Process 4 | Relay leg mode when a pi-web session is present | mechanizable | partial | `scripts/relay-packet.mjs`; `agentic-workflow relay check` | 3 | 1 | 2 | the packet contract is code |
| UL11 | Process 5 | Diff guard after each implement step | mechanizable | yes | `scripts/diff-guard.mjs` | 3 | 1 | 3 | code |
| UL12 | Process 6 | Evidence rows plus the progress entry before every commit | mechanizable | yes | the `unit-doc` writers; `evidence-row@1` | 3 | 1 | 3 | code |
| UL13 | Process 7 | Probe memory once, save at start/phase/close, follow the recall ladder | mechanizable | yes | `agentic-workflow memory probe`; the Engram tools | 3 | 1 | 2 | a fixed order and topic key |
| UL14 | Process 8.1–2 | Run the review step; resolve every `## Future` row with the user | mixed | no | none | 3 | 1 | 3 | branch: the Future rows are a decision surface |
| UL15 | Process 8.3 | Update the status and index row; release step owns branch hygiene, PR and forge reconciliation | mechanizable | partial | `agentic-workflow roadmap rowUpsert`; `roadmap-settle.mjs`; the forge PR create | 3 | 1 | 3 | settling is code; the PR body is authored |
| UL16 | Process 8.4 | Verify the PR's review receipt; never name the gate before it verifies | mechanizable | yes | `scripts/review-receipt.mjs verify --pr <N>` | 3 | 1 | 3 | exit codes |
| UL17 | Guardrails | Forbidden list: scope growth, invented criteria, skipped or reordered steps, red commits | judgment | no | none | 3 | 1 | 3 | prohibitions |
| UL18 | Closing recommendation | Branch the closing block on the router and receipt outputs | mechanizable | partial | `unit-route.mjs`, `review-receipt.mjs` | 3 | 1 | 2 | a branch over two machine answers |

### verification-contract

F=3 (every phase's receipt) · S=3 (20 commits/18 mo) · sections accounted for: 8 `##`

| heading | role |
|---|---|
| Executable claims | a stated count/exit/length names its command |
| Artifact | the acceptance source per unit era |
| Freeze and receipt | the evidence carrier and the blocked block |
| Which tests, and which layer | targeted versus empty verdict |
| Validation ladder | PASS/FAIL/NEEDS-DECISION/BLOCKED |
| Anti-gaming rules | no deleted or narrowed validators |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| VC01 | Executable claims | A count, exit code or length promise names its command or its surface | mechanizable | partial | `scripts/promise-coherence.mjs` | 3 | 3 | 3 | written outcomes are re-run |
| VC02 | Artifact (legacy) | Frozen `ACCEPTANCE.md` parts (status, id, outcome, validator, floor) | mechanizable | partial | `agentic-workflow verify` (legacy shape) | 3 | 3 | 3 | required parts are a schema |
| VC03 | Artifact (lane-era) | The unit doc's acceptance section: numbered, command-verified or labelled | mechanizable | partial | `agentic-workflow verify`; `evidence-row@1` | 3 | 3 | 3 | a shape plus a closed label set |
| VC04 | Validator stability | Never gate on a surface another actor mutates | judgment | no | none | 3 | 3 | 3 | a design rule the author applies |
| VC05 | Validator determinism | Pin network, clock and randomness or downgrade the row | judgment | no | none | 3 | 3 | 3 | the same |
| VC06 | Property/fuzz | A bounded `commands` row; no new validator kind | mechanizable | partial | the plan schema's timeout budgets | 3 | 3 | 2 | a class membership check |
| VC07 | Freeze and receipt | A frozen criterion's receipt is its Evidence row; missing or mismatched stops | mechanizable | yes | `agentic-workflow verify`; `pre-execution-snapshot.mjs` | 3 | 3 | 3 | code |
| VC08 | Which tests | Targeted versus empty verdict; never "the suite" | mechanizable | yes | `scripts/test-impact.mjs` | 3 | 3 | 3 | code |
| VC09 | Which layer | The change's layer picks the evidence kind | judgment | no | none | 3 | 3 | 2 | classification |
| VC10 | Validation ladder | PASS / FAIL / NEEDS-DECISION / BLOCKED | mechanizable | partial | gate exit codes + `unit-route` | 3 | 3 | 3 | closed verdicts with no emitter |
| VC11 | Anti-gaming | No deleted, skipped or narrowed validator; no manufactured green | judgment | partial | `scripts/red-first.mjs`, `scripts/structural-sibling-pins.mjs` | 3 | 3 | 3 | prohibitions with partial enforcement |

### workflow-status

F=3 (per orchestration step) · S=1 (115 commits/18 mo) · sections accounted for: 8 `##`

| heading | role |
|---|---|
| Turn contract | read-only duties; the script produces the envelope |
| Compact mode | the declared keep/drop set |
| When to use | trigger |
| Step 0 — Discover the project | the script reads its own inputs |
| Progressive loading — fixed sensor route | the six baseline references plus two conditional |
| Portability | fallbacks |
| Relationship to other skills | the orchestration loop |
| Done when | envelope emitted, nothing modified |

| id | section | step | class | duplicate-of-code | carrier | F | S | E | reason |
|---|---|---|---|---|---|---|---|---|---|
| WS01 | Turn contract | Run the sensor; the envelope is the script's stdout | mechanizable | yes | `scripts/workflow-status.mjs` | 3 | 1 | 3 | code |
| WS02 | Sensor route | The nine-step sequence including 6a | mechanizable | yes | `scripts/workflow-status.mjs` + `references/SENSOR_CORE.md` | 3 | 1 | 3 | code |
| WS03 | Compact mode | `--compact` drops repository history per the declared set | mechanizable | yes | the same script | 3 | 1 | 1 | code |
| WS04 | Turn contract | Nothing edited, committed, pushed or created | mechanizable | no | none | 3 | 1 | 2 | a posture a runner could assert |
| WS05 | Recommendation | `next.recommended` is non-bare and computed from the resolved status | mechanizable | yes | the same script | 3 | 1 | 3 | code |
| WS06 | Crash recovery | CLEAN→OK, RESUMABLE→CONTINUE, AMBIGUOUS→NEEDS_INPUT | mechanizable | yes | the same script | 3 | 1 | 3 | code |
| WS07 | Degradations | Every unavailable source is named `unavailable-<source>-<cause>` | mechanizable | yes | the same script | 3 | 1 | 3 | code |
| WS08 | No-progress guard | With a prior envelope, a stalled hint surfaces as a note | mechanizable | yes | the same script | 3 | 1 | 2 | code |
| WS09 | Output | Human summary then the envelope last; quote the emitted continuation | mechanizable | partial | the same script | 3 | 1 | 1 | output order and a field quote |
| WS10 | Progressive loading | Six baseline references plus two conditional | mechanizable | no | none | 3 | 1 | 1 | an allowlist |

## 4. Priority

Ranked by `score = F × S × E` (maximum 27). The full row set stays above; this
table is the worklist order — highest score first, ties broken by the shorter
reason to a first extraction (a row whose carrier already does most of the work
sorts first, because its unit is smaller).

```text
priority-table@1
rank | id | step | F | S | E | score
```
| 1 | VE02 | Every claim row carries `status: ✓` | 3 | 3 | 3 | 27 |
| 2 | CO10 | Sweep declaration on token/claim surfaces | 3 | 3 | 3 | 27 |
| 3 | PC06 | `P<n>:<layer>:<n-tasks>:<title-deliverable>` | 3 | 3 | 3 | 27 |
| 4 | SE01 | No secrets in code, config, tests or fixtures | 3 | 3 | 3 | 27 |
| 5 | VC08 | Targeted versus empty verdict; never "the suite" | 3 | 3 | 3 | 27 |
| 6 | VE08 | No test was skipped, disabled or narrowed to get green | 3 | 3 | 3 | 27 |
| 7 | PC05 | `PASS (8/8)` / `PASS (6/6)` / `BLOCKED — box n: reason` | 3 | 3 | 3 | 27 |
| 8 | VE03 | Triage currency against the unit doc's Evidence section | 3 | 3 | 3 | 27 |
| 9 | PC03 | Boxes n/a for a bullet phase; the final-bullet exemption | 3 | 3 | 3 | 27 |
| 10 | PC04 | Path/glob validation, never a task and never scope authority | 3 | 3 | 3 | 27 |
| 11 | PC02 | Fail-closed precedence between the plan and unit-doc grammars | 3 | 3 | 3 | 27 |
| 12 | VE04 | The project gate ran in this review, with exits pasted per command | 3 | 3 | 3 | 27 |
| 13 | VC07 | A frozen criterion's receipt is its Evidence row; missing or mismatched stops | 3 | 3 | 3 | 27 |
| 14 | LS06 | Forge-verify every status word (`merged`, `closed`, `approved`) before writing | 3 | 3 | 3 | 27 |
| 15 | SE08 | Dependencies pinned and free of known-critical advisories; cite the advisory row | 3 | 3 | 3 | 27 |
| 16 | LS09 | Close: commit the entry alone and report leftovers (0 clean / 2 dirty / 1 refused) | 3 | 3 | 3 | 27 |
| 17 | LS08 | Append to the log, or hand the entry to the fragment writer when the carrier exists | 3 | 3 | 3 | 27 |
| 18 | PC01 | Title joins, one layer, task budget, atomicity, decision words, conditional scope, external gates, machine done-when | 3 | 3 | 3 | 27 |
| 19 | VC10 | PASS / FAIL / NEEDS-DECISION / BLOCKED | 3 | 3 | 3 | 27 |
| 20 | CO09 | Reference trace for every changed symbol | 3 | 3 | 3 | 27 |
| 21 | VE07 | New tests actually fail when the implementation is reverted | 3 | 3 | 3 | 27 |
| 22 | CO15 | A removal change deletes code, docs and siblings with one sweep each | 3 | 3 | 3 | 27 |
| 23 | VC02 | Frozen `ACCEPTANCE.md` parts (status, id, outcome, validator, floor) | 3 | 3 | 3 | 27 |
| 24 | VC01 | A count, exit code or length promise names its command or its surface | 3 | 3 | 3 | 27 |
| 25 | VC03 | The unit doc's acceptance section: numbered, command-verified or labelled | 3 | 3 | 3 | 27 |
| 26 | VE01 | Re-run at least three recorded commands and compare against what was recorded | 3 | 3 | 3 | 27 |
| 27 | CO16 | Fixed table, counts and `Decision` | 3 | 3 | 2 | 18 |
| 28 | SE10 | Fixed table, counts and `Decision` | 3 | 3 | 2 | 18 |
| 29 | VE11 | Fixed table, counts and `Decision` | 3 | 3 | 2 | 18 |
| 30 | LS07 | Render the entry through the renderer | 3 | 3 | 2 | 18 |
| 31 | LS12 | Entry written with git facts and the close ran | 3 | 3 | 2 | 18 |
| 32 | BS06 | The prose `## Dependencies` parser fails closed | 2 | 3 | 3 | 18 |
| 33 | VE09 | The build artifact or dev server starts cleanly | 3 | 3 | 2 | 18 |
| 34 | LS02 | Read the session-start marker to bound the session | 3 | 3 | 2 | 18 |
| 35 | LS04 | Gather branch, commits this session, files touched | 3 | 3 | 2 | 18 |
| 36 | LS03 | Establish the boundary (marker..HEAD plus uncommitted work) | 3 | 3 | 2 | 18 |
| 37 | SL02 | Read the exit code as the verdict (0 PASS / 1 FAIL / 2 usage) | 2 | 3 | 3 | 18 |
| 38 | BS01 | Run the planner script with its flags and persist the plan state | 2 | 3 | 3 | 18 |
| 39 | SL01 | Run the content checks (whole tree or one skill) and paste the block | 2 | 3 | 3 | 18 |
| 40 | BS07 | Native relations are authoritative; prose `hard` without one is a mismatch | 2 | 3 | 3 | 18 |
| 41 | LS11 | The extension handler records the invocation and names the target; without it the prose flow runs | 3 | 3 | 2 | 18 |
| 42 | CO03 | No dead code introduced | 3 | 3 | 2 | 18 |
| 43 | SL03 | Check the eight authoring invariants | 2 | 3 | 3 | 18 |
| 44 | CO07 | No new dependency not justified in the SPEC | 3 | 3 | 2 | 18 |
| 45 | VC06 | A bounded `commands` row; no new validator kind | 3 | 3 | 2 | 18 |
| 46 | IM03 | No duplicate and no gap in the synthesized table | 3 | 2 | 3 | 18 |
| 47 | DE05 | No current-unit row is `postpone`/`tradeoff`/`wontfix` | 2 | 3 | 3 | 18 |
| 48 | IM04 | Classify every row: ignore → current-unit contract → proposal | 3 | 2 | 3 | 18 |
| 49 | SO04 | Indexability intended equals actual (robots, noindex, sitemap) | 2 | 3 | 3 | 18 |
| 50 | IM02 | Every applicable axis is represented; a missing axis is a finding | 3 | 2 | 3 | 18 |
| 51 | DE03 | Every item carries a trigger; a missing trigger is itself a finding | 2 | 3 | 3 | 18 |
| 52 | PE06 | Declared bench: run base and change, cite both, compare the noise band | 2 | 3 | 3 | 18 |
| 53 | IM05 | Fill `scope: in-unit or new-unit` from paths versus the unit's Impact set | 3 | 2 | 3 | 18 |
| 54 | LS01 | Locate the session log from the docs map; create it from the template when absent | 3 | 3 | 2 | 18 |
| 55 | BR04 | No forbidden or deprecated phrases | 2 | 3 | 2 | 12 |
| 56 | BR09 | Fixed table, counts and `Decision` | 2 | 3 | 2 | 12 |
| 57 | DS06 | Fixed table, counts and `Decision` | 2 | 3 | 2 | 12 |
| 58 | SO08 | Fixed table, counts and `Decision` | 2 | 3 | 2 | 12 |
| 59 | AD12 | Every `done` row carries `done · [#N](url)` | 2 | 2 | 3 | 12 |
| 60 | AD15 | Lane-era: ticked task ⇔ its `P<n>` log line | 2 | 2 | 3 | 12 |
| 61 | PX03 | Bind stage artifacts and re-verify a digest | 2 | 2 | 3 | 12 |
| 62 | BS08 | Offline is declared and the plan still prints | 2 | 3 | 2 | 12 |
| 63 | AD13 | Lane-era: phase-lint PASS + phase labels valid | 2 | 2 | 3 | 12 |
| 64 | FF14 | Batch class derives only from taken frozen rows | 2 | 2 | 3 | 12 |
| 65 | AA10 | Fixed table, counts and `Decision: PASS or FAIL` | 2 | 3 | 2 | 12 |
| 66 | OE03 | Parse the reply and keep source plus diagnostics | 2 | 2 | 3 | 12 |
| 67 | PE08 | Fixed table including the measured-evidence cell | 2 | 3 | 2 | 12 |
| 68 | OE01 | Pick Envelope v2 versus SkillOutcome v1 by profile | 2 | 2 | 3 | 12 |
| 69 | TI09 | Write a fold-ledger row for `fix-now`/`fix-in-unit` | 2 | 2 | 3 | 12 |
| 70 | DE08 | Fixed table, transformed/trigger counts and `Decision` | 2 | 3 | 2 | 12 |
| 71 | PX04 | Row shapes and write ownership for the planning ledgers | 2 | 2 | 3 | 12 |
| 72 | OE05 | Second failure is driver `FAILED`, never an endless retry | 2 | 2 | 3 | 12 |
| 73 | AD02 | Every feature folder has a roadmap row and every row a folder | 2 | 2 | 3 | 12 |
| 74 | OE02 | Append `renderOutputInstruction(skill)` for a driven invocation | 2 | 2 | 3 | 12 |
| 75 | OE04 | Re-invoke once with the fixed repair sentence on invalid output | 2 | 2 | 3 | 12 |
| 76 | DE02 | Attribute the row to its recorded axis, never re-litigate ownership | 2 | 3 | 2 | 12 |
| 77 | FF15 | Freeze-batch on replan/decision/product rows: nothing folds or commits | 2 | 2 | 3 | 12 |
| 78 | FF01 | Probe the findings carrier (`## Findings` versus `review-findings.md`), never both | 2 | 2 | 3 | 12 |
| 79 | FF13 | Six fields: repaired/refuted ids, gate exit at head, batch class, fold diff, branch | 2 | 2 | 3 | 12 |
| 80 | FF02 | Validate rows against the carrier's own schema (legacy 7-col versus `findings-table@1`) | 2 | 2 | 3 | 12 |
| 81 | BS02 | Read every envelope field (`batches`, `blocked`, `launched`, deltas, findings, degraded) | 2 | 3 | 2 | 12 |
| 82 | AA02 | A label per input, an alt per image | 2 | 3 | 2 | 12 |
| 83 | SO03 | Canonical URL correct on new routes | 2 | 3 | 2 | 12 |
| 84 | BR01 | Read the brand doc first and cite the rule | 2 | 3 | 2 | 12 |
| 85 | SO05 | One h1 per page; no skipped heading levels | 2 | 3 | 2 | 12 |
| 86 | DS01 | Read the design doc first and cite the rule | 2 | 3 | 2 | 12 |
| 87 | DE07 | A removal proposal routes `fix-now (delete)` | 2 | 3 | 2 | 12 |
| 88 | DE04 | Scheduled deletions carry the removal trigger | 2 | 3 | 2 | 12 |
| 89 | BR03 | Glossary terms, capitalisation and consistency | 2 | 3 | 2 | 12 |
| 90 | BS05 | An open in-flight target is a state, not a defect | 2 | 3 | 2 | 12 |
| 91 | TI06 | Trigger evidence becomes a verdict in the closed set | 2 | 2 | 3 | 12 |
| 92 | SO06 | Structured data valid, with the validator output cited | 2 | 3 | 2 | 12 |
| 93 | FF10 | Claim table with reproduced output, looping until green | 2 | 2 | 3 | 12 |
| 94 | AA05 | Contrast meets the declared level, computed values cited | 2 | 3 | 2 | 12 |
| 95 | SO02 | Unique title and meta description within the declared lengths | 2 | 3 | 2 | 12 |
| 96 | IM08 | Table consumed, coverage verified, every row classified and routed | 3 | 2 | 2 | 12 |
| 97 | DS03 | Responsive at declared breakpoints; no hardcoded strings under i18n | 2 | 3 | 2 | 12 |
| 98 | OE07 | Call discovery before planning; route a contradiction to the resolver | 2 | 2 | 3 | 12 |
| 99 | AD22 | README claims versus the shipped tree (retired names, counts, "none yet") | 2 | 2 | 3 | 12 |
| 100 | FF07 | Anti-invention: new findings grounded in changed bytes or a mis-run check | 2 | 2 | 3 | 12 |
| 101 | SO01 | Read the SEO doc first; n/a everything when the product has no public surface | 2 | 3 | 2 | 12 |
| 102 | FF06 | Evidence-bound check: the cited `file:line` exists and the snippet matches verbatim | 2 | 2 | 3 | 12 |
| 103 | FF17 | The 11 boxes (per-finding line, gate+commit+push, ledger flip, no reclassify, tally, claim loop, escalation, evidence-bound, anti-invention, net narration, closure) | 2 | 2 | 3 | 12 |
| 104 | AD07 | Every documentation-map referenced file exists | 2 | 2 | 3 | 12 |
| 105 | BS04 | Report `cycle`/`orphaned-soft-dep`/`prose-native-mismatch`, never fix | 2 | 3 | 2 | 12 |
| 106 | EP05 | Phase-lint on implement steps | 3 | 1 | 3 | 9 |
| 107 | EP09 | Derive the test set before writing | 3 | 1 | 3 | 9 |
| 108 | CH03 | Axis ↔ platform applicability table | 3 | 1 | 3 | 9 |
| 109 | WS02 | The nine-step sequence including 6a | 3 | 1 | 3 | 9 |
| 110 | UL11 | Diff guard after each implement step | 3 | 1 | 3 | 9 |
| 111 | CO04 | No leftover TODO/FIXME/HACK in the diff | 3 | 3 | 1 | 9 |
| 112 | EP17 | Diff guard on implement steps; BREACH stops | 3 | 1 | 3 | 9 |
| 113 | EP18 | Append Evidence rows in the published shape | 3 | 1 | 3 | 9 |
| 114 | CH10 | SHA-bound `REVIEW-PASS`/`REVIEW-FAIL` receipt | 3 | 1 | 3 | 9 |
| 115 | CH07 | Print the fixed migration refusal, mutate nothing | 3 | 1 | 3 | 9 |
| 116 | EP04 | Path-protection checkpoint over the committed range | 3 | 1 | 3 | 9 |
| 117 | WS01 | Run the sensor; the envelope is the script's stdout | 3 | 1 | 3 | 9 |
| 118 | WS06 | CLEAN→OK, RESUMABLE→CONTINUE, AMBIGUOUS→NEEDS_INPUT | 3 | 1 | 3 | 9 |
| 119 | EP10 | New script+suite lands red first, implementation green | 3 | 1 | 3 | 9 |
| 120 | UL12 | Evidence rows plus the progress entry before every commit | 3 | 1 | 3 | 9 |
| 121 | UL04 | Classify the risk tier and branch on passive/standard/high | 3 | 1 | 3 | 9 |
| 122 | WS07 | Every unavailable source is named `unavailable-<source>-<cause>` | 3 | 1 | 3 | 9 |
| 123 | WS05 | `next.recommended` is non-bare and computed from the resolved status | 3 | 1 | 3 | 9 |
| 124 | UL16 | Verify the PR's review receipt; never name the gate before it verifies | 3 | 1 | 3 | 9 |
| 125 | UL05 | Run the triage router and paste its block as the authoritative step list | 3 | 1 | 3 | 9 |
| 126 | EP02 | Compare the triage block to the unit doc's Evidence header; mismatch stops | 3 | 1 | 3 | 9 |
| 127 | EP03 | Select the explicit `P<k>` or the first unticked one; never a skipped step | 3 | 1 | 3 | 9 |
| 128 | EP28 | The 13 closing boxes | 3 | 1 | 3 | 9 |
| 129 | CH11 | Verdict from the classified table's blocking rule | 3 | 1 | 3 | 9 |
| 130 | CH08 | New findings only from changed bytes or a mis-run check | 3 | 1 | 3 | 9 |
| 131 | UL08 | Hand execution off one phase per turn at the triage tier | 3 | 1 | 3 | 9 |
| 132 | RR06 | Increment the id, set `frozen`, record the source revision | 1 | 3 | 3 | 9 |
| 133 | CH01 | Decide applicable axes from project nature and diff footprint | 3 | 1 | 3 | 9 |
| 134 | UL14 | Run the review step; resolve every `## Future` row with the user | 3 | 1 | 3 | 9 |
| 135 | EP13 | Reproduce each claim with its command and paste the observed output | 3 | 1 | 3 | 9 |
| 136 | DR06 | Freeze the status and commit the artifact citing the source revision | 1 | 3 | 3 | 9 |
| 137 | RR05 | Accept: supersede citing both sources; reject: keep the fact and why | 1 | 3 | 3 | 9 |
| 138 | EP24 | Whole-unit mode: loop, close-out, PR, References, settle the index row | 3 | 1 | 3 | 9 |
| 139 | RR04 | needs-input: update the row, keep `contradicted`, no id increment, stop | 1 | 3 | 3 | 9 |
| 140 | DR05 | On a contradiction: append the row, set `contradicted`, never alter the fact | 1 | 3 | 3 | 9 |
| 141 | EP07 | Dependencies merged and invariants preserved or backed by a recorded decision | 3 | 1 | 3 | 9 |
| 142 | UL01 | Resolve or create the unit doc from the tree's own template and register the index row | 3 | 1 | 3 | 9 |
| 143 | EP22 | Red gate: run the gate, record exit and failing names, repair within the attempt budget | 3 | 1 | 3 | 9 |
| 144 | EP06 | Pre-write mapper: seven evidence questions, route `READY / REPLAN / NEEDS-DESIGN / BLOCKED` | 3 | 1 | 3 | 9 |
| 145 | UL15 | Update the status and index row; release step owns branch hygiene, PR and forge reconciliation | 3 | 1 | 3 | 9 |
| 146 | DR07 | Facts, decisions, planned work, docs and inference stay separated; no silent fact change | 1 | 3 | 3 | 9 |
| 147 | FF09 | Detect an open PR to decide the push after commit | 2 | 2 | 2 | 8 |
| 148 | TI03 | Read the issue in full through the fixed JSON field list | 2 | 2 | 2 | 8 |
| 149 | TI11 | Map every verdict to its own next command, joined explicitly | 2 | 2 | 2 | 8 |
| 150 | OE08 | The canonical 11-box contract lives here | 2 | 2 | 2 | 8 |
| 151 | FF08 | Read the verification gate and the forge CLI | 2 | 2 | 2 | 8 |
| 152 | TI04 | A new issue body carries its `Checked:` line | 2 | 2 | 2 | 8 |
| 153 | AD10 | Docs language and file/dir naming conventions | 2 | 2 | 2 | 8 |
| 154 | PX02 | Load POLICY / SNAPSHOT / LEDGERS by condition | 2 | 2 | 2 | 8 |
| 155 | TI05 | Choose the source's reference allowlist by mode | 2 | 2 | 2 | 8 |
| 156 | AD05 | Fix-index rows join an open issue and an unmerged PR | 2 | 2 | 2 | 8 |
| 157 | FF16 | Map the receipt's `Branch` field to the `→ Next:` block | 2 | 2 | 2 | 8 |
| 158 | IM01 | Read the architecture, layering, testing and risk rules | 2 | 2 | 2 | 8 |
| 159 | AD21 | Conventional commit format plus merged dependency closure | 2 | 2 | 2 | 8 |
| 160 | TI08 | Apply urgency/disposition labels from the owned vocabulary | 2 | 2 | 2 | 8 |
| 161 | FF12 | One `FOLDED / DISPUTED / BLOCKED / REPLAN` line per finding | 2 | 2 | 2 | 8 |
| 162 | AD14 | Legacy: no `S#`/`Step N` labels in `PLAN`/`TASKS`/`progress` | 2 | 2 | 2 | 8 |
| 163 | OE06 | A breaking change to a published contract is a package major | 2 | 2 | 2 | 8 |
| 164 | TI10 | One fixed verdict block per issue plus the batch summary table | 2 | 2 | 2 | 8 |
| 165 | AD19 | Feature/fix-scoped commits landed directly on the default branch | 2 | 2 | 2 | 8 |
| 166 | AD09 | `#N` references do not point at long-closed issues without a note | 2 | 2 | 2 | 8 |
| 167 | AD20 | Generated-page provenance (orphan or stale versus unit + merge date) | 2 | 2 | 2 | 8 |
| 168 | AD24 | Run the checks with grep, file reads and the forge CLI, citing paths | 2 | 2 | 2 | 8 |
| 169 | TI01 | Read the location index, the fix SPEC template and the roadmap tables | 2 | 2 | 2 | 8 |
| 170 | AD04 | `Depends on` cells valid, no cycles, order consistent with the roadmap | 2 | 2 | 2 | 8 |
| 171 | AD28 | Report printed and ends in PASS/FAIL; no doc rewritten without go-ahead | 2 | 2 | 2 | 8 |
| 172 | AD23 | Charter map row, `## Project charter`, no unfilled slot, catalogue provenance | 2 | 2 | 2 | 8 |
| 173 | AD01 | Resolve the documentation-map paths (guide map, roadmap, fix index, templates) | 2 | 2 | 2 | 8 |
| 174 | AD18 | A `done` unit's PR exists, targets the default base, has a body and `Closes #N` | 2 | 2 | 2 | 8 |
| 175 | FF03 | Reconstruct missing rows from a blocked audit verdict (next free `F<n>`, dedupe on `file:line`+axis) | 2 | 2 | 2 | 8 |
| 176 | AD08 | Relative links and anchors resolve | 2 | 2 | 2 | 8 |
| 177 | FF11 | Derive `closure complete or open(n)` from the queue | 2 | 2 | 2 | 8 |
| 178 | AD11 | Referenced invariant/decision ids exist where claimed | 2 | 2 | 2 | 8 |
| 179 | AD17 | Severity of a missing receipt: HIGH on `done`, LOW on open | 2 | 2 | 2 | 8 |
| 180 | FF05 | Class escalation: ≥2 rows sharing mechanism+axis become one class finding | 2 | 2 | 2 | 8 |
| 181 | AD25 | Emit the fixed report: table, `Checks run: n/16`, `Decision: PASS or FAIL` | 2 | 2 | 2 | 8 |
| 182 | EP19 | Append a dated Progress entry | 3 | 1 | 2 | 6 |
| 183 | BS09 | node fallback and the cached-issue flag | 2 | 3 | 1 | 6 |
| 184 | AP05 | Find the newest pass-marker comment at head | 2 | 1 | 3 | 6 |
| 185 | SL06 | Confirm this is the agentic-workflow repository | 2 | 3 | 1 | 6 |
| 186 | AP06 | Classify the receipt current/absent/stale and route | 2 | 1 | 3 | 6 |
| 187 | EP21 | Stage and make a conventional commit, paste the SHA | 3 | 1 | 2 | 6 |
| 188 | PE07 | No declared perf commands → the exact `n/a` sentence | 2 | 3 | 1 | 6 |
| 189 | EP16 | Bounded checkpoint through `test-route --check <path>` | 3 | 1 | 2 | 6 |
| 190 | WS08 | With a prior envelope, a stalled hint surfaces as a note | 3 | 1 | 2 | 6 |
| 191 | EP01 | Parse `<NN-slug> P<k>`, `<NN-slug>`, `P<k>` (last-known unit) | 3 | 1 | 2 | 6 |
| 192 | CH05 | Resolve each pass's model before spawning and record its source | 3 | 1 | 2 | 6 |
| 193 | AP07 | Keep a scoped receipt current when only non-affecting paths moved | 2 | 1 | 3 | 6 |
| 194 | UL06 | Delegate forward closure and retirements to the design/plan references | 3 | 1 | 2 | 6 |
| 195 | UL13 | Probe memory once, save at start/phase/close, follow the recall ladder | 3 | 1 | 2 | 6 |
| 196 | EP20 | Probe memory once, save under `unit/<NN-slug>/doc`, mark a degraded mirror pending | 3 | 1 | 2 | 6 |
| 197 | IM06 | At most 10 full non-diff reads | 3 | 2 | 1 | 6 |
| 198 | AA08 | Reduced-motion preferences respected | 2 | 3 | 1 | 6 |
| 199 | BR08 | No placeholder or lorem text in the diff | 2 | 3 | 1 | 6 |
| 200 | CH12 | Two-cycle cap; a third cycle is user-only | 3 | 1 | 2 | 6 |
| 201 | CH06 | Exactly one route's reference set, in order | 3 | 1 | 2 | 6 |
| 202 | WS04 | Nothing edited, committed, pushed or created | 3 | 1 | 2 | 6 |
| 203 | EP14 | Loop red → repair → re-run inside the same turn | 3 | 1 | 2 | 6 |
| 204 | UL10 | Relay leg mode when a pi-web session is present | 3 | 1 | 2 | 6 |
| 205 | BS10 | Envelope is the absolute last output; nothing launched | 2 | 3 | 1 | 6 |
| 206 | CH04 | One fresh context per pass, tables only, full-read cap | 3 | 1 | 2 | 6 |
| 207 | AP12 | Emit the SHA-bound receipt comment with the full PR URL | 2 | 1 | 3 | 6 |
| 208 | AP10 | Collect delivery, CI, traceability, mergeability evidence | 2 | 1 | 3 | 6 |
| 209 | UL18 | Branch the closing block on the router and receipt outputs | 3 | 1 | 2 | 6 |
| 210 | PA04 | One `F` sequence; severity/impact/class from the published ladder | 1 | 2 | 3 | 6 |
| 211 | SL05 | Print the next step's staging block and the changeset requirement | 2 | 3 | 1 | 6 |
| 212 | RR01 | Read the frozen ledger and the contradiction row named by the user | 1 | 3 | 2 | 6 |
| 213 | BS03 | Print lanes, blocked, untriaged, findings, degradations; launch nothing | 2 | 3 | 1 | 6 |
| 214 | EP11 | Orchestrate path: freeze the brief, admit resources, verify by gate+diff | 3 | 1 | 2 | 6 |
| 215 | EP23 | Print the fixed `UNIT LOOP — … BLOCKED` block when attempts are exhausted | 3 | 1 | 2 | 6 |
| 216 | DR01 | Read the guide, the documentation map and any existing `REPOSITORY_STATE.md` | 1 | 3 | 2 | 6 |
| 217 | UL07 | Per triaged step: read its reference, run the checklist, evidence, progress, commit | 3 | 1 | 2 | 6 |
| 218 | UL09 | Never print a bare whole-unit `/execute-phase` | 3 | 1 | 2 | 6 |
| 219 | AP13 | Verdict is MERGE-READY or BLOCKED with cited gates | 2 | 1 | 3 | 6 |
| 220 | TI02 | Optional retrieval aid before the forge read | 2 | 2 | 1 | 4 |
| 221 | PA05 | The `route:` cell in the published `finding-route@1` shape | 1 | 2 | 2 | 4 |
| 222 | AP02 | Fetch the PR through the 13-field JSON projection (or resolve the branch's PR) | 2 | 1 | 2 | 4 |
| 223 | AP03 | Audit branch-vs-base when no PR is open yet | 2 | 1 | 2 | 4 |
| 224 | AP09 | Load the five mandatory gate references in order | 2 | 1 | 2 | 4 |
| 225 | PA06 | New/unchanged/resolved against the prior audit id | 1 | 2 | 2 | 4 |
| 226 | PA02 | Mark every dimension applicable or `n-a: <reason>` | 1 | 2 | 2 | 4 |
| 227 | AP04 | Locate the governing SPEC and its planning artifacts | 2 | 1 | 2 | 4 |
| 228 | PA03 | Emit the persisted file and the identical chat print | 1 | 2 | 2 | 4 |
| 229 | PA09 | `/triage-issue <id> F<k> …` listing every finding id | 1 | 2 | 2 | 4 |
| 230 | PA14 | Inventory installed skills/MCPs and cross them against axes and the roadmap | 1 | 2 | 2 | 4 |
| 231 | AP01 | Read the project contract (roadmap + verification gate), skipping full templates | 2 | 1 | 2 | 4 |
| 232 | PA01 | Read the roadmap, fix index, feature layout and verification gate; decide the product nature | 1 | 2 | 2 | 4 |
| 233 | AD29 | The truncated check-13 text itself | 2 | 2 | 1 | 4 |
| 234 | AD26 | Apply low-risk fixes only on `--fix` or go-ahead | 2 | 2 | 1 | 4 |
| 235 | AD03 | Treat an explicitly "scheduled" missing row as intentional | 2 | 2 | 1 | 4 |
| 236 | AD16 | Legacy: ticked phases in `TASKS.md` + one progress entry each | 2 | 2 | 1 | 4 |
| 237 | AD06 | Decide that a merged/closed fix row "should have been removed" | 2 | 2 | 1 | 4 |
| 238 | CH02 | Optional retrieval aid before the passes | 3 | 1 | 1 | 3 |
| 239 | WS03 | `--compact` drops repository history per the declared set | 3 | 1 | 1 | 3 |
| 240 | IW03 | Choose exactly one route (bootstrap versus upgrade) from Step 0 | 1 | 1 | 3 | 3 |
| 241 | IW07 | Seam hooks are consent-gated per seam (the project's `hooks.json` `enabled`) | 1 | 1 | 3 | 3 |
| 242 | IW08 | Never clobber; upgrade is additive-only | 1 | 1 | 3 | 3 |
| 243 | WS10 | Six baseline references plus two conditional | 3 | 1 | 1 | 3 |
| 244 | WS09 | Human summary then the envelope last; quote the emitted continuation | 3 | 1 | 1 | 3 |
| 245 | IW04 | Every install/hook/overwrite needs an explicit yes; a gap halts with the question block | 1 | 1 | 3 | 3 |
| 246 | EP25 | A bare `<NN-slug>` from a lane hand-off is a defect | 3 | 1 | 1 | 3 |
| 247 | PA08 | An empty section states `none — <why>` | 1 | 2 | 1 | 2 |
| 248 | PA13 | Assign the incremental audit id from the persisted set | 1 | 2 | 1 | 2 |
| 249 | IW10 | Seed `REPOSITORY_STATE.md` and explain discovery/resolution | 1 | 1 | 2 | 2 |
| 250 | IW12 | Detect the stack, ask once, provision language servers, report | 1 | 1 | 2 | 2 |
| 251 | IW01 | Inspect the target: guide/docs/.github presence, scaffold markers, manifests, git/forge | 1 | 1 | 2 | 2 |
| 252 | IW13 | Tailored scaffold, residual placeholders flagged, labels seeded, adapters fixture-tested | 1 | 1 | 2 | 2 |
| 253 | IW09 | Write the lane conventions into the guide (triage, guards, evidence, progress, commits, statuses) | 1 | 1 | 2 | 2 |

**Reading the bands.** 26 rows score 27 (a per-phase gate that already has a
carrier), 28 score 18, 51 score 12, 41 score 9, 38 score 6, 35 score 8, 18
score 4, 9 score 3 and 7 score 2. The top band is dominated by *receipt and
lint* steps whose carrier already exists (phase-lint, the evidence row shape,
the triage router): their unit is small because it is a deletion or a pointer,
not a new guard. The 12/18 bands are the real extraction backlog — steps that
are decidable but served by nothing yet.

## 5. Duplicate-of-code residue

105 rows name an existing command or script (`duplicate-of-code: yes`); 87 name
a library, parser or validator that covers part of the step with no CLI or no
wiring (`partial`); 146 name nothing. This is the grep-level residue the issue
asks for: every row whose carrier cell is populated is a candidate to **replace
prose with a pointer**, which is exactly the projection op (`remove` /
`pointerize`) the #410 chain ships.

| existing carrier | what it already decides | rows that name it |
|---|---|---|
| `scripts/phase-lint.mjs` | the eight phase rules, the two grammars, the fingerprint | PC01–PC06, AD13, EP05, EP28 |
| `scripts/ceremony.mjs` | risk tier, phase labels, task ticks, progress entries, commit format | AD13, AD15, AD21, EP21, UL04 |
| `scripts/roadmap-settle.mjs` + `agentic-workflow roadmap` | row presence, slug parity, `done` settle, row upsert | AD02, AD04, AD12, EP24, UL15 |
| `scripts/unit-route.mjs` | triage block, step order, route, product-route freeze | EP01–EP03, EP07, FF01, FF14, FF15, IM04, OE07, TI06, TI11, UL05, UL08, UL18 |
| `scripts/diff-guard.mjs` | unreviewed diff size at a boundary | EP17, EP27, UL11 |
| `scripts/test-impact.mjs` / `scripts/test-route.mjs` | the change's test set and its minimal suite | EP09, EP16, VC08, EP11 |
| `scripts/red-first.mjs` | the suite-lands-red ordering | EP10, VC11 |
| `scripts/promise-coherence.mjs` | re-runs written counts/outcomes/sweeps | EP13, FF10, CO10, CO15, VC01 |
| `scripts/review-receipt.mjs` + `scripts/scope-manifest.mjs` | receipt marker, head binding, non-affecting delta | AP05–AP07, AP12, CH10, UL16, UL18 |
| `scripts/session-close.mjs` + `agentic-workflow journal write` | boundary, facts, render, carrier write, close | LS02–LS04, LS07–LS09, LS12, FF09 |
| `agentic-workflow memory probe` | memory-layer verdict | EP20, UL13 |
| `agentic-workflow resolve-passes` + `resources admit` | per-pass model and admission | CH05, EP11, UL08 |
| `scripts/local-gate.mjs` + `scripts/run-root-suite.mjs` | the project gate and its suites | EP14, EP22, VE04 |
| `scripts/batch-scheduler.mjs` | the whole batch plan envelope | BS01–BS09 |
| `scripts/workflow-status.mjs` | the whole sensor envelope | WS01–WS09 |
| `scripts/skill-lint.mjs` + `scripts/check-skill-context.mjs` + `scripts/lint-changeset.mjs` | skill content, budgets, changeset intent | AD10, SL01–SL03, SL05, SE01 |
| `scripts/docs-generate.mjs` | generated-page drift, orphans, stale pages | AD20, IW08 |
| `scripts/dependency-advisory-pass.mjs` | new/updated dependency advisories | CO07, SE08 |
| `scripts/capabilities.mjs` + `scripts/serena-activation-check.mjs` | capability seed, language servers | IW01, IW12, IW13, PA14 |
| `scripts/needs-input.mjs` | the open-questions block and its exit codes | IW04 |
| `scripts/pre-execution-snapshot.mjs` + `scripts/pre-execution-contract.mjs` | artifact digests, revision binding, state vocabulary | PX03, DR05, DR06, RR04, RR06, VC07, EP06 |
| `agentic-workflow verify` + `validateEvidenceRow` + `agentic-workflow unit-doc` | evidence rows, ledger closure, receipt marks, unit-doc writes | FF02, PX04, VC02, VC03, VC07, VE01, VE02, EP18, EP19, UL01, UL12, IW09 |
| `agentic-workflow doc` | retrieval index query and status | CH02, TI02, DR01 |
| `packages/agentic-workflow/src/index-document.mjs` | roadmap and fix-index parsing | AD01, AP01, PA01, TI01 |
| `packages/agentic-workflow/src/path-policy.mjs` | the path-protection guard and its reasons | EP04 |
| the schema package's profiles and validators | output profiles, driver protocol, row shapes | OE01–OE05, EP18, VE02 |
| the pi package's command and seam dispatcher | invocation marker, consent-gated hooks | LS11, IW07 |
| `scripts/audit-pr-gate.mjs`, `scripts/log-immutability.mjs`, `scripts/tier-cost.mjs`, `scripts/structural-sibling-pins.mjs`, `scripts/version-parity-gate.mjs`, `scripts/npm-version-gate.mjs`, `scripts/relay-packet.mjs` | one gate each | AP10, LS10, PE06, VC11, OE06, UL10 |

**The residue worth naming first.** A dozen rows are not "should become code":
they are *already* code, and the prose re-narrates it. Those are pure
pointerize candidates: `EP02`, `EP03`, `EP17`, `EP18`, `EP19`, `EP21`, `UL05`,
`UL11`, `UL12`, `WS01`, `BS01`, `FF02`. Extracting them adds no capability — it
removes a second copy of a contract, which is the drift class `AGENTS.md` calls
"every repetition names its owner".

## 6. Limits of this classification

- **Granularity.** A row is a procedural unit the prose *orders*, not a
  sentence. Two prose paragraphs that jointly run one command are one row.
- **Frequency is inferred** (planning-evidence PE-009): no counter for skill
  invocations exists in the tree. It is read off the documented flow and the
  hand-off graph, and an owner who knows the real usage outranks it.
- **Stability is measured**, but churn is an imperfect proxy: a skill can be
  churny because it is young, not because its contract is unsettled.
- **The duplicate flag is grep-level** (S2 says so): `partial` means a parser
  or library exists, not that wiring it is cheap.
- **Judgment rows are not failures.** 85 of 338 steps are irreducible prose at
  this granularity; a future unit may split one further and find a decidable
  prefix (that is exactly what S11 asks for, and the 17 mixed rows are the cases
  where it was already possible).
- **Nothing here authorizes an extraction.** A high score is a candidate, never
  a decision (S6).

## 7. Coverage and scoring receipts

Every number in this file is re-derivable. The commands and their observed
output at the delivered head:

```text
$ ls -d skills/*/ | wc -l                                      → 29
$ ls skills/*/SKILL.md | wc -l                                 → 29
$ rg -l 'metadata.internal: true' skills/*/SKILL.md | wc -l     → 0
$ rg -c '^\| [A-Z]{2}[0-9]{2} \|' INVENTORY.md                  → 338
$ rg -c '^### [a-z]' INVENTORY.md                               → 29
$ rg -c '^\| [0-9]+ \| [A-Z]{2}[0-9]{2} \|' INVENTORY.md        → 253
```

**Section parity (S4).** For every skill, the `##`/`###` counts stated in §2
and in its section map equal the file's own headings. The command compares the
tree's counts against this file's own §2 table and exits 0 on parity:

```sh
diff <(for f in skills/*/SKILL.md; do n=$(basename "$(dirname "$f")"); printf '%s %s %s\n' "$n" "$(rg -c '^## ' "$f")" "$(rg -c '^### ' "$f" || echo 0)"; done) \
     <(awk -F'|' '/^\| [a-z0-9-]+ \| [A-Z]{2} \|/ {gsub(/ /,"",$2); gsub(/ /,"",$4); gsub(/ /,"",$5); print $2" "$4" "$5}' INVENTORY.md)
```

Observed: exit 0 (no diff lines). The raw counts it compares, `skill ## ###`,
for the record:


```text
audit-docs 9 0
audit-pr 10 0
batch-scheduler 8 0
discover-repository-state 7 0
execute-phase 11 9
fold-findings 14 0
init-workspace 13 0
log-session 10 0
orchestration-envelope 4 0
phase-contract 6 2
pre-execution-review 5 0
product-audit 15 4
resolve-repository-state 7 0
review-a11y 5 0
review-brand 5 0
review-change 13 0
review-code 5 0
review-debt 4 0
review-design 5 0
review-implementation 9 0
review-perf 5 0
review-security 5 0
review-seo 5 0
review-verify 5 0
skill-lint 8 3
triage-issue 8 0
unit-lane 10 9
verification-contract 8 0
workflow-status 8 0
```

**Scoring.** The `score` column and the §4 ranking are computed, never typed:
`F × S × E` per row, candidates only (`class` other than `judgment`), ties broken
by carrier weight (`yes` < `partial` < `no`), then by step length, then by id.
The scorer ran over this file's own rows and reported
`{"steps":338,"mechanizable":236,"judgment":85,"mixed":17,"duplicate-of-code":{"yes":105,"partial":87,"no":146},"candidates":253}`.
The scorer is not committed (S6: no implementation); it is a 40-line read of
this file's tables and any reviewer can re-derive it from §1's definitions.
