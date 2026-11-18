#!/usr/bin/env node
/**
 * turn-contract — the standalone face of the engine in `src/turn-contract.mjs`.
 *
 * The skills cite this path and the scaffold's `turn-contract.sh` shim execs it as
 * `agentic-workflow turn-contract`; both reach the same module, so the contract has
 * one implementation and two entry points (unit 554).
 */

import { main } from "../src/turn-contract.mjs";

process.exitCode = main(process.argv.slice(2));
