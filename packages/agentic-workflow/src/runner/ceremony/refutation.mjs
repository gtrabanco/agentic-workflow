/**
 * refutation.mjs — ceremony `refutation` module (issue #352 P4): prove a finding
 * against the revision it names, instead of trusting it.
 *
 * A finding is *confirmed* when the content it quotes is present at the sha it
 * cites, and *refuted* when the revision does not carry that content. The method
 * is named in the answer, so a reader can tell a proof from a claim.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { out, fail, onlyFlags, parseFlags, git } from "../lib.mjs";

/** The bytes of one path at one revision, or null when the revision lacks it. */
function contentAt(sha, file) {
  try {
    return git(["show", `${sha}:${file}`]);
  } catch {
    return null;
  }
}

/** Confirm or refute one finding: its quoted text against the cited revision. */
function verifyOne(sha, finding) {
  const file = finding.file ?? finding.target?.split(":")[0];
  const line = Number(finding.line ?? finding.target?.split(":")[1] ?? 0);
  const quote = finding.finding ?? finding.text ?? "";
  if (typeof file !== "string" || file === "") return { finding: quote, verified: "refuted", method: "no-file", evidence: "the finding names no file" };
  const content = contentAt(sha, file);
  if (content === null) return { finding: quote, verified: "refuted", method: "absent-at-sha", evidence: `${file} does not exist at ${sha}` };
  const lines = content.split("\n");
  if (line > 0 && line <= lines.length) {
    const actual = lines[line - 1].trim();
    const needle = quote.trim();
    if (needle !== "" && actual.includes(needle)) return { finding: quote, verified: "confirmed", method: "line-contains-quote", evidence: actual };
    if (needle !== "" && !actual.includes(needle)) return { finding: quote, verified: "refuted", method: "line-differs", evidence: actual };
    return { finding: quote, verified: "confirmed", method: "line-exists", evidence: actual };
  }
  if (line > lines.length) return { finding: quote, verified: "refuted", method: "line-past-eof", evidence: `${file} at ${sha} has ${lines.length} lines` };
  const present = quote.trim() === "" ? true : content.includes(quote.trim());
  return { finding: quote, verified: present ? "confirmed" : "refuted", method: "file-contains-quote", evidence: `${file} at ${sha}` };
}

export function refutation(op, argv) {
  switch (op) {
    case "verify": {
      const flags = parseFlags(argv, ["sha", "findings"], ["sha", "findings"]);
      onlyFlags(flags, ["sha", "findings"]);
      let findings;
      try {
        findings = JSON.parse(String(flags.findings));
      } catch {
        fail("bad-json", { flag: "--findings" });
      }
      if (!Array.isArray(findings)) fail("bad-findings", { expected: "[{ file, line, finding }]" });
      out({ sha: flags.sha, results: findings.map((finding) => verifyOne(flags.sha, finding)) });
    }
    case "verify-file": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const [sha, file, line] = flags._;
      if (sha === undefined || file === undefined) fail("usage", { usage: "ceremony refutation verify-file <sha> <file> <line>" });
      const content = contentAt(sha, file);
      if (content === null) out({ found: false, sha, file, "actual-content": null });
      const lines = content.split("\n");
      const index = line === undefined ? null : Number(line);
      const actual = index === null ? null : (lines[index - 1] ?? null);
      out({ found: index === null || actual !== null, sha, file, line: index, "actual-content": index === null ? content : actual });
    }
    default:
      fail("unknown-op", { object: "refutation", op, ops: ["verify", "verify-file"] });
  }
}
