## 2026-11-24T12:25:17Z — fix/710-canary-stale-skills — narrative
- **Commits:** 16 (`5a95fcea…a8d9c7e8`)
- **Files:** 83 files
- **Summary:** Apply issue #710 (the launcher that resolves to nothing) and run it to a green gate: refuse bare launchers across the prose, fix the canary so it stamps the skills it ships, and repair the pi package's two documentation sites without printing a launcher.
- **Decisions:** Owner ruling on D11: skills keep invocation prose because a standalone install has nothing else; pi-agentic-workflow resolves the runtime in code, so no launcher is ever printed (keeps context cost down, lets the session pause-run-add when needed). #555 stands unamended. The projection pointer line says where the pin actually lives (the installed crate, spawned by the extension) without a launcher. The wrapped-span false negative in the drift gate was patched (11 sites missed). Canary needs two repairs: stage stamp AND post-stage bundle:skills. A raw grep on agentic-workflow is NOT the acceptance for S8.
- **Next:** Merge gate on PR #713 (https://github.com/gtrabanco/agentic-workflow/pull/713). After merge, run the release workflow to push the new train version.
- **Supersedes:** 20261124T110825Z-fix-710-canary-stale-skills-narrative-01a20ce5-18c0-7493-9282-acbb7b12f61e.md
