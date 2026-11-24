/**
 * bundle.mjs — the triage contract and the anonymized bundle (issue #703 S6–S8).
 *
 * The model's only discretionary work is applying the rubric: it reads the mine
 * receipt, picks one verdict per class from the skill's table, and writes one
 * sentence saying what a maintainer acts on. This module is the machine half —
 * it validates that file against the closed rubric, projects the cited rows onto
 * their redacted anchors, carries the battery's allowlisted cells, and renders
 * one byte-stable receipt.
 *
 * The asymmetry between the two verdicts is the rubric, not an option:
 *
 *   - a **report** class cites one to five mined rows (`report-without-evidence`)
 *     and states its defect shape (`report-without-defect`) — a finding without
 *     evidence is a hunch, and a hunch is what this command exists to stop
 *     mailing upstream;
 *   - a **discard** class cites none (`discard-with-evidence`) and states a
 *     closed reason — it is a counted decision, not a finding.
 *
 * Nothing is guessed on the way out: a row no report class claims is counted in
 * `unclassified` (with the render line saying so), a row that no longer exists in
 * the mine receipt refuses the bundle by id, and a secret-shaped value refuses
 * the whole receipt instead of printing a partial one.
 */

import {
  BUNDLE_CONTRACT,
  DISCARD_REASONS,
  DoctorRefusal,
  MAX_CLASS_EVIDENCE,
  REPORT_REASONS,
  VERDICTS,
} from "./vocabulary.mjs";
import { redactedAnchor, sanitizeClass, sanitizeText, secretShape } from "./redact.mjs";

/** The fields a triage class may carry — anything else is a typo, refused. */
const CLASS_FIELDS = Object.freeze(["class", "verdict", "reason", "defect", "rows"]);

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

/**
 * Validate one model-authored text field: a secret refuses, everything else is
 * redacted at render time. The refusal names the field, never the value.
 */
function checkField(field, value) {
  const shape = secretShape(String(value ?? ""));
  if (shape !== null) {
    throw new DoctorRefusal("secret-shaped-value", `the ${field} field carries a ${shape}; a bundle never carries a credential`);
  }
}

/**
 * Validate the triage file and return the classes it declares, unchanged apart
 * from the shape checks.
 *
 * @param {unknown} triage
 * @returns {{classes: object[]}}
 */
export function parseTriage(triage) {
  const value = typeof triage === "string" ? JSON.parse(triage) : triage;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new DoctorRefusal("malformed-triage", "the triage file must be a JSON object carrying a `classes` array");
  }
  const classes = value.classes;
  if (!Array.isArray(classes)) {
    throw new DoctorRefusal("malformed-triage", "the triage file carries no `classes` array");
  }

  const seen = new Set();
  const parsed = classes.map((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new DoctorRefusal("malformed-triage", `class ${index + 1} is not an object`);
    }
    for (const key of Object.keys(entry)) {
      if (!CLASS_FIELDS.includes(key)) {
        throw new DoctorRefusal(
          "unknown-class-field",
          `class ${index + 1} carries "${key}"; the rubric's fields are ${CLASS_FIELDS.join(", ")}`,
        );
      }
    }
    checkField("class", entry.class);
    checkField("defect", entry.defect);
    checkField("reason", entry.reason);

    const slug = sanitizeClass(entry.class);
    if (slug === "") throw new DoctorRefusal("missing-class", `class ${index + 1} carries no usable slug`);
    if (seen.has(slug)) throw new DoctorRefusal("duplicate-class", `the class "${slug}" is declared twice`);
    seen.add(slug);

    if (!VERDICTS.includes(entry.verdict)) {
      throw new DoctorRefusal(
        "unknown-verdict",
        `class "${slug}" carries the verdict "${entry.verdict ?? ""}"; the rubric accepts ${VERDICTS.join(", ")}`,
      );
    }
    if (isBlank(entry.reason)) {
      throw new DoctorRefusal("missing-reason", `class "${slug}" states no reason; the rubric's reason column is required`);
    }
    const reason = String(entry.reason).trim();
    const legal = entry.verdict === "report" ? REPORT_REASONS : DISCARD_REASONS;
    if (!legal.includes(reason)) {
      const other = entry.verdict === "report" ? DISCARD_REASONS : REPORT_REASONS;
      if (other.includes(reason)) {
        throw new DoctorRefusal(
          "reason-verdict-mismatch",
          `the reason "${reason}" belongs to a ${entry.verdict === "report" ? "discard" : "report"} class, not a ${entry.verdict} one`,
        );
      }
      throw new DoctorRefusal(
        "unknown-reason",
        `class "${slug}" carries the reason "${reason}"; ${entry.verdict} accepts ${legal.join(", ")}`,
      );
    }

    const rows = entry.rows ?? [];
    if (!Array.isArray(rows)) {
      throw new DoctorRefusal("malformed-triage", `class "${slug}" carries a non-array \`rows\` field`);
    }
    if (entry.verdict === "discard" && rows.length > 0) {
      throw new DoctorRefusal(
        "discard-with-evidence",
        `class "${slug}" is discarded and cites ${rows.length} row(s); a discard is a counted decision, not a finding`,
      );
    }
    if (entry.verdict === "report" && rows.length === 0) {
      throw new DoctorRefusal("report-without-evidence", `class "${slug}" reports a defect and cites no mined row`);
    }
    if (rows.length > MAX_CLASS_EVIDENCE) {
      throw new DoctorRefusal(
        "too-many-rows",
        `class "${slug}" cites ${rows.length} rows; cite at most ${MAX_CLASS_EVIDENCE} and let \`occurrences\` carry the count`,
      );
    }
    if (entry.verdict === "report" && isBlank(entry.defect)) {
      throw new DoctorRefusal("report-without-defect", `class "${slug}" reports a defect and states no defect shape`);
    }
    return { class: slug, verdict: entry.verdict, reason, defect: isBlank(entry.defect) ? null : String(entry.defect).trim(), rows };
  });

  return { classes: parsed };
}

/** The battery cells the bundle may carry, all allowlisted (`S12`). */
function batteryCells(battery) {
  if (battery === null || battery === undefined) {
    return { runner: null, skills: null, doctor: null, ceremony: null };
  }
  const doctor = battery.doctor ?? null;
  return {
    runner: battery.runner ?? null,
    skills: battery.skills ?? null,
    doctor: doctor === null ? null : { contract: doctor.contract ?? null, verdict: doctor.verdict ?? null, summary: doctor.summary ?? null },
    ceremony: battery.ceremony ?? null,
  };
}

/**
 * Build the structured bundle `route` consumes and `renderBundle` prints.
 *
 * @param {{mine: object, triage: unknown, battery?: object}} input
 * @returns {object}
 */
export function buildBundle({ mine, triage, battery = null }) {
  if (mine === null || typeof mine !== "object" || !Array.isArray(mine.rows)) {
    throw new DoctorRefusal("malformed-mine", "bundle needs a mine receipt carrying a `rows` array");
  }
  const parsed = parseTriage(triage);
  const byId = new Map(mine.rows.map((row) => [row.id, row]));
  let redactions = 0;
  const classes = [];
  const discarded = [];

  for (const entry of parsed.classes) {
    const cited = entry.rows.map((id) => {
      const row = byId.get(String(id));
      if (row === undefined) {
        throw new DoctorRefusal("unknown-row", `class "${entry.class}" cites ${id}, which this mine receipt does not carry`);
      }
      return row;
    });
    const occurrences = mine.rows.filter((row) => row.kind === entry.class).length || cited.length;
    if (entry.verdict === "discard") {
      discarded.push({ class: entry.class, reason: entry.reason, occurrences });
      continue;
    }
    const clean = sanitizeText(entry.defect);
    redactions += clean.redactions.reduce((sum, item) => sum + item.count, 0);
    classes.push({
      class: entry.class,
      verdict: entry.verdict,
      reason: entry.reason,
      defect: clean.text,
      occurrences,
      evidence: cited.map((row) => redactedAnchor(row)),
    });
  }

  const cells = batteryCells(battery);
  const claimed = classes.reduce((sum, entry) => sum + entry.occurrences, 0);
  return {
    contract: BUNDLE_CONTRACT,
    corpus: { rows: mine.rows.length, units: mine.totals?.units ?? 0, mine: mine.contract ?? null },
    runner: cells.runner,
    skills: cells.skills,
    doctor: cells.doctor,
    ceremony: cells.ceremony,
    classes,
    discarded,
    redactions,
    unclassified: Math.max(mine.rows.length - claimed, 0),
    totals: {
      report: classes.length,
      discard: discarded.length,
      rows: mine.rows.length,
    },
  };
}

/** One cell of the header, or `n/a` with its reason. */
const cell = (value, fallback) => (value === null || value === undefined || value === "" ? fallback : String(value));

/**
 * The fixed receipt: the contract line, the allowlisted header cells, one
 * section per report class, the discarded table, the counts and the consent
 * line. Every byte is derived from the structured bundle, so `--json` and the
 * markdown can never disagree.
 *
 * @param {object} bundle
 * @returns {string}
 */
export function renderBundle(bundle) {
  const lines = [
    `WORKFLOW DOCTOR BUNDLE — contract ${bundle.contract} · ${bundle.totals.report} report class(es) · ${bundle.totals.discard} discarded · ${bundle.unclassified} unclassified row(s)`,
    `corpus: ${bundle.corpus.rows} mined row(s) · ${bundle.corpus.units} unit(s)${bundle.corpus.mine === null ? "" : ` · ${bundle.corpus.mine}`}`,
  ];

  if (bundle.runner === null) {
    lines.push("runner: n/a — no battery receipt attached");
  } else {
    lines.push(
      `runner: ${cell(bundle.runner.version, "unknown")} · pin ${cell(bundle.runner.pin, "unknown")}`
        + ` · ${cell(bundle.runner.pinMatch, "unknown")}`,
    );
  }
  lines.push(
    bundle.skills === null
      ? "skills: n/a — no battery receipt attached"
      : `skills: ${cell(bundle.skills.count, "unknown")} installed (${cell(bundle.skills.userInvocable, "unknown")} invocable)`,
  );
  lines.push(
    bundle.doctor === null
      ? "doctor: n/a — no battery receipt attached"
      : `doctor: ${cell(bundle.doctor.verdict, "unknown")} · ok ${cell(bundle.doctor.summary?.ok, 0)}`
        + ` · missing ${cell(bundle.doctor.summary?.missing, 0)} · advisories ${cell(bundle.doctor.summary?.advisories, 0)}`,
  );
  const adoption = bundle.ceremony?.adoption ?? null;
  const profile = adoption === null ? "none" : Object.entries(adoption).map(([piece, value]) => `${piece}:${value}`).join(",");
  lines.push(`ceremony: profile ${profile} · unit tier ${cell(bundle.ceremony?.tier, "none")}`);

  bundle.classes.forEach((entry, index) => {
    lines.push(`## Report class ${index + 1} — ${entry.class}`);
    lines.push(`reason: ${entry.reason}`);
    lines.push(`defect: ${entry.defect}`);
    lines.push(`occurrences: ${entry.occurrences}`);
    lines.push(`evidence: ${entry.evidence.join(" · ")}`);
  });

  if (bundle.discarded.length > 0) {
    lines.push("## Discarded");
    lines.push("| reason | class | occurrences |");
    lines.push("|---|---|---|");
    for (const entry of bundle.discarded) {
      lines.push(`| ${entry.reason} | ${entry.class} | ${entry.occurrences} |`);
    }
  }

  lines.push(`redactions: ${bundle.redactions}`);
  lines.push("filing requires explicit user consent: show this bundle to the user, then run `runner workflow-doctor publish --issue <n> --bundle <file> --yes` (or file the draft yourself)");
  return lines.join("\n");
}
