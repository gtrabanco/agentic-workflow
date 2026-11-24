/**
 * pi-web.mjs — the one resolution of "is this a PI WEB session, and where is its
 * session daemon" (issue #705).
 *
 * Two consumers ask that question: the router (`unit-route.mjs`, which prints
 * the lane's Relay addendum) and the doctor's `relay` row (which reports the
 * capability before a packet exists). `IR11` allows one copy, so this module is
 * it, and both import it.
 *
 * The resolution mirrors the host's own, never a guess: the marker is the exact
 * variable a PI WEB session exports, the endpoint is what PI WEB's session
 * daemon module resolves (`PI_WEB_SESSIOND_SOCKET`, else
 * `<PI_WEB_DATA_DIR>/sessiond.sock`, the data dir defaulting to `~/.pi-web`, and
 * a configured `PI_WEB_SESSIOND_PORT` meaning TCP with no socket file), and the
 * bridge wording is the host's own failure sentence. Read-only: nothing here
 * spawns, connects or writes.
 */

import path from "node:path";

/** The marker a PI WEB session exports into every process it spawns. */
export const PI_WEB_SESSION_ENV = "PI_WEB_SESSION";
/** PI WEB's data directory — the default parent of the daemon socket. */
export const PI_WEB_DATA_DIR_ENV = "PI_WEB_DATA_DIR";
/** The daemon socket, when the host was pointed at one explicitly. */
export const PI_WEB_SESSIOND_SOCKET_ENV = "PI_WEB_SESSIOND_SOCKET";
/** A TCP endpoint instead of the socket: `PI_WEB_SESSIOND_PORT` (+ `_HOST`). */
export const PI_WEB_SESSIOND_PORT_ENV = "PI_WEB_SESSIOND_PORT";
export const PI_WEB_SESSIOND_HOST_ENV = "PI_WEB_SESSIOND_HOST";
/** The versioned host protocol `dispatch_relay` emits — the bridge itself. */
export const SESSION_DISPATCH_PROTOCOL = "pi-web:session-dispatch:v1";
/**
 * The exact wording the host's dispatch tool fails with when no listener accepts
 * the event. Consumers cite the host's sentence rather than inventing a second
 * one for the same fact.
 */
export const RELAY_BRIDGE = "dispatch_relay requires PI WEB's session dispatch bridge";

/** A PI WEB session is the only deterministic presence marker a process can read. */
export function piWebPresent(env = process.env) {
  return String(env?.[PI_WEB_SESSION_ENV] ?? "") === "1";
}

/** `PI_WEB_DATA_DIR` (resolved against `cwd`, as PI WEB resolves it) or `~/.pi-web`. */
export function piWebDataDir(env = process.env, { home = "", cwd = process.cwd() } = {}) {
  const configured = String(env?.[PI_WEB_DATA_DIR_ENV] ?? "").trim();
  if (configured !== "") return path.resolve(cwd, configured);
  return path.join(home !== "" ? home : String(env?.HOME ?? ""), ".pi-web");
}

/**
 * Where the session daemon answers: a socket path, or a TCP address when the
 * host was configured with a port. `path` is `null` for a TCP endpoint — a probe
 * that reads the filesystem can judge a socket's presence and must not judge an
 * address it never dialled.
 */
export function sessiondEndpoint(env = process.env, { home = "", cwd = process.cwd() } = {}) {
  const port = String(env?.[PI_WEB_SESSIOND_PORT_ENV] ?? "").trim();
  if (port !== "") {
    const host = String(env?.[PI_WEB_SESSIOND_HOST_ENV] ?? "").trim() || "127.0.0.1";
    return { kind: "tcp", path: null, endpoint: `${host}:${port}` };
  }
  const configured = String(env?.[PI_WEB_SESSIOND_SOCKET_ENV] ?? "").trim();
  const socket = configured !== "" ? path.resolve(cwd, configured) : path.join(piWebDataDir(env, { home, cwd }), "sessiond.sock");
  return { kind: "socket", path: socket, endpoint: socket };
}
