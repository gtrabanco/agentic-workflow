## 2026-11-22T00:30:03Z — fix/678-deferred-tool-cwd-trap — narrative
- **Commits:** 4 (`9e4c0557…5cd971e2`)
- **Files:** 15 files
- **Summary:** Applied issue #678 through the owner's local inline workflow: the deferred tools' execute(params, cwd) is translated from pi's execute(toolCallId, params, signal, onUpdate, ctx) in the adapter, runSensor refuses an unreadable cwd instead of sampling process.cwd(), and a wiring suite calls every tool the way the host does.
- **Decisions:** D1: the host signature lives in the adapter, never in the Pi-free specs. D2: the cwd refusal reuses sensor-degraded, so no vocabulary moves. D3: conductor-sensor.test.mjs's placeholder "/fixture" became a real temp directory, since only the removed fallback made it pass.
- **Next:** Owner external verify on this head; the PR body closes #678 and the roadmap row settles once it is open.
