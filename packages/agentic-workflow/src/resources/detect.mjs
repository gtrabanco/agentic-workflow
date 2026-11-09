/**
 * detect.mjs — the self-detecting host envelope (issue #260 S5, owner
 * decision 6 of 2026-10-28).
 *
 * Parallelism and resource use must be configurable with explicit caps, and
 * by default the layer runs automatically: it self-detects the host's
 * resources with conservative defaults. The envelope is the trial-envelope
 * half of the progress-led guards (2026-10-27 refinement): soft caps bound
 * the trial, the admission check (admit.mjs) reads it, and the runtime's
 * observation layer — not a threshold — decides overlap.
 *
 * Readings are injectable so tests and callers never depend on the host;
 * production reads /proc/meminfo and cgroup v2 (the 2026-10-27 OOM incident's
 * measured quantities: the cgroup limit, not the raw host memory, is what a
 * spawn can actually consume). Read-only: nothing here writes.
 *
 * Provenance: the cgroup-v2 file layout is the kernel's documented interface
 * (memory.max, memory.current, cpu.max under /sys/fs/cgroup), read directly
 * with no dependency.
 */

import { readFileSync } from "node:fs";
import os from "node:os";

export const RESOURCES_DETECT_CONTRACT_ID = "resources-detect@1";

const KB = 1024;
const MB = 1024 ** 2;
const GB = 1024 ** 3;

export class ResourcesError extends Error {
  constructor(message) {
    super(message);
    this.name = "ResourcesError";
  }
}

const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/** Parse "<n> of <m> <unit>" — the decision-6 cap shape ("12 of 64 GB",
 * "2 of 80 threads"). Returns `{ value, of, unit, unitBytes | null }`. */
export function parseCap(text, kind) {
  if (typeof text !== "string") {
    throw new ResourcesError(`${kind} cap must be the "<n> of <m> <unit>" string shape, got ${JSON.stringify(text)}`);
  }
  const m = text.match(/^(\d+(?:\.\d+)?)\s+of\s+(\d+(?:\.\d+)?)\s+(GB|MB|KB|threads|cores)$/u);
  if (!m) {
    throw new ResourcesError(`${kind} cap "${text}" does not match "<n> of <m> <unit>" (unit: GB|MB|KB|threads|cores)`);
  }
  const value = Number(m[1]);
  const of = Number(m[2]);
  if (value <= 0 || of <= 0 || value > of) {
    throw new ResourcesError(`${kind} cap "${text}" must carry 0 < n <= m`);
  }
  const unit = m[3];
  const unitBytes = unit === "GB" ? GB : unit === "MB" ? MB : unit === "KB" ? KB : null;
  return { value, of, unit, unitBytes };
}

/** Read the host's real quantities (never called with injected readings). */
function readHostReadings() {
  let memTotalBytes = null;
  let memAvailableBytes = null;
  try {
    const meminfo = readFileSync("/proc/meminfo", "utf8");
    const total = meminfo.match(/^MemTotal:\s+(\d+)\s+kB/mu);
    const avail = meminfo.match(/^MemAvailable:\s+(\d+)\s+kB/mu);
    if (total) memTotalBytes = Number(total[1]) * KB;
    if (avail) memAvailableBytes = Number(avail[1]) * KB;
  } catch {
    // non-linux or restricted /proc: conservative defaults below
  }
  let cgroupLimitBytes = null;
  let cgroupCurrentBytes = null;
  try {
    const max = readFileSync("/sys/fs/cgroup/memory.max", "utf8").trim();
    if (max !== "max") cgroupLimitBytes = Number(max);
    cgroupCurrentBytes = Number(readFileSync("/sys/fs/cgroup/memory.current", "utf8").trim());
  } catch {
    // no cgroup v2 mount: the host memory is the limit
  }
  return {
    memTotalBytes: memTotalBytes ?? 2 * GB, // conservative floor when undetectable
    memAvailableBytes: memAvailableBytes ?? 512 * MB,
    cgroupLimitBytes,
    cgroupCurrentBytes: cgroupCurrentBytes ?? 0,
    cores: os.cpus().length || 1,
  };
}

/** The conservative parallelism derivation (the 2026-10-27 incident table):
 * small hosts (≤4 GB effective or ≤2 host cores) spawn one at a time, mid
 * hosts two, large hosts are bounded only by the operator's caps. The serial
 * floor reads the host's cores — a thread cap is a resource bound, not a
 * host-shape fact. */
function deriveParallelism({ effectiveLimitBytes, threads, cores }) {
  if (effectiveLimitBytes <= 4 * GB || cores <= 2) return "serial";
  if (effectiveLimitBytes <= 8 * GB || threads <= 4) return 2;
  return "max";
}

/**
 * detectHost({ readings?, caps? }) — the envelope. `caps` (optional) applies
 * the operator's explicit decision-6 limits: `parallelism: "serial" | "auto" |
 * <int>`, `memoryCap: "<n> of <m> GB|MB|KB"`, `threadCap: "<n> of <m> threads|cores"`.
 * Caps only ever bound tighter; they never exceed what the host reports.
 */
export function detectHost({ readings = null, caps = null } = {}) {
  const r = readings ?? readHostReadings();
  if (!isRecord(r)) throw new ResourcesError("readings must be a record");

  const hostLimitBytes = r.cgroupLimitBytes ?? r.memTotalBytes;
  const envelope = {
    contract: RESOURCES_DETECT_CONTRACT_ID,
    memory: {
      totalBytes: r.memTotalBytes,
      availableBytes: r.memAvailableBytes,
      cgroupLimitBytes: r.cgroupLimitBytes,
      cgroupCurrentBytes: r.cgroupCurrentBytes,
      effectiveLimitBytes: Math.min(r.memTotalBytes, hostLimitBytes),
    },
    cores: r.cores,
    threads: r.cores,
    caps: {},
  };

  if (caps !== null) {
    if (!isRecord(caps)) throw new ResourcesError("caps must be a record");
    const unknown = Object.keys(caps).filter((k) => !["parallelism", "memoryCap", "threadCap"].includes(k));
    if (unknown.length > 0) {
      throw new ResourcesError(`unknown caps key(s): ${unknown.join(", ")} (allowed: parallelism, memoryCap, threadCap)`);
    }
    if (caps.memoryCap !== undefined) {
      const cap = parseCap(caps.memoryCap, "memoryCap");
      if (cap.unitBytes === null) throw new ResourcesError(`memoryCap unit must be GB|MB|KB, got "${caps.memoryCap}"`);
      envelope.memory.effectiveLimitBytes = Math.min(envelope.memory.effectiveLimitBytes, cap.value * cap.unitBytes);
      envelope.caps.memoryCap = caps.memoryCap;
    }
    if (caps.threadCap !== undefined) {
      const cap = parseCap(caps.threadCap, "threadCap");
      if (cap.unitBytes !== null) throw new ResourcesError(`threadCap unit must be threads|cores, got "${caps.threadCap}"`);
      envelope.threads = Math.min(envelope.threads, cap.value);
      envelope.caps.threadCap = caps.threadCap;
    }
  }

  // Derived parallelism: "auto" is the default and the explicit escape value;
  // an explicit "serial" or <int> stands (the operator's order wins), where
  // <int> is capped by the thread envelope.
  const parallelism = caps?.parallelism ?? "auto";
  if (parallelism === "auto") {
    envelope.derived = { parallelism: deriveParallelism({ effectiveLimitBytes: envelope.memory.effectiveLimitBytes, threads: envelope.threads, cores: envelope.cores }) };
  } else if (parallelism === "serial") {
    envelope.derived = { parallelism: "serial" };
  } else if (Number.isInteger(parallelism) && parallelism >= 1) {
    envelope.derived = { parallelism: Math.min(parallelism, envelope.threads) };
  } else {
    throw new ResourcesError(`parallelism must be "serial", "auto" or a positive integer, got ${JSON.stringify(parallelism)}`);
  }

  return envelope;
}
