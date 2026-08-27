# Acceptance manifest v1 — fix-147-audit-evidence-provenance

Status: frozen

Anchors are exact literals; validators run from the repo root on the final
tree. `AUDIT_PROCESS.md` = `skills/product-audit/references/AUDIT_PROCESS.md`;
`SKILL.md` = `skills/product-audit/SKILL.md`.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Fixed provenance gate exists with all five labeled domains, each carrying a Fallback clause | `grep -c 'Evidence-provenance gate (fixed):' skills/product-audit/references/AUDIT_PROCESS.md` ≥ 1 AND `grep -c '^- Forge state —' skills/product-audit/references/AUDIT_PROCESS.md` = 1 AND `grep -c '^- Command-derived metrics —' skills/product-audit/references/AUDIT_PROCESS.md` = 1 AND `grep -c '^- Repository inventories —' skills/product-audit/references/AUDIT_PROCESS.md` = 1 AND `grep -c '^- Freshness/timestamps —' skills/product-audit/references/AUDIT_PROCESS.md` = 1 AND `grep -c '^- Conflicting sources —' skills/product-audit/references/AUDIT_PROCESS.md` = 1 AND `grep -c 'Fallback:' skills/product-audit/references/AUDIT_PROCESS.md` ≥ 5 |
| AC2 | Forge authority declared live-ledger source for issue/PR status; indexes demoted to drift audit | `grep -n 'authoritative for live issue and pull-request status' skills/product-audit/references/AUDIT_PROCESS.md` → match |
| AC3 | Command evidence binds command + cwd/target + supporting output and forbids aggregate-tail attribution | `grep -n 'working directory or target' skills/product-audit/references/AUDIT_PROCESS.md` → match AND `grep -n 'supporting output line or structured field' skills/product-audit/references/AUDIT_PROCESS.md` → match AND `grep -n 'aggregate terminal summary' skills/product-audit/references/AUDIT_PROCESS.md` → match |
| AC4 | Inventory claims recomputed + terminal cite, with zero non-portable product/tool tokens in the skill tree | `grep -n 'recomputed from the current tree' skills/product-audit/references/AUDIT_PROCESS.md` → match AND `grep -rni 'gtrabanco/webs' skills/product-audit/` → empty output (exit 1) AND `grep -rni 'bun ' skills/product-audit/` → empty output (exit 1) AND `grep -rn 'sort -V' skills/product-audit/` → empty output (exit 1) AND `grep -rn 'gh issue' skills/product-audit/` → empty output (exit 1) AND `grep -rn 'gh pr' skills/product-audit/` → empty output (exit 1) |
| AC5 | Delta section frozen into the output format: three classes, mapping syntax, explicit no-prior case | `grep -n '## Delta vs audit <prior-id>' skills/product-audit/SKILL.md` → 1 match AND `grep -nF 'F<k> <- audit <prior-id> F<j>' skills/product-audit/SKILL.md` → match AND `grep -n 'none — <why no equivalent-scope prior exists>' skills/product-audit/SKILL.md` → match |
| AC6 | Same-date/equivalent-scope rerun needs stated reason + delta; never banned by date alone | `grep -n 'not forbidden by date alone' skills/product-audit/references/AUDIT_PROCESS.md` → match AND `grep -n 'equivalent scope' skills/product-audit/references/AUDIT_PROCESS.md` → ≥ 2 matches |
| AC7 | Process compares against newest prior equivalent-scope audit after independent synthesis | `grep -n 'newest previous audit' skills/product-audit/references/AUDIT_PROCESS.md` → match |
| AC8 | F-ID-only addressing preserved; lineage only via delta mapping wording | `grep -n 'never global slugs' skills/product-audit/SKILL.md` → match |
| AC9 | Golden-fixture scenario carries traps T1–T4 and expected delta behavior in BOTH languages | `grep -c 'T1 wrong-scope aggregate tail' docs/workflow/GOLDEN_FIXTURE.md docs/workflow/GOLDEN_FIXTURE.es.md` → ≥ 1 per file AND same for `T2 stale worklist vs forge state`, `T3 newer terminal inventory item`, `T4 prior equivalent-scope finding`, and `Delta vs audit <prior-id>` |
| AC10 | Repo gates green on final tree; version surfaces bumped consistently | `node scripts/check-skill-context.mjs` → exit 0, "PASS context budgets" printed AND `npx skills add . --list` lists `product-audit` AND `grep '^version:' skills/product-audit/SKILL.md` shows `3.1.0` AND `grep -l '3\.1\.0' CHANGELOG.md CHANGELOG.es.md` lists both files |

read-verified rows: none beyond AC validators above; every row is
command-validated. The P3 weak-model fixture execution itself remains a
manual observation recorded in the fixture log during Hardening (labeled
`manual`: weakest-fleet model runs the changed skill against the four-trap
fixture; observation = report rejects/mends T1–T4 and emits the Delta
section).

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
- grep validators as tabulated per AC above
