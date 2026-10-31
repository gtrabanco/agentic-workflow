#!/usr/bin/env node
/**
 * workspace.mjs — ceremony `workspace` module (issue #338 P0).
 *
 * All git operations the ceremony uses, as closed JSON operations:
 * status, clean-check, pr-status, diff-scope, diff-files-only, diff-stat,
 * main-check, hash-object, file-content, find-files, grep.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  git, out, fail, block, parseFlags, cleanCheck, walk, globToRe,
} from "./lib.mjs";

function diffRange(from, to, cwd) {
  const numstat = git(["diff", "--numstat", `${from}..${to}`], cwd).split("\n").filter(Boolean);
  const files = numstat.map((l) => {
    const [added, deleted, file] = l.split("\t");
    return { file, added: added === "-" ? 0 : Number(added), deleted: deleted === "-" ? 0 : Number(deleted), binary: added === "-" };
  });
  return {
    files,
    "lines-added": files.reduce((a, f) => a + f.added, 0),
    "lines-deleted": files.reduce((a, f) => a + f.deleted, 0),
  };
}

function rangeArgs(flags, cwd) {
  const a = flags._ ?? [];
  if (a.length === 1 && a[0].includes("..")) return a[0].split("..");
  if (a.length === 2) return a;
  fail("missing-flag", { flag: "<from>..<to>" });
}

export function workspace(op, argv, cwd = process.cwd()) {
  switch (op) {
    case "status": {
      parseFlags(argv, []);
      const rows = git(["status", "--porcelain=v1"], cwd).split("\n").filter(Boolean).map((l) => ({
        file: l.slice(3),
        index: l[0],
        working: l[1],
        staged: l[0] !== " " && l[0] !== "?",
      }));
      out({ status: rows });
    }
    case "clean-check": {
      parseFlags(argv, []);
      out(cleanCheck(cwd));
    }
    case "pr-status": {
      parseFlags(argv, []);
      const raw = git(["status", "-sb"], cwd).split("\n")[0];
      const m = raw.match(/^## ([^.]+)(?:\.\.\.(\S+))?(?: \[(ahead (\d+))?(?:, )?(behind (\d+))?\])?/);
      if (!m) fail("no-branch");
      out({
        branch: m[1],
        base: m[2] ?? null,
        ahead: Number(m[3] ?? 0),
        behind: Number(m[5] ?? 0),
      });
    }
    case "diff-scope": {
      const [from, to] = rangeArgs(parseFlags(argv, []), cwd);
      out(diffRange(from, to, cwd));
    }
    case "diff-files-only": {
      const [from, to] = rangeArgs(parseFlags(argv, []), cwd);
      out({ files: diffRange(from, to, cwd).files.map((f) => f.file) });
    }
    case "diff-stat": {
      const [from, to] = rangeArgs(parseFlags(argv, []), cwd);
      out({
        stat: git(["diff", "--stat", `${from}..${to}`], cwd),
        shortstat: git(["diff", "--shortstat", `${from}..${to}`], cwd),
      });
    }
    case "main-check": {
      const [from, to] = rangeArgs(parseFlags(argv, []), cwd);
      const commits = git(["log", "--format=%H %s", `${from}..${to}`], cwd).split("\n").filter(Boolean)
        .map((l) => ({ sha: l.slice(0, 40), message: l.slice(41) }));
      const onMain = new Set(git(["rev-list", "main"], cwd).split("\n"));
      const commitsOnMain = commits.filter((c) => onMain.has(c.sha));
      if (commitsOnMain.length) block({ check: "main-check", clean: false, "commits-on-main": commitsOnMain });
      out({ check: "main-check", clean: true, "commits-on-main": [] });
    }
    case "hash-object": {
      const flags = parseFlags(argv, ["path"]);
      const p = path.join(cwd, flags.path);
      if (!fs.existsSync(p)) fail("missing-file", { path: flags.path });
      out({ path: flags.path, sha: git(["hash-object", p], cwd) });
    }
    case "file-content": {
      const flags = parseFlags(argv, ["sha", "path"]);
      let content;
      try {
        content = git(["show", `${flags.sha}:${flags.path}`], cwd);
      } catch {
        fail("missing-object", { sha: flags.sha, path: flags.path });
      }
      out({ path: flags.path, sha: flags.sha, content });
    }
    case "find-files": {
      const flags = parseFlags(argv, ["ext"]);
      if (!flags._?.length) fail("missing-flag", { flag: "<glob>" });
      const re = globToRe(flags._[0]);
      let files = walk(cwd, cwd).filter((f) => re.test(f));
      if (flags.ext) files = files.filter((f) => f.endsWith(`.${flags.ext.replace(/^\./, "")}`));
      out({ files });
    }
    case "grep": {
      const flags = parseFlags(argv, ["glob", "limit"]);
      if (!flags._?.length) fail("missing-flag", { flag: "<pattern>" });
      const re = new RegExp(flags._[0]);
      const globRe = flags.glob ? globToRe(flags.glob) : null;
      const limit = Number(flags.limit ?? 200);
      const hits = [];
      for (const file of walk(cwd, cwd)) {
        if (globRe && !globRe.test(file)) continue;
        const lines = fs.readFileSync(path.join(cwd, file), "utf8").split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            hits.push({ file, line: i + 1, content: lines[i].slice(0, 200) });
            if (hits.length >= limit) break;
          }
        }
        if (hits.length >= limit) break;
      }
      out({ hits, count: hits.length, limit });
    }
    default:
      fail("unknown-subcommand", { object: "workspace", subcommand: op });
  }
}
