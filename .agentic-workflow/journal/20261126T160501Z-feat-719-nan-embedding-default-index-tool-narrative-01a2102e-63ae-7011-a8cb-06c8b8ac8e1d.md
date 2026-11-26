## 2026-11-26T16:05:01Z — feat/719-nan-embedding-default-index-tool — narrative
- **Commits:** 57 (`e8d7e1ab…2e78b0e1`)
- **Files:** 38 files
- **Summary:** Feature 719 (NaN embedding profile default-on + doc_search tool) and fix/706 (log-write-path) completed end-to-end: 52 commits, 63 files changed, PR #720 mergeable and awaiting human.
- **Decisions:** 719: adopted deepseek-v4-flash as the default embed model with a default-on embed-profile resolver; the profile donor triggers default without at-load registry reads. F1-F8 review findings were systematically folded across 3 cycles (self-injection withdrawal, unreadable-config refusal, score-ordering fix, doc_index tool, authorship fix). 706: shipped a stateless journal aggregate with fragment-carrier door, CI-only writer, and inline correction path.
- **Next:** PR #720 awaits human review/merge; after merge: close issue #719 on GitHub and update its status. fix/706 and fix/723 land in their own PRs.
