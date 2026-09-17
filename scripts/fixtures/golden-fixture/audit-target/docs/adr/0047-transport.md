# 0047 — Transport

Status: accepted (2026-06-28)

## Context

The toy CLI talks to a local store over a single in-process path today. Nothing in
the tree has needed a transport abstraction yet.

## Decision

Introduce one transport seam: an in-process adapter that the CLI depends on, and
keep every network adapter out of the core package. This is the terminal decision
record in `docs/adr/` for the current tree.
