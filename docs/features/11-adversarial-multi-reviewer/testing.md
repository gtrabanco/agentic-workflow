# 11 — adversarial-multi-reviewer · testing

Documentation/skills feature — there is no application build. "Green" is the
repo-verification gate (CLAUDE.md → Verification): the AC grep commands pass,
skills discovery is intact, markdown is well-formed, and no stack/real-project
references leaked. No unit/integration test code is added.

Command-checkable criteria are the command to run (verify by running, not by
judging prose); genuinely judgement-only criteria are labelled `read-verified`.

## Gate — run all, from repo root

```sh
# AC1 — flag exists
grep -q -- "--adversarial" skills/review-change/SKILL.md

# AC2 — three spawn tiers
grep -qi "subagent" skills/review-change/SKILL.md
grep -qi "headless" skills/review-change/SKILL.md
grep -qi "sequential\|fresh conversation" skills/review-change/SKILL.md

# AC3 — merge/dedupe by file:line
grep -qi "dedup\|deduped\|deduplicat" skills/review-change/SKILL.md
grep -qi "file:line" skills/review-change/SKILL.md

# AC4 — default OFF + auto-recommend for L/sensitive
grep -qi "default off\|off by default\|opt-in" skills/review-change/SKILL.md
grep -qi "sensitive" skills/review-change/SKILL.md

# AC5 — ship-roadmap hard floor
grep -qi -- "--adversarial" skills/ship-roadmap/SKILL.md
grep -qi "floor" skills/ship-roadmap/SKILL.md

# AC6 — workflow doc
grep -qi "adversarial" docs/workflow/REVIEW_AND_CLASSIFY.md

# AC7 — U2 contract intact
grep -qi "did NOT implement the change\|did not write the diff" skills/review-change/SKILL.md

# AC9 — changelog row
grep -c "adversarial\|multi-reviewer\|11-adversarial" CHANGELOG.md   # >= 1

# AC10 — untouched surfaces (expect NO output)
git diff --name-only origin/main...HEAD | grep -E '^(packages/|skills/review-implementation/)'

# AC10 — discovery
npx skills add . --list
```

## read-verified (judgement-only)

- **AC3 (inclusion rule):** a finding raised by ≥1 of the N reviewers enters
  classification; no majority/quorum gate. Confidence recorded as a `Reviewers
  n/N` column.
- **AC5 (do-not-align):** ship-roadmap's REVIEW step records that its L/sensitive
  `--adversarial 2` floor is deliberately distinct from the interactive advisory
  checkpoint.
- **AC8 (default unchanged):** the no-flag Process path is byte-for-byte today's;
  `--adversarial N` is additive and gated on the flag.
- **AC9 (bumps mirrored):** `review-change` + `ship-roadmap` MINOR-bumped,
  mirrored in both CHANGELOGs + both README skill tables.
