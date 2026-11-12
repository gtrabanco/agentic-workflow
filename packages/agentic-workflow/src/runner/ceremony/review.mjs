/**
 * review.mjs — ceremony `review` module (issue #352 P4): the review pass as a
 * checked operation over the unit's *own* record.
 *
 * No new artifact: a review is an `R<n>` line in the doc's `## Log` (the head it
 * judged, the cycle, and — once decided — the verdict) plus the open rows of its
 * `## Findings` table. That is the pair the ledger ownership map already declares
 * (`review-change:finding-rows` + `review-change:review-mark`), so this module
 * writes exactly those two carriers and nothing else.
 *
 * Manual checks and proposals ride inside the same `R` entry — a nested bullet,
 * which the entry grammar does not mistake for a second entry and a reader can
 * still count.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { out, fail, block, onlyFlags, parseFlags, resolveUnit, unitDoc, appendSectionLine, sectionRows, writeSection } from "../lib.mjs";

/** The published class/route vocabularies a classified finding must satisfy. */
export const FINDING_CLASSES = Object.freeze(["product", "plan", "source", "environment", "runtime"]);
export const FINDING_ROUTES = Object.freeze(["fold", "replan-in-unit", "decision-required", "proposal", "ignore"]);
const SEVERITIES = Object.freeze(["BLOCKER", "CRITICAL", "WARNING", "SUGGESTION"]);

const R_RE = /^- \*\*R(\d+)\*\* — (.*)$/u;

/** Every `R<n>` entry, in file order. */
const reviewsOf = (text) =>
  text
    .split("\n")
    .map((line) => R_RE.exec(line.trim()))
    .filter((match) => match !== null)
    .map((match) => ({ n: Number(match[1]), text: match[2] }));

/** The open findings rows of the doc's `## Findings` table. */
function findingsOf(file) {
  return sectionRows(file, "Findings")
    .filter((line) => /^\|\s*F\d+\s*\|/u.test(line))
    .map((line) => {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      return { id: cells[0], target: cells[1], axis: cells[2], severity: cells[3], impact: cells[4], class: cells[5], route: cells[6] };
    });
}

/** The verdict recorded on the latest entry, or null. */
const verdictOf = (text) => /verdict:\s*([A-Z-]+)/iu.exec(text)?.[1]?.toUpperCase() ?? null;

export function review(op, argv) {
  switch (op) {
    case "create": {
      const flags = parseFlags(argv, ["slug", "head"], ["slug", "head"]);
      onlyFlags(flags, ["head"]);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const cycle = reviewsOf(doc.text).length + 1;
      appendSectionLine(doc.path, "Log", `- **R${cycle}** — HEAD ${String(flags.head).slice(0, 12)}, cycle ${cycle}, state open`);
      out({ created: true, cycle, "head-sha": String(flags.head).slice(0, 12) });
    }
    case "read": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const reviews = reviewsOf(doc.text);
      const latest = reviews.at(-1);
      const head = latest === null ? null : /HEAD ([0-9a-f]{7,40})/u.exec(latest.text)?.[1] ?? null;
      out({
        slug: flags.slug,
        state: latest === null ? "absent" : verdictOf(latest.text) === null ? "open" : "decided",
        "head-sha": head,
        cycle: latest?.n ?? 0,
        verdict: latest === null ? null : verdictOf(latest.text),
        findings: findingsOf(doc.path),
      });
    }
    case "read-summary": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const reviews = reviewsOf(doc.text);
      const latest = reviews.at(-1);
      const text = latest?.text ?? "";
      const manual = [...text.matchAll(/manual checks:\s*(\d+)/gu)].map((match) => Number(match[1]));
      const proposals = [...text.matchAll(/proposals:\s*(\d+)/gu)].map((match) => Number(match[1]));
      out({
        verdict: latest === null ? null : verdictOf(text),
        cycle: latest?.n ?? 0,
        "head-sha": latest === null ? null : /HEAD ([0-9a-f]{7,40})/u.exec(text)?.[1] ?? null,
        "axis-count": new Set(findingsOf(doc.path).map((row) => row.axis)).size,
        "finding-count": findingsOf(doc.path).length,
        "proposal-count": proposals.at(-1) ?? 0,
        "manual-count": manual.at(-1) ?? 0,
      });
    }
    case "append-axis": {
      const flags = parseFlags(argv, ["slug", "axis", "findings"], ["slug", "axis", "findings"]);
      onlyFlags(flags, ["axis", "findings"]);
      const unit = resolveUnit(flags.slug);
      let rows;
      try {
        rows = JSON.parse(String(flags.findings));
      } catch {
        fail("bad-json", { flag: "--findings" });
      }
      if (!Array.isArray(rows)) fail("bad-findings", { expected: "[{ finding, severity, evidence }]" });
      const bad = rows.find((row) => !SEVERITIES.includes(String(row.severity ?? "").toUpperCase()));
      if (bad !== undefined) fail("bad-severity", { severity: bad.severity, allowed: SEVERITIES });
      const doc = unitDoc(unit);
      const next = findingsOf(doc.path).length + 1;
      rows.forEach((row, index) => {
        appendSectionLine(doc.path, "Findings", `| F${next + index} | ${row.target ?? "—"} | ${flags.axis} | ${String(row.severity).toUpperCase()} | ${row.impact ?? "blocking"} | ${row.class ?? "source"} | ${row.route ?? "fold"} |`);
      });
      out({ appended: rows.length, axis: flags.axis, "first-id": `F${next}` });
    }
    case "synthesize": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const rows = findingsOf(unitDoc(unit).path);
      const seen = new Map();
      for (const row of rows) {
        const key = `${row.target}|${row.severity}`;
        const existing = seen.get(key);
        if (existing === undefined) seen.set(key, { ...row, axes: [row.axis] });
        else if (!existing.axes.includes(row.axis)) existing.axes.push(row.axis);
      }
      out({ slug: flags.slug, fused: [...seen.values()].map((row, index) => ({ "#": index + 1, ...row, axis: row.axes.join("+") })), "deduped-count": rows.length - seen.size });
    }
    case "classify": {
      const flags = parseFlags(argv, ["slug", "findings"], ["slug", "findings"]);
      onlyFlags(flags, ["findings"]);
      resolveUnit(flags.slug);
      let rows;
      try {
        rows = JSON.parse(String(flags.findings));
      } catch {
        fail("bad-json", { flag: "--findings" });
      }
      if (!Array.isArray(rows)) fail("bad-findings", { expected: "[{ finding, severity, class, route }]" });
      const classified = rows.map((row) => {
        const klass = String(row.class ?? "");
        const route = String(row.route ?? "");
        if (!FINDING_CLASSES.includes(klass)) fail("bad-class", { finding: row.finding, class: klass, allowed: FINDING_CLASSES });
        if (!FINDING_ROUTES.includes(route)) fail("bad-route", { finding: row.finding, route, allowed: FINDING_ROUTES });
        return { finding: row.finding, severity: String(row.severity ?? "").toUpperCase(), class: klass, why: row.why ?? row.evidence ?? "", route };
      });
      out({ slug: flags.slug, classified });
    }
    case "transform-debt": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const debt = findingsOf(unitDoc(unit).path)
        .filter((row) => row.route.startsWith("proposal"))
        .map((row, index) => ({
          id: `D${index + 1}`,
          trigger: row.route.includes("—") ? row.route.split("—").slice(1).join("—").trim() : "needs-trigger",
          finding: row.target,
          severity: row.severity,
        }));
      out({ slug: flags.slug, "debt-items": debt, count: debt.length });
    }
    case "set-verdict": {
      const flags = parseFlags(argv, ["slug", "verdict"], ["slug", "verdict"]);
      onlyFlags(flags, ["verdict"]);
      const verdict = String(flags.verdict).toUpperCase();
      const allowed = ["PASS", "FAIL", "NEEDS-DECISION"];
      if (!allowed.includes(verdict)) fail("bad-verdict", { verdict, allowed });
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const reviews = reviewsOf(doc.text);
      if (reviews.length === 0) block({ check: "no-review", slug: flags.slug });
      const latest = reviews.at(-1);
      const lines = doc.text.split("\n");
      const index = lines.findIndex((line) => R_RE.test(line.trim()) && /HEAD /u.test(line) && line.includes(`**R${latest.n}**`));
      if (index === -1) block({ check: "no-review", slug: flags.slug });
      lines[index] = lines[index].replace(/state open|verdict: [A-Z-]+/iu, "").replace(/\s*$/u, "") + `, verdict: ${verdict}`;
      writeSection(doc.path, "Log", lines.slice(lines.indexOf("## Log") + 1).join("\n").trim());
      out({ set: true, verdict, cycle: latest.n });
    }
    case "append-manual-checks": {
      const flags = parseFlags(argv, ["slug", "checks"], ["slug", "checks"]);
      onlyFlags(flags, ["checks"]);
      const unit = resolveUnit(flags.slug);
      let checks;
      try {
        checks = JSON.parse(String(flags.checks));
      } catch {
        fail("bad-json", { flag: "--checks" });
      }
      if (!Array.isArray(checks)) fail("bad-checks", { expected: "[{ description, why }]" });
      const doc = unitDoc(unit);
      const reviews = reviewsOf(doc.text);
      if (reviews.length === 0) block({ check: "no-review", slug: flags.slug });
      appendSectionLine(doc.path, "Log", `  - manual checks: ${checks.length} — ${checks.map((check) => check.description).join("; ")}`);
      out({ appended: checks.length, cycle: reviews.at(-1).n });
    }
    case "append-proposals": {
      const flags = parseFlags(argv, ["slug", "proposals"], ["slug", "proposals"]);
      onlyFlags(flags, ["proposals"]);
      const unit = resolveUnit(flags.slug);
      let proposals;
      try {
        proposals = JSON.parse(String(flags.proposals));
      } catch {
        fail("bad-json", { flag: "--proposals" });
      }
      if (!Array.isArray(proposals)) fail("bad-proposals", { expected: "[{ finding, trigger }]" });
      const doc = unitDoc(unit);
      const reviews = reviewsOf(doc.text);
      if (reviews.length === 0) block({ check: "no-review", slug: flags.slug });
      appendSectionLine(doc.path, "Log", `  - proposals: ${proposals.length} — ${proposals.map((proposal) => `${proposal.finding} (${proposal.trigger})`).join("; ")}`);
      out({ appended: proposals.length, cycle: reviews.at(-1).n });
    }
    case "delete": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const reviews = reviewsOf(doc.text);
      const kept = doc.text.split("\n").filter((line) => !R_RE.test(line.trim()));
      writeSection(doc.path, "Log", kept.slice(kept.indexOf("## Log") + 1).join("\n").trim());
      out({ deleted: true, cycles: reviews.length });
    }
    default:
      fail("unknown-op", {
        object: "review",
        op,
        ops: ["create", "read", "append-axis", "synthesize", "classify", "transform-debt", "set-verdict", "append-manual-checks", "append-proposals", "read-summary", "delete"],
      });
  }
}
