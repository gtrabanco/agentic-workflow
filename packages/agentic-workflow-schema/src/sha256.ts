/**
 * SHA-256 for the package's digest surface.
 *
 * Two entry points over one implementation contract:
 *   - `sha256Hex` (async, Web Crypto) — the historical path every published
 *     digest in this package already uses;
 *   - `sha256HexSync` — the same function over the same bytes, needed because
 *     `buildPreExecutionArtifactSnapshot` derives digests from caller-supplied
 *     document text in ONE synchronous pass (feature 28 AC2): a builder that had
 *     to await per artifact row would either force the whole pre-execution API
 *     async or hash the wrong bytes when a caller mutated content mid-flight.
 *
 * Both return one identical lowercase 64-hex digest for identical bytes:
 * `test/pre-execution-canonical.test.mjs` pins that agreement over an
 * ASCII/multibyte/oversized corpus — the async path against `node:crypto` and,
 * since feature 28 P17, the host-native sync path, the pure-JS sync path and the
 * WebCrypto async path against each other — so no path can silently drift.
 */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const HEX = "0123456789abcdef";
const _encoder = new TextEncoder();

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * FIPS 180-4 SHA-256 over raw bytes. One reusable message-schedule buffer keeps
 * repeated hashing allocation-free; the padded tail is written into a scratch
 * block instead of copying the whole message.
 */
export function sha256Bytes(message: Uint8Array): Uint8Array {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  // The contract's own ceilings (4 MiB per artifact, 64 KiB per payload) keep the
  // length in the low 32 bits, so the high word is always 0 here; it is computed
  // rather than assumed so a future budget raise cannot truncate the padding.
  const bitLengthHigh = Math.floor(message.length / 0x20000000);
  const bitLengthLow = (message.length % 0x20000000) * 8;

  const compress = (block: Uint8Array, offset: number): void => {
    for (let i = 0; i < 16; i++) {
      const p = offset + i * 4;
      w[i] = ((block[p] << 24) | (block[p + 1] << 16) | (block[p + 2] << 8) | block[p + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + (s0 >>> 0) + w[i - 7] + (s1 >>> 0)) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (hh + (S1 >>> 0) + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = ((S0 >>> 0) + maj) >>> 0;
      hh = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  };

  const fullBlocks = Math.floor(message.length / 64);
  for (let i = 0; i < fullBlocks; i++) compress(message, i * 64);

  const tail = message.length % 64;
  // One or two padding blocks: 0x80, zeros, then the 64-bit big-endian length.
  const padLength = tail < 56 ? 64 : 128;
  const pad = new Uint8Array(padLength);
  pad.set(message.subarray(fullBlocks * 64), 0);
  pad[tail] = 0x80;
  pad[padLength - 8] = (bitLengthHigh >>> 24) & 0xff;
  pad[padLength - 7] = (bitLengthHigh >>> 16) & 0xff;
  pad[padLength - 6] = (bitLengthHigh >>> 8) & 0xff;
  pad[padLength - 5] = bitLengthHigh & 0xff;
  pad[padLength - 4] = (bitLengthLow >>> 24) & 0xff;
  pad[padLength - 3] = (bitLengthLow >>> 16) & 0xff;
  pad[padLength - 2] = (bitLengthLow >>> 8) & 0xff;
  pad[padLength - 1] = bitLengthLow & 0xff;
  for (let i = 0; i < padLength; i += 64) compress(pad, i);

  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (h[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (h[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (h[i] >>> 8) & 0xff;
    out[i * 4 + 3] = h[i] & 0xff;
  }
  return out;
}

/** The subset of a host's built-in `crypto` module that this file uses. */
interface NativeCrypto {
  createHash(algorithm: string): NativeHash;
}

interface NativeHash {
  update(data: Uint8Array): NativeHash;
  digest(): Uint8Array;
}

/**
 * The native path, or `null` when this host exposes none.
 *
 * Sourced through `globalThis.process?.getBuiltinModule?.("crypto")` — the
 * presence-check AC21 names — because the package targets browsers too and may
 * be bundled by a toolchain that leaves `crypto` un-resolvable. The duck-typed
 * `NativeCrypto` interface above is what keeps that lookup type-checked without
 * a static `node:` specifier and without `@types/node` (AC21).
 *
 * Deliberately NOT cached in a module-level variable: a host that answers once
 * can stop answering later (bundle moved between runtimes, the builtin
 * unregistered), and a cached verdict — either way — is a wrong-host assumption
 * that would either strand Node on the JS path or throw in a browser. The
 * lookup is three `typeof` checks and one guarded call; measured against the
 * digest it costs, caching is not worth the risk (unit 28 D36).
 */
function nativeSha256(): ((bytes: Uint8Array) => Uint8Array) | null {
  const host = globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } };
  const getBuiltinModule = host.process?.getBuiltinModule;
  if (typeof getBuiltinModule !== "function") return null;
  let builtin: unknown;
  try {
    builtin = getBuiltinModule.call(host.process, "crypto");
  } catch {
    return null;
  }
  if (typeof builtin !== "object" || builtin === null) return null;
  const createHash = (builtin as NativeCrypto).createHash;
  if (typeof createHash !== "function") return null;
  return (bytes: Uint8Array): Uint8Array =>
    (builtin as NativeCrypto).createHash("sha256").update(bytes).digest();
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += HEX[byte >> 4] + HEX[byte & 0x0f];
  return out;
}

/**
 * Lowercase 64-hex SHA-256 of UTF-8 bytes, computed without awaiting.
 *
 * Routed: the host's native SHA-256 where the host exposes one, this package's
 * pure-JS FIPS 180-4 core otherwise. Both branches hash the same UTF-8 bytes
 * and emit the same lowercase 64-hex string — the guarantee AC21 states and the
 * three-path case in `test/pre-execution-canonical.test.mjs` pins.
 */
export function sha256HexSync(data: string): string {
  const bytes = _encoder.encode(data);
  const native = nativeSha256();
  if (native !== null) {
    try {
      return toHex(native(bytes));
    } catch {
      // The binding was there a moment ago and failed now: answer from the
      // JS core rather than propagating a host error out of a digest.
    }
  }
  return toHex(sha256Bytes(bytes));
}

/** D4 — SHA-256 hex digest (async via Web Crypto). Same bytes as the sync path. */
export async function sha256Hex(data: string): Promise<string> {
  const buf = _encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  return toHex(new Uint8Array(hashBuffer));
}
