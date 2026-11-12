---
"@gtrabanco/agentic-workflow": patch
---

fix(ci): wait for npm tarball availability and integrity before announcing a release (issue #481)

`npm publish` success only proves the registry accepted the upload; the CDN can
404 the tarball for minutes while the packument, the tag and the dist-tag are
already visible (canary run 42638128017, 2026-11-09). `scripts/npm-availability-wait.mjs`
polls the packument's `dist.tarball`, downloads it, and requires a 200 whose
bytes hash to `dist.shasum`; timeout exits non-zero naming the package. The
five npm-publishing jobs in `publish.yml` now wait between their publish and
their signal (canary cut: before the tag/pre-release; stable jobs: before the
`canary` dist-tag write).
