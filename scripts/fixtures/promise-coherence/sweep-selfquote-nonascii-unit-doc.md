# sweep-selfquote — the non-ASCII offset fixture

> Fixture for review F3 (`scripts/promise-coherence.mjs`). `sweepCount` walked
> the file with `Buffer.byteLength` offsets while the declaring document's own
> `## Log` exemption is a `sectionBounds` range — UTF-16 string indices. On any
> document whose text before `## Log` carries non-ASCII (em-dashes, arrows and
> accented words are everywhere in a unit doc) the two units diverge, the
> exemption mis-aligns, and the fold's own log quote counts as a survivor: a
> false `sweep-mismatch` against a clean fold.
>
> The paragraph below is padding *in the drifted unit*: é, é, é, ñ, ñ, ü, ü,
> à, à, ô, ç, →, →, ←, ±, ±, §, ¶, •, … — each one byte longer than the
> character the range math reads, so by `## Log` the byte cursor runs ahead of
> the string cursor and a line near the end of the exempt section falls outside
> it. éééééé éééééé ññññññ üüüüüü →→→→→← ←±±±± §§§§ ••••……
> éééééé éééééé ññññññ üüüüüü →→→→→← ←±±±± §§§§ ••••……
> éééééé éééééé ññññññ üüüüüü →→→→→← ←±±±± §§§§ ••••……
> éééééé éééééé ññññññ üüüüüü →→→→→← ←±±±± §§§§ ••••……
> éééééé éééééé ññññññ üüüüüü →→→→→← ←±±±± §§§§ ••••……
> éééééé éééééé ññññññ üüüüüü →→→→→← ←±±±± §§§§ ••••……

## Review verdict

Nothing here carries the swept form — the survivor count this declaration
expects is zero precisely because its only occurrence is the fold's own quote
in the log below, inside the exempt section.

## Log

- **F1** — 2026-10-27, the fold re-cut the verdict pane and swept the class →
  deadbeef, and recorded the stale form it removed — M1-SELF-QUOTE — in this
  log line, which is exactly what the exemption exists to protect.
  swept: /M1-SELF-QUOTE/ → expected 0 in scripts/fixtures/promise-coherence/sweep-selfquote-nonascii-unit-doc.md
