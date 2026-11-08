## 2026-11-08T12:18:30Z — main — manual
- **Commits:** 0
- **Files:** —
- **Summary:** Diagnosed GitHub Actions journal-aggregate PR creation failure: GITHUB_TOKEN lacks pull-requests:create permission; fixed via Settings → Actions → General → 'Allow GitHub Actions to create and approve pull requests' toggle
- **Decisions:** Enabled the PR create/allow toggle in repo settings rather than modifying workflow YAML; the GITHUB_TOKEN default is read-only contents + packages, but the PR creation permission is a separate workflow-level toggle (not a GITHUB_TOKEN scope)
- **Next:** Verify that the scheduled journal-aggregate workflow runs successfully on next push or manually trigger it
