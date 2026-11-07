import { spawn, type ChildProcess } from "node:child_process";

import type { GuardRejectionReason } from "@gtrabanco/agentic-workflow-schema";

import { runtimeEnv } from "../runtime.js";

/**
 * The seam-hooks runner — no-shell execution of one declared hook command
 * (issue #413, obligations O6/O7/O8/O9).
 *
 * Sanitization is structural, not filtered: the command is tokenized into an
 * argv (quotes are grouping, nothing else) and spawned with `shell: false`, so
 * there is no shell to interpolate anything into. Any shell metacharacter is
 * refused `config-invalid` before a process exists — a hook that needs a
 * pipeline must declare a wrapper script instead. Output is captured under a
 * byte cap with a truncation marker, and every hook has a hard wall-clock
 * timeout; a hook that cannot prove it holds (non-zero exit, timeout) fails
 * closed to `block` (the guard-verdict policy, PE-004).
 */

export const HOOK_OUTPUT_CAP_BYTES = 32 * 1024;
export const DEFAULT_HOOK_TIMEOUT_MS = 60_000;
export const MAX_HOOK_TIMEOUT_MS = 600_000;

/** The kill grace after SIGTERM before SIGKILL. */
const KILL_GRACE_MS = 500;
const TRUNCATION_MARKER = "\n[truncated]";

/**
 * Refused outright: every character with shell meaning. Quoting does not
 * rescue a refused character — the scan runs on the raw command, so a refused
 * command is refused however it is written. `=` in flags, `/`, `.`, `-` and
 * quotes themselves are the safe forms that survive.
 */
const FORBIDDEN_CHARS = new Set(["|", "&", ";", "<", ">", "(", ")", "$", "`", "\n", "\r", "*", "?", "[", "]", "{", "}", "~", "#"]);

export type TokenizeResult =
  | { ok: true; argv: string[] }
  | { ok: false; reason: GuardRejectionReason; detail: string };

export function tokenizeHookCommand(command: string): TokenizeResult {
  for (const char of command) {
    if (FORBIDDEN_CHARS.has(char)) {
      return {
        ok: false,
        reason: "config-invalid",
        detail: `command carries the shell metacharacter ${JSON.stringify(char)} — hooks run without a shell, so declare a wrapper script instead`,
      };
    }
  }
  const argv: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let started = false;
  for (const char of command) {
    if (quote !== null) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      started = true;
      continue;
    }
    if (char === " " || char === "\t") {
      if (started) argv.push(current);
      current = "";
      started = false;
      continue;
    }
    started = true;
    current += char;
  }
  if (quote !== null) return { ok: false, reason: "config-invalid", detail: "unterminated quote" };
  if (started) argv.push(current);
  if (argv.length === 0) return { ok: false, reason: "config-invalid", detail: "empty command" };
  return { ok: true, argv };
}

export interface HookRunResult {
  verdict: "allow" | "block";
  exitCode: number | null;
  output: string;
  truncated: boolean;
  timedOut: boolean;
}

/** A minimal child contract so tests can inject a fake without a process. */
export interface HookChild {
  pid?: number | undefined;
  stdout: { on(event: "data", handler: (chunk: Buffer | string) => void): void };
  stderr: { on(event: "data", handler: (chunk: Buffer | string) => void): void };
  on(event: "close", handler: (code: number | null, signal: NodeJS.Signals | null) => void): void;
  on(event: "exit", handler: (code: number | null, signal: NodeJS.Signals | null) => void): void;
  kill(signal?: NodeJS.Signals | number): void;
}

export type SpawnImpl = (argv: string[], options: { cwd: string; shell: false; env: NodeJS.ProcessEnv; detached: true }) => HookChild;

export interface RunArgvOptions {
  cwd: string;
  timeoutMs?: number;
  spawnImpl?: SpawnImpl;
}

/** Spawn one already-tokenized argv under the same no-shell contract. */
export function runArgv(argv: string[], options: RunArgvOptions): Promise<HookRunResult> {
  const spawnImpl: SpawnImpl = options.spawnImpl ?? defaultSpawn;
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? DEFAULT_HOOK_TIMEOUT_MS, 1), MAX_HOOK_TIMEOUT_MS);
  return new Promise<HookRunResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let truncated = false;
    let timedOut = false;
    let settled = false;
    let capKilled = false;

    const child = spawnImpl(argv, {
      cwd: options.cwd,
      shell: false,
      env: { ...process.env, ...runtimeEnv() },
      detached: true,
    });

    const capture = (sink: "stdout" | "stderr") => (chunk: Buffer | string) => {
      const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      const target = sink === "stdout" ? stdout : stderr;
      const room = HOOK_OUTPUT_CAP_BYTES - target.length;
      if (text.length > room) {
        if (sink === "stdout") stdout += text.slice(0, Math.max(room, 0));
        else stderr += text.slice(0, Math.max(room, 0));
        truncated = true;
        // The cap is a hard bound, not a soft request: an endless producer is
        // cut off here rather than streamed to the timeout.
        if (!capKilled) {
          capKilled = true;
          killTree("SIGTERM");
        }
        return;
      }
      if (sink === "stdout") stdout += text;
      else stderr += text;
    };
    child.stdout.on("data", capture("stdout"));
    child.stderr.on("data", capture("stderr"));

    const onDone = (code: number | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      let output = stdout;
      if (stderr.length > 0) output = output.length > 0 ? `${output}\n${stderr}` : stderr;
      if (output.length > HOOK_OUTPUT_CAP_BYTES) {
        output = output.slice(0, HOOK_OUTPUT_CAP_BYTES);
        truncated = true;
      }
      if (truncated) output = `${output}${TRUNCATION_MARKER}`;
      const allow = code === 0 && !timedOut;
      resolve({
        verdict: allow ? "allow" : "block",
        exitCode: code,
        output,
        truncated,
        timedOut,
      });
    };

    /** Kill the whole process group: a killed wrapper script must not leave a
     *  grandchild holding the stdio pipes (the close event waits on them). */
    const killTree = (signal: NodeJS.Signals): void => {
      try {
        if (child.pid !== undefined) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch {
        child.kill(signal);
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killTree("SIGTERM");
      const hardKill = setTimeout(() => killTree("SIGKILL"), KILL_GRACE_MS);
      hardKill.unref?.();
    }, timeoutMs);
    timer.unref?.();

    child.on("close", onDone);
    child.on("exit", onDone);
  });
}

function defaultSpawn(argv: string[], options: { cwd: string; shell: false; env: NodeJS.ProcessEnv; detached: true }): HookChild {
  return spawn(argv[0], argv.slice(1), {
    cwd: options.cwd,
    shell: false,
    env: options.env,
    detached: options.detached,
    stdio: ["ignore", "pipe", "pipe"],
  }) as ChildProcess as HookChild;
}

export interface HookCommandHandlerLike {
  command: string;
  timeout?: number;
}

export interface RunHookOptions extends RunArgvOptions {}

/** Tokenize then run one declared handler; a refused command fails closed. */
export async function runHookCommand(handler: HookCommandHandlerLike, options: RunHookOptions): Promise<HookRunResult> {
  const tokenized = tokenizeHookCommand(handler.command);
  if (!tokenized.ok) {
    return {
      verdict: "block",
      exitCode: null,
      output: tokenized.detail,
      truncated: false,
      timedOut: false,
    };
  }
  const timeoutMs = handler.timeout !== undefined ? handler.timeout * 1000 : undefined;
  return runArgv(tokenized.argv, { ...options, timeoutMs });
}

/**
 * O8: the teaching message — non-zero exit blocks the seam with the declared
 * requirement quoted, exactly as declared, never paraphrased.
 */
export function seamBlockMessage(seam: string, argv: string[], result: HookRunResult): string {
  const how = result.timedOut
    ? `did not finish within its timeout`
    : `failed (exit ${result.exitCode ?? "signal"})`;
  const output = result.output.trim().length > 0 ? `\nOutput (bounded):\n${result.output.trim()}` : "";
  return (
    `seam-hooks: blocked at ${seam} — the project's declared requirement \`${argv.join(" ")}\` ${how}.` +
    `${output}\n` +
    `The project declares this check at the ${seam} seam (.pi/hooks.json); resolve what it reports before continuing past this seam.`
  );
}
