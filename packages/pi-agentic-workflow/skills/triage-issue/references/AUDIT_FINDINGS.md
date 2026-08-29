## Audit-finding mode (`triage-issue <audit-id> F<k> …`)

When the first argument is an **audit id** (a plain integer matching a
`docs/audits/<id>-*.md` file) followed by one or more `F<k>` finding ids, the
input is a `product-audit` finding, not an existing issue. Detection is
mechanical: `F`-prefixed second argument → audit-finding mode; otherwise every
argument is an issue number, unchanged.

1. **Read the audit report** `docs/audits/<id>-*.md` (exactly one file matches;
   zero or several → stop and report the mismatch). Locate each requested
   `F<k>` row in `## Findings` and any proposal citing it (`from: F<k>`).
2. **Verify against current code** — same as Process step 2: the audit may be
   stale; re-check its evidence (paths, counts, repro) before acting. An
   already-fixed finding → verdict **wontfix** (obsolete), no issue opened.
3. **Check for an existing issue** — `gh issue list --search "Audit <id> F<k>"`
   plus a title match; if one exists, triage THAT issue via the normal Process
   (never open a duplicate).
4. **Classify** with the same four verdicts (plus `fix-in-unit` via step 3 of
   the Process). Then:
   - **fix-now / postpone / promote** → this is the moment the GitHub issue is
     **opened** (the audit itself never files issues): body written with the
     Write tool and `gh issue create --body-file`, citing provenance on its
     first line — `Origin: product audit <id>, finding F<k>
     (docs/audits/<id>-<date>.md)` — plus the finding's evidence, severity, and
     class. Then apply the verdict's labels/comment/routing exactly as the
     normal Process dictates for that verdict.
   - **wontfix / already-fixed** → open nothing; the verdict block is the record.
5. **Mark the finding triaged** in the audit file: append directly under the
   `F<k>` line one indented note —
   `↳ triaged <YYYY-MM-DD>: <verdict> — issue #<n> | no issue (<why>)` —
   and commit with `docs(audits): triage audit <id> F<k>`. Never renumber or
   rewrite the finding itself.
6. **Report** the same fixed verdict block, with
   `ISSUE #<n>` replaced by `AUDIT <id> F<k> — <finding title>` when no issue
   ends up existing.
