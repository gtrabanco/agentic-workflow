#!/usr/bin/env node
/**
 * Probe the package's SHA-256 paths and name the one that answered (feature 28,
 * P17 / AC21). Check-only: it prints, writes nothing, and exits 0 when every
 * available path returns one identical lowercase 64-hex digest for identical
 * bytes, 1 otherwise.
 *
 * Three paths, one corpus (the same ASCII / multibyte / oversized shapes
 * `test/pre-execution-canonical.test.mjs` pins):
 *   native    — `sha256HexSync` while the host exposes
 *               `globalThis.process?.getBuiltinModule?.("crypto")`;
 *   pure JS   — `sha256HexSync` with that exposure withheld, which is the
 *               condition a browser (or any host without the binding) sees, so
 *               the fallback is exercised for real instead of assumed;
 *   WebCrypto — the async `sha256Hex` every published digest already uses.
 *
 * Run it after `tsc` has built `dist/` (it reads the built package, exactly as
 * a consumer would): `node scripts/probe-sha256-paths.mjs`.
 */

import assert from "node:assert/strict";
import { sha256Hex, sha256HexSync } from "../dist/sha256.js";

const HEX64 = /^[0-9a-f]{64}$/;

/** Multibyte content whose byte length differs from its string length. */
const MULTIBYTE = "摘要。\n\tx   🚀 " + "ünïcödé ▓ ".repeat(8);

function oversized() {
  const unit = "pre-execution snapshot digest input\n";
  let out = "";
  while (out.length < 5 * 1024 * 1024) out += out + unit;
  return out;
}

const CASES = [
  { name: "ascii", label: "ASCII", text: "canonical vector input - pre-execution snapshot digest" },
  { name: "multibyte", label: "multibyte", text: MULTIBYTE },
  { name: "oversized", label: "oversized", text: oversized() },
];

function bytesOf(text) {
  return new TextEncoder().encode(text).length;
}

/** Median ns/op over `iterations` runs of one path, warm-up excluded. */
function timeNs(makeRun, bytes) {
  const run = makeRun();
  for (let i = 0; i < 3; i++) run();
  const samples = [];
  for (let i = 0; i < 25; i++) {
    const t0 = process.hrtime.bigint();
    run();
    samples.push(Number(process.hrtime.bigint() - t0));
  }
  samples.sort((a, b) => a - b);
  return { median: samples[Math.floor(samples.length / 2)], bytes };
}

const nativePresent = typeof globalThis.process?.getBuiltinModule === "function";

console.log(`host      : node ${process.version} (${process.platform}/${process.arch})`);
console.log(`native    : ${nativePresent ? "exposed via process.getBuiltinModule(\"crypto\")" : "NOT exposed by this host — only the pure-JS and WebCrypto paths are exercisable here"}`);
console.log("");

const processBuiltin = globalThis.process?.getBuiltinModule;
const timings = { native: [], js: [] };
let failures = 0;

for (const testCase of CASES) {
  const size = bytesOf(testCase.text);
  const webCrypto = await sha256Hex(testCase.text);
  const withNative = sha256HexSync(testCase.text);

  // Withhold the binding for the duration of the pure-JS measurement: the
  // implementation looks it up per call, so this is what a browser sees.
  globalThis.process.getBuiltinModule = undefined;
  const pureJs = sha256HexSync(testCase.text);
  if (nativePresent) globalThis.process.getBuiltinModule = processBuiltin;

  const ok = HEX64.test(withNative) && HEX64.test(pureJs) && HEX64.test(webCrypto) &&
    withNative === pureJs && pureJs === webCrypto;
  if (!ok) failures++;

  console.log(`case      : ${testCase.label} (${size} UTF-8 bytes)`);
  console.log(`  native  : ${nativePresent ? withNative : "n/a (no native binding)"}${nativePresent ? "  <- sha256HexSync, host native path" : ""}`);
  console.log(`  pure JS : ${pureJs}  <- sha256HexSync, binding withheld`);
  console.log(`  WebCrypto: ${webCrypto}  <- sha256Hex (async)`);
  console.log(`  identical: ${ok ? "YES" : "NO"}${ok ? "" : "  <-- paths disagree"}`);

  if (nativePresent) {
    const native = timeNs(() => () => sha256HexSync(testCase.text), size);
    globalThis.process.getBuiltinModule = undefined;
    const js = timeNs(() => () => sha256HexSync(testCase.text), size);
    globalThis.process.getBuiltinModule = processBuiltin;
    timings.native.push(native);
    timings.js.push(js);
    console.log(`  cost    : native ${(native.median / 1000).toFixed(1)} us/op vs pure JS ${(js.median / 1000).toFixed(1)} us/op -> pure JS is ${((js.median / native.median - 1) * 100).toFixed(0)}% more time than native`);
  }
  console.log("");
}

if (nativePresent) {
  const totalNative = timings.native.reduce((a, t) => a + t.median, 0);
  const totalJs = timings.js.reduce((a, t) => a + t.median, 0);
  console.log(`summary   : one sync pass over the corpus costs ${(totalNative / 1000).toFixed(1)} us natively and ${(totalJs / 1000).toFixed(1)} us in pure JS -> the JS path is ${((totalJs / totalNative - 1) * 100).toFixed(0)}% more time than the native path`);
}

console.log(failures === 0
  ? "RESULT: all available SHA-256 paths agree (zero failures)"
  : `RESULT: ${failures} case(s) disagree`);
process.exit(failures === 0 ? 0 : 1);
