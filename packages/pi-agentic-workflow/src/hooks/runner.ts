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
 * byte cap with a truncation marker and the excess drained, so volume costs
 * memory nothing and never decides a verdict; every hook has a hard wall-clock
 * timeout. A hook that cannot prove it holds — non-zero exit, timeout, or a
 * process that cannot start at all — fails closed to `block` (the guard-verdict
 * policy, PE-004). The spawn-failure case settles from the child's `error`
 * event: an unlistened one throws at the process level and would take the host
 * down with it (PE-009/PE-010).
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
  /** Set when the process could not be started at all (`ENOENT`, `EACCES`). */
  spawnError?: string;
}

/** A minimal child contract so tests can inject a fake without a process. */
export interface HookChild {
  pid?: number | undefined;
  stdout: { on(event: "data", handler: (chunk: Buffer | string) => void): void };
  stderr: { on(event: "data", handler: (chunk: Buffer | string) => void): void };
  on(event: "close", handler: (code: number | null, signal: NodeJS.Signals | null) => void): void;
  on(event: "exit", handler: (code: number | null, signal: NodeJS.Signals | null) => void): void;
  on(event: "error", handler: (error: NodeJS.ErrnoException) => void): void;
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
    let outBytes = 0;
    let errBytes = 0;
    let truncated = false;
    let timedOut = false;
    let settled = false;

    const child = spawnImpl(argv, {
      cwd: options.cwd,
      shell: false,
      env: { ...process.env, ...runtimeEnv() },
      detached: true,
    });

    const capture = (sink: "stdout" | "stderr") => (chunk: Buffer | string) => {
      const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      const room = HOOK_OUTPUT_CAP_BYTES - (sink === "stdout" ? outBytes : errBytes);
      // The cap bounds what is KEPT, never the process: the remainder is drained
      // and dropped, so a talkative hook costs no memory and no verdict.
      if (room <= 0) {
        truncated = true;
        return;
      }
      const kept = text.length > room ? text.slice(0, room) : text;
      if (text.length > room) truncated = true;
      if (sink === "stdout") {
        stdout += kept;
        outBytes += kept.length;
      } else {
        stderr += kept;
        errBytes += kept.length;
      }
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

    /** A process that cannot start at all emits `'error'` and may never emit
     *  `'close'`: this is the settle point, and it fails closed. Without it the
     *  event is unhandled and takes the host process down (PE-009). */
    const onSpawnError = (error: NodeJS.ErrnoException): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        verdict: "block",
        exitCode: null,
        output: `could not start: ${error.message}`,
        truncated,
        timedOut,
        spawnError: error.message,
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

    child.on("error", onSpawnError);
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
 * requirement quoted exactly as written, its own quoting included, never
 * paraphrased and never re-joined from the argv (O21).
 */
export function seamBlockMessage(seam: string, declared: string, result: HookRunResult): string {
  const how = result.timedOut
    ? `did not finish within its timeout`
    : result.spawnError !== undefined
      ? `could not start (${result.spawnError})`
      : `failed (exit ${result.exitCode ?? "signal"})`;
  const output = result.output.trim().length > 0 ? `\nOutput (bounded):\n${result.output.trim()}` : "";
  return (
    `seam-hooks: blocked at ${seam} — the project's declared requirement \`${declared}\` ${how}.` +
    `${output}\n` +
    `The project declares this check at the ${seam} seam (.pi/hooks.json); resolve what it reports before continuing past this seam.`
  );
}
