# fix/54-triage-disposition-labels

## Goal

Close the untriaged-issue detection gap flagged in `#54`: `workflow-status`'s
untriaged-backlog step (`skills/workflow-status/SKILL.md`, step 11) currently
counts an open issue as *triaged* on the strength of a `VERDICT:` **comment
string** — text anyone with comment access can hand-author, never actually
requiring a real `/triage-issue` run. The repo's one unforgeable triage signal —
a GitHub **label**, appliable only by a triage+-permission actor — already exists
for this (`postponed` / `promoted` / `wontfix` labels are present, and
`workflow-status` step 11 *already reads for them*), but `triage-issue` never
writes them, so the label path is dormant and the spoofable comment-text path is
the sole operative one. This fix makes `triage-issue` the sole owner and writer
of those disposition labels — applied on the verdict, exactly as it already does
for its urgency labels — and reframes `workflow-status`'s check to treat the
label as authoritative with the `VERDICT:` comment as an explicit backward-compat
fallback. It cannot wait for a feature cycle: it's a small, tracked hardening of
a just-landed field (`detail.untriaged_issues`, fix `#52`), and the issue's own
trigger — *"revisit when `triage-issue` is changed to add a disposition label"* —
is being consciously activated now.

## Issue

`#54` — `workflow-status`: untriaged-issue detection trusts `VERDICT:` comment
text, not an actor/label check. The PR must close it via `Closes #54`.

> **Provenance note.** `#54` is a standing `triage-issue` **postpone** verdict
> (labeled `postponed`, re-confirmed 2026-07-13). Drafting this SPEC is the
> deliberate activation of its first trigger ("`triage-issue` gains a disposition
> label"). Scope confirmed with the user: **fix now, cross-skill,
> backward-compatible** (label authoritative, `VERDICT:` text kept as a legacy
> fallback) — the stricter label-only posture is deferred to the issue's second
> trigger (exploitation evidence).

## Branch

`fix/54-triage-disposition-labels`

## Depends on

None. `#54` is the only open issue; no open PRs. Its origin fix `#52`
(PR #53) and the parallel fix `#51` (PR #55) that cross-referenced it are both
merged — no live dependency remains.

## Root cause

Two halves of one gap, introduced when fix `#52` (PR #53) added the
`detail.untriaged_issues` field:

- **`skills/triage-issue/SKILL.md`** — the skill is the "sole owner and sole
  writer" of the workflow's labels (`skills/triage-issue/SKILL.md:47-88`), but
  that ownership covers only the **urgency** labels `urgent` / `fix-next`,
  applied *only* on a `fix-now + high-severity` verdict. On its `postpone` /
  `promote` / `wontfix` verdicts it posts a dated comment and applies **no**
  label. So no unforgeable, actor-gated signal marks those dispositions.
- **`skills/workflow-status/SKILL.md`** — step 11 (lines 161-175) marks an open
  issue *untriaged* iff it has **no dated `VERDICT:` comment AND no**
  `wontfix` / `postponed` / `promoted` disposition label. The label branch was
  written in anticipation but is **dormant** (nothing writes those labels), so
  the `VERDICT:`-comment-text match — spoofable by any commenter — is the only
  operative triaged-signal. Worst case: an issue with hand-authored `VERDICT:`
  text is silently excluded from `detail.untriaged_issues.count`, under-reporting
  the backlog.

## Detected in

`review-change` finding during fix `#52` (2026-07-12), recorded in
`docs/fix/52-workflow-status-envelope-hardening/SPEC.md` → *Decisions made during
drafting* (*"`detail.untriaged_issues` trusts the `VERDICT:` comment's presence,
not an actor check — accepted, not fixed"*), then filed as `#54` and postponed
(re-confirmed 2026-07-13).

## Scope

### In scope

1. **`skills/triage-issue/SKILL.md` — own & apply disposition labels.**
   - Add a **"Disposition label vocabulary (owned here)"** subsection parallel to
     the existing "Urgency label vocabulary (owned here)" one, declaring
     `triage-issue` the sole owner/writer of `postponed` / `promoted` / `wontfix`
     (color + one-line meaning each; `wontfix` reuses GitHub's default label).
   - State the **same injection-safety invariant** as for urgency labels: applied
     only by this skill, only on the matching verdict reached by the evidence-based
     Process, never a parse of title/body/comment text; label mutation is
     triage+-permission-gated, which is exactly why it is unforgeable and why
     `workflow-status` may trust it.
   - **Apply-on-verdict** (mirroring the urgency-label mechanics): on a `postpone`
     verdict apply `postponed`; on `promote` apply `promoted`; on `wontfix` apply
     `wontfix` — each via create-if-missing (`gh label create … || proceed`) then
     `gh issue edit <N> --add-label <name>`; the dated verdict comment states the
     label applied (or, if the actor lacks triage+ permission and the call fails,
     states that failure explicitly — the run is unaffected either way).
   - Update Process step 3 (verdict routing), step 5 (report), and the fixed
     verdict block's `Action taken:` line so the disposition label is part of each
     terminal verdict, not a separate ambiguous mutation.
   - `fix-now` behavior is **unchanged** (keeps its urgency-label carve-out; it
     routes to a fix and gets no disposition label — see *Decisions*).
2. **`skills/workflow-status/SKILL.md` — label-authoritative untriaged check.**
   Reword step 11 so the disposition label is the **authoritative** triaged
   signal and the `VERDICT:` comment is an explicit **legacy fallback** (issues
   triaged before disposition labels existed); note the residual (a hand-authored
   `VERDICT:` comment on a never-triaged issue can still under-count) as accepted
   per the backward-compatible choice. Logic stays "triaged iff label **or**
   comment"; the change is framing + the residual note — no field/schema change
   (`detail.untriaged_issues` shape is untouched).
3. **`docs/workflow/ISSUE_WORKFLOW.md` + `.es.md` — Stage 5 coherence.** Note that
   disposition labels (like urgency labels) are applied as part of the verdict —
   not the "never change GitHub state without confirmation" ambiguous class.
4. **Version + doc sync.** Bump each touched skill and update
   `CHANGELOG.md` / `CHANGELOG.es.md` / `README.md` / `README.es.md` via
   `bump-skill`, per phase (recommended: `triage-issue` **minor** — new
   capability; `workflow-status` **patch** — wording refinement).

### Out of scope

- **Making `workflow-status` label-only (dropping the `VERDICT:`-text fallback).**
  The stricter, fully-injection-proof posture. Deferred to `#54`'s **second**
  trigger (exploitation evidence). If pursued, it becomes its own follow-up fix.
- **A `fix-now` / `triaged` disposition label.** `workflow-status` step 11 reads
  only the three terminal-disposition labels; a fix-now issue is covered as
  triaged via its fix-index route + `VERDICT:` comment. Adding a generic
  `triaged` label is a separate capability — not filed unless a need surfaces.
- **Any change to `detail.urgent` or the urgency-label path.** The injection-safety
  invariant there is untouched.
- **The `orchestration-envelope` schema / package.** No envelope field shape
  changes; the schema package is not touched.

## Rules that must never be violated

- **Injection-safety invariant (extended, never relaxed):** disposition labels,
  like urgency labels, are applied **only** by `triage-issue`, **only** on the
  matching evidence-based verdict — **never** a parse of issue title/body/comment
  text. Label mutation stays triage+-permission-gated.
- **`detail.urgent` stays labels-only, presence-only** — this fix does not touch
  it.
- **`triage-issue` is the sole owner/writer of every workflow label**; no other
  skill defines, spells, or applies the disposition labels — `workflow-status`
  only *reads* them (presence-only).
- **Skill bodies stay stack/architecture-agnostic**; no product/stack/framework
  names leak in.
- **Docs language English** for skill bodies + this SPEC; the human tutorial doc
  (`ISSUE_WORKFLOW`) is kept **EN + ES in sync in the same change**.
- **Every skill change is version-bumped + changelogged** (`bump-skill`).
- **Phases are `P1..Pn`; the final phase is `Hardening & PR`** with its template
  tasks kept literally.

## Operational risks

- `triage-issue` now performs a `gh label create` + `gh issue edit --add-label`
  on three additional verdict paths — the **same forge-mutation class** it already
  runs for urgency labels, with the same failure handling (actor lacks triage+
  permission → the create/add fails, the run states it and continues; no
  disposition is ever asserted without a label actually landing). Batch triage
  applies the label per-issue — no cross-issue coupling.
- No scheduled-job / queue / cache-invalidation / schema interactions. Concurrency:
  none (single sequential label edit per verdict).

## Security risks

- **Primary improvement:** after this fix, a real `/triage-issue` run always lands
  an unforgeable, triage+-gated disposition label, so the workflow's own triage
  outputs become label-backed and spoof-proof going forward.
- **Accepted residual (backward-compatible choice):** `workflow-status` still
  honors a `VERDICT:` **comment** as a legacy triaged-signal for issues triaged
  before labels existed, so a hand-authored `VERDICT:` comment on a
  never-triaged issue can still under-count the backlog. This is a **count
  under-report only** — no privilege escalation, no envelope content injection,
  `detail.urgent` untouched. Revisit → `#54`'s second trigger (exploitation
  evidence) → the out-of-scope label-only posture.
- No secrets / PII / webhooks / rate-limit surfaces touched.

## Compliance touchpoints

n/a — no data-retention, regional, or consumer-protection rules apply to skill
documentation artifacts.

## Affected docs

- `docs/workflow/ISSUE_WORKFLOW.md` — Stage 5 (disposition-label-on-verdict note).
- `docs/workflow/ISSUE_WORKFLOW.es.md` — same, kept in sync.
- `CHANGELOG.md` / `CHANGELOG.es.md` — one row per bumped skill (`bump-skill`).
- `README.md` / `README.es.md` — skill/version tables (`bump-skill`).

Each is an acceptance criterion below.

## Observability

No runtime metric/log — the artifacts are skills + docs. "Live and healthy" is
confirmed by: (a) a `postpone`/`promote`/`wontfix` `/triage-issue` run now
applying the matching label to the issue (visible in `gh issue view <n> --json
labels`); (b) `workflow-status` step 11 keying on that label; (c) `npx skills add
. --list` still discovering every skill. Degradation would be silent
(under-counted backlog) exactly as today — the residual is documented, not
alarmed.

## Acceptance

- [ ] `skills/triage-issue/SKILL.md` has a **"Disposition label vocabulary (owned
      here)"** subsection declaring `postponed` / `promoted` / `wontfix` with
      color + meaning, and the same injection-safety invariant wording as the
      urgency section. *(grep: "Disposition label vocabulary")*
- [ ] `triage-issue` applies the matching label on `postpone` / `promote` /
      `wontfix` via create-if-missing + `gh issue edit --add-label`, stated in the
      dated comment (or the permission-failure stated explicitly). *(grep for the
      three label names + `--add-label` in the apply-on-verdict prose)*
- [ ] The fixed verdict block's `Action taken:` line references the disposition
      label applied.
- [ ] `fix-now` verdict prose is unchanged (no disposition label added to it).
- [ ] `skills/workflow-status/SKILL.md` step 11 states the disposition label is
      the **authoritative** triaged signal and the `VERDICT:` comment is a
      **legacy fallback**, with the accepted-residual note; the emitted field
      shape `detail.untriaged_issues: {count, oldest_open}` is unchanged. *(grep:
      "legacy fallback" or equivalent near step 11)*
- [ ] `docs/workflow/ISSUE_WORKFLOW.md` **and** `.es.md` note disposition-label
      application on verdict (EN + ES in sync).
- [ ] `triage-issue` and `workflow-status` `version:` bumped; matching rows added
      to `CHANGELOG.md` and `CHANGELOG.es.md`; both README skill/version tables
      updated (`bump-skill`).
- [ ] Gate green: `npx skills add . --list` exits 0 and lists every skill; no
      stack/real-project reference leaked into the edited skill bodies; all
      cross-references resolve.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here.

### P1 — `triage-issue`: own & apply disposition labels

- [ ] Add the **"Disposition label vocabulary (owned here)"** subsection
      (parallel to the urgency one): `postponed` (`#BFD4F2`), `promoted`
      (`#C2E0C6`), `wontfix` (GitHub default) — each with a one-line meaning.
- [ ] State the injection-safety invariant for these labels verbatim-parallel to
      the urgency invariant (applied only here, only on the matching
      evidence-based verdict, never a text parse; triage+-permission-gated).
- [ ] Add apply-on-verdict prose: `postpone`→`postponed`, `promote`→`promoted`,
      `wontfix`→`wontfix`, each via `gh label create … || proceed` +
      `gh issue edit <N> --add-label <name>`, the dated comment stating the label
      (or the permission-failure explicitly).
- [ ] Update Process step 3 (verdict routing) and step 5 (report) and the fixed
      verdict block's `Action taken:` line to include the disposition label; leave
      `fix-now` behavior unchanged.
- [ ] Bump `triage-issue` `version:` (minor) + `CHANGELOG.md`/`.es.md` rows +
      README tables via `bump-skill`.
- [ ] Gate: `npx skills add . --list` exits 0; no stack/real-project leak in the
      edited body.

### P2 — `workflow-status` label-authoritative check + tutorial coherence

- [ ] Reword `skills/workflow-status/SKILL.md` step 11: disposition label =
      authoritative triaged signal; `VERDICT:` comment = explicit **legacy
      fallback**; add the accepted-residual note. Do **not** change the emitted
      `detail.untriaged_issues` field shape.
- [ ] Update `docs/workflow/ISSUE_WORKFLOW.md` Stage 5 with the
      disposition-label-on-verdict note; mirror it into
      `docs/workflow/ISSUE_WORKFLOW.es.md` (reciprocal-link parity intact).
- [ ] Bump `workflow-status` `version:` (patch) + `CHANGELOG.md`/`.es.md` rows +
      README tables via `bump-skill`.
- [ ] Gate: `npx skills add . --list` exits 0; EN/ES `ISSUE_WORKFLOW` in sync; no
      leak in the edited body.

### P3 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #54`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #54` and push

## Testing

No application build in this repo. The gate is: `npx skills add . --list` exits 0
and discovers every skill (markdown well-formed, cross-references resolve); a
stack/real-project leak grep over the two edited skill bodies finds nothing; EN/ES
`ISSUE_WORKFLOW` parity holds. Layer: documentation/architecture-level — the
acceptance greps above pin the required content. End-to-end behavioral
confirmation (a live `/triage-issue` postpone run actually applying `postponed`)
is inherently manual/forge-side and cannot be unit-tested here; the grep-checkable
skill prose is the committed proof.

## Rollback

`git revert` the PR merge commit (single revert of the squash/merge commit) — or,
pre-merge, delete the branch. No data-side cleanup: the three labels already
existed before this fix (create-if-missing is a no-op here), so no orphaned label
state; no schema/migration; `detail.untriaged_issues` shape unchanged. Nothing is
lost on rollback beyond the doc/skill edits themselves.

## Status

`pending`
