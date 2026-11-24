/**
 * doctor.mjs — the tool doctor (issue #537 S2/S4).
 *
 * One read-only run over the documented inventory: read each surface with the
 * probe its id names, turn the evidence into a status, derive the wizard's move,
 * and print one envelope. The twin of `resources/detect.mjs` — own contract id,
 * injectable probes, zero dependencies, and nothing here writes.
 *
 * The inventory comes from the crate README (`tool-inventory@1`), never from a
 * second list in code: the checker fails closed with a `DOCTOR REFUSAL` when the
 * document and the probes disagree in either direction, because a documented
 * tool nobody checks is exactly the silent degradation this unit exists to end.
 */

import { readFileSync } from "node:fs";

import { CHECK_PROBES } from "./checks.mjs";
import { INVENTORY_SOURCE, parseInventory } from "./inventory.mjs";
import { realOps } from "./probes.mjs";
import { DOCTOR_CHECK_STATUSES, DOCTOR_CONTRACT_ID } from "./vocabulary.mjs";

/**
 * The bound `engram` server's default endpoint. `ENGRAM_URL` overrides it; the
 * port is the host's observed default, recorded as PE-014 rather than assumed
 * (a host serving elsewhere reports `unreachable` and the operator's
 * `ENGRAM_URL` is the documented escape).
 */
export const DEFAULT_ENGRAM_URL = "http://127.0.0.1:7437";

/** A checker refusal: exit 2, stdout empty, nothing written. */
export class DoctorRefusal extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DoctorRefusal";
    this.code = code;
  }
}

/** The shipped crate README — the documented inventory's home. */
export function shippedInventoryText() {
  return readFileSync(new URL("../../README.md", import.meta.url), "utf8");
}

/** The human label per published status. */
export const STATUS_LABELS = Object.freeze({
  ok: "ok",
  missing: "MISS",
  mismatch: "MISMATCH",
  unarmed: "UNARMED",
  unreachable: "UNREACHABLE",
  "not-applicable": "N/A",
});

/** The binaries whose `--version` the checker reads, probed once and together. */
const PROBED_BINARIES = Object.freeze(["bun", "rg", "git", "gh", "serena", "engram", "pi"]);

/** The row's closed status is the summary's key; `n/a` keeps its hyphen out. */
const summaryKey = (status) => (status === "not-applicable" ? "notApplicable" : status);

/**
 * The move is derived from the evaluated row, never declared twice: a healthy or
 * inapplicable row is `report-only`, a row the project's own installer repairs is
 * `ask-consent-write`, a row with an operator command is `instruct-only`, and a
 * row with neither is `residual`.
 */
export function moveFor({ status, action, instruction }) {
  if (status === "ok" || status === "not-applicable") return "report-only";
  if (action) return "ask-consent-write";
  if (instruction) return "instruct-only";
  return "residual";
}

/** The advisory a reader can act on: the sentence, plus the exact command. */
function withCommand(advisory, instruction) {
  if (!advisory) return null;
  if (!instruction || advisory.includes(instruction)) return advisory;
  return `${advisory} — run: ${instruction}`;
}

/** A compact, evidence-only detail line for the human block. */
function describe(row) {
  const evidence = row.evidence ?? {};
  const bits = [];
  if (evidence.path) bits.push(evidence.path);
  if (evidence.version) bits.push(`version ${evidence.version}`);
  if (evidence.pin) bits.push(`pin ${evidence.pin}`);
  if (evidence.source) bits.push(`from ${evidence.source}`);
  if (evidence.url) bits.push(evidence.url);
  if (evidence.piWeb) {
    // The relay row: what the session probes saw, and the route that stays when
    // nothing is wrong — the advisory carries it when something is.
    bits.push(evidence.piWeb.present ? "PI WEB session" : "no PI WEB session");
    const daemon = evidence.sessiond ?? {};
    if (daemon.kind === "tcp") bits.push(`daemon tcp ${daemon.endpoint}`);
    else if (daemon.present === true) bits.push(`daemon ${daemon.endpoint}`);
    else if (daemon.present === false) bits.push(`daemon absent at ${daemon.endpoint}`);
    if (evidence.package?.declared) {
      const skills = Object.entries(evidence.package.skills ?? {})
        .map(([name, present]) => `${name}${present ? "" : " (absent)"}`)
        .join(", ");
      bits.push(`${evidence.package.name} ${evidence.package.version ?? "?"}${skills ? ` · skills ${skills}` : ""}`);
    } else {
      bits.push(`${evidence.package?.name ?? "relay package"} not registered`);
      if (evidence.embedded?.present) bits.push(`shipped at ${evidence.embedded.path}`);
    }
    // The route belongs to the absent-capability answer: an `ok` row is not a
    // hand-off, and the dead ends carry it in their advisory already.
    if (evidence.degradation && !row.advisory && row.status === "not-applicable") bits.push(evidence.degradation);
  }
  if (evidence.pair) {
    const left = evidence.pair.binary ?? `${evidence.pair.companionLine}.x`;
    const right = evidence.pair.served ?? `${evidence.pair.coreLine}.x`;
    bits.push(`pair ${left} / ${right}`);
  }
  if (Array.isArray(evidence.unarmed) && evidence.unarmed.length > 0) bits.push(`unarmed: ${evidence.unarmed.join(", ")}`);
  if (Array.isArray(evidence.adapters)) {
    const present = evidence.adapters.filter((adapter) => adapter.present).map((adapter) => adapter.id);
    bits.push(present.length > 0 ? `adapters: ${present.join(", ")}` : "no adapter config found");
  }
  if (evidence.project) bits.push(`language_servers: ${evidence.project.languageServers.length}`);
  if (evidence.vehicle) {
    const vehicle = evidence.vehicle;
    bits.push(vehicle.source === "AGENTIC_WORKFLOW_RUNNER" ? `vehicle armed → ${vehicle.target ?? vehicle.raw}` : "vehicle unset");
    if (vehicle.installed?.version) bits.push(`installed ${vehicle.installed.version}`);
    bits.push(vehicle.canary?.tag ? `canary ${vehicle.canary.tag}` : "no canary tag visible");
  }
  if (evidence.identity) {
    const identity = [evidence.identity.name, evidence.identity.email].filter(Boolean).join(" <");
    bits.push(identity ? `${identity}>` : "identity unset");
  }
  if (bits.length === 0) bits.push(row.status === "not-applicable" ? "not declared by this project" : "-");
  return bits.join(" · ");
}

/**
 * The fixed human block: header, one labelled line per row, the tally, the
 * verdict. Every line is derived from the envelope, so `--json` and the block can
 * never disagree.
 */
export function renderDoctor(envelope) {
  const lines = [`DOCTOR — tool doctor (${envelope.contract}) · ${envelope.rows.length} surface${envelope.rows.length === 1 ? "" : "s"} · ${envelope.host.platform}/${envelope.host.arch}`];
  for (const row of envelope.rows) {
    const label = STATUS_LABELS[row.status] ?? row.status;
    const detail = describe(row);
    const advisory = row.advisory ? ` — ${row.advisory}${row.instruction && !row.advisory.includes(row.instruction) ? ` · ${row.instruction}` : ""}` : "";
    // The label column is 12 wide with a minimum two-space gutter, so the
    // fixed block keeps its separation even for the 11-character UNREACHABLE;
    // the id column widens for an id longer than it (issue #611).
    const gutter = Math.max(16, row.id.length + 1);
    lines.push(`${label}${" ".repeat(Math.max(12 - label.length, 2))}${row.id.padEnd(gutter)}${detail}${advisory}`);
  }
  const summary = envelope.summary;
  lines.push(
    `SUMMARY — ok ${summary.ok} · missing ${summary.missing} · mismatch ${summary.mismatch} · unarmed ${summary.unarmed} · unreachable ${summary.unreachable} · n/a ${summary.notApplicable} · advisories ${summary.advisories}`,
  );
  const broken = envelope.rows.filter((row) => row.requirement === "required" && !["ok", "not-applicable"].includes(row.status));
  lines.push(
    envelope.verdict === "pass"
      ? "VERDICT: PASS"
      : `VERDICT: ATTENTION — ${summary.advisories} advisories${broken.length > 0 ? ` (${broken.map((row) => row.id).join(", ")} required)` : ""}`,
  );
  return lines.join("\n");
}

/**
 * Run the checker. `ops` is the host seam (`realOps()` by default), `root`
 * re-points what it observes, `inventoryText` exists for the drift fixtures —
 * production always reads the shipped README — and `check` narrows the printed
 * rows to one documented id (issue #705: a caller that wants one answer should
 * not parse sixteen rows).
 *
 * The documented↔probed bijection is checked over the whole document whatever the
 * filter is: a drift is a drift, and a narrowed run must not hide one.
 */
export async function runDoctor({ ops = null, root, inventoryText = null, check = null } = {}) {
  const o = ops ?? realOps({ root });
  const text = inventoryText ?? shippedInventoryText();
  const parsed = parseInventory(text);

  if (parsed.errors.length > 0) {
    const code = parsed.marker === null ? "inventory-missing" : "inventory-malformed";
    throw new DoctorRefusal(code, `${INVENTORY_SOURCE}: ${parsed.errors.map((error) => error.message).join("; ")}`);
  }

  const documented = parsed.rows.map((row) => row.id);
  const probed = CHECK_PROBES.map((probe) => probe.id);
  const unprobed = documented.filter((id) => !probed.includes(id));
  const undocumented = probed.filter((id) => !documented.includes(id));
  if (unprobed.length > 0 || undocumented.length > 0) {
    const parts = [];
    if (unprobed.length > 0) parts.push(`documented without a probe: ${unprobed.join(", ")}`);
    if (undocumented.length > 0) parts.push(`probed without a documented row: ${undocumented.join(", ")}`);
    throw new DoctorRefusal("inventory-drift", `${INVENTORY_SOURCE}: ${parts.join("; ")}`);
  }

  // A filter that names nothing is a usage error, never an empty envelope: an
  // empty answer would read as "this surface is fine".
  if (check !== null && !documented.includes(check)) {
    throw new DoctorRefusal("unknown-check", `${INVENTORY_SOURCE} documents no \`${check}\` row — documented ids: ${documented.join(", ")}`);
  }
  const selected = check === null ? parsed.rows : parsed.rows.filter((row) => row.id === check);

  // The facts more than one row shares, read once: the resolved core binary and
  // what its server answers. A second read would let the pair disagree with
  // itself. A narrowed run (`--check`) pays only for what its selection declares
  // it reads (`probe.needs`), so one row costs one probe — issue #705.
  const needs = new Set(
    CHECK_PROBES.filter((probe) => selected.some((row) => row.id === probe.id)).flatMap((probe) => probe.needs ?? []),
  );
  const engramUrl = String(o.env?.ENGRAM_URL ?? "").trim() || DEFAULT_ENGRAM_URL;
  const health = needs.has("engram") ? await o.httpJson(`${engramUrl}/health`) : { ok: false, body: null };
  // Every version in one concurrent pass on a full run: the sum of these probes
  // is seconds of wall time, the slowest one is what a run pays. A narrowed run
  // resolves the few it actually reads, memoized, in the same shape.
  const versions =
    check === null && typeof o.versionMany === "function" ? await o.versionMany([...PROBED_BINARIES]) : null;
  const single = new Map();
  const versionOf = (name) => {
    if (versions && versions.has(name)) return versions.get(name);
    if (!single.has(name)) single.set(name, o.version(name));
    return single.get(name);
  };
  const ctx = {
    ops: o,
    version: versionOf,
    engram: {
      path: o.binaryPath("engram", "ENGRAM_BIN"),
      version: versionOf("engram"),
      url: engramUrl,
      reachable: health.ok,
      status: health.body?.status ?? null,
      served: health.body?.version ?? null,
    },
  };

  const rows = selected.map((documented) => {
    const probe = CHECK_PROBES.find((candidate) => candidate.id === documented.id);
    const evidence = probe.probe(o, ctx);
    const verdict = probe.evaluate(evidence, ctx) ?? {};
    const status = verdict.status ?? "missing";
    if (!DOCTOR_CHECK_STATUSES.includes(status)) {
      throw new DoctorRefusal("unknown-status", `${documented.id}: the probe answered the unpublished status "${status}"`);
    }
    const row = {
      id: documented.id,
      requirement: documented.requirement,
      route: documented["install-route"],
      what: documented.what,
      why: documented.why,
      detectedBy: documented["detected-by"],
      alternative: documented.alternative,
      status,
      move: moveFor({ status, action: verdict.action ?? null, instruction: verdict.instruction ?? null }),
      // The advisory is the complete sentence a reader can act on, so it carries
      // the exact command too; `instruction` is the bare command for a consumer
      // that runs it, and the human block prints both without repeating itself.
      advisory: withCommand(verdict.advisory ?? null, verdict.instruction ?? null),
      instruction: verdict.instruction ?? null,
      action: verdict.action ?? null,
      evidence,
    };
    return row;
  });

  const summary = {
    ok: 0,
    missing: 0,
    mismatch: 0,
    unarmed: 0,
    unreachable: 0,
    notApplicable: 0,
    advisories: 0,
  };
  for (const row of rows) {
    summary[summaryKey(row.status)] += 1;
    if (row.advisory) summary.advisories += 1;
  }
  const broken = rows.some((row) => row.requirement === "required" && !["ok", "not-applicable"].includes(row.status));

  return {
    contract: DOCTOR_CONTRACT_ID,
    host: { platform: o.platform, arch: o.arch, node: o.nodeVersion, root: o.root },
    // `rows` is the documented population, `check` names the filter: a narrowed
    // envelope says both, so "one row printed" and "the inventory's size" are
    // never the same number read twice.
    inventory: { source: INVENTORY_SOURCE, rows: documented.length, check },
    rows,
    summary,
    verdict: summary.advisories === 0 ? "pass" : "attention",
    exitCode: broken ? 1 : 0,
  };
}
