// Shared session double for the routing suites.
//
// It mirrors the Pi behaviour the router depends on, and only this package's
// tests use it:
//  - `setModel` fires `model_select` for OUR OWN switch too, and
//  - `setModel` RE-DERIVES the thinking level and applies it before returning
//    (`agent-session.js`: `const thinkingLevel = this._getThinkingLevelForModelSwitch(model)`
//    … `this.setThinkingLevel(thinkingLevel)`), per-model override first, then
//    the global default, then the level the session already had;
//  - setting the level the session already has is a no-op that fires nothing.
// The second rule is why "restore the model" is not enough for AC8: switching a
// model moves thinking, so a route that only names a model still has to put the
// operator's level back. A double without it hid exactly that bug.
// Model availability is scripted per reference.

import { createRouter } from "../../dist/routing/dispatch.js";
import { THINKING_LEVELS } from "../../dist/config/types.js";
import { SETTINGS_COMMAND } from "../../dist/routing/types.js";
import { mergeConfigs } from "../../dist/config/merge.js";

export const modelRef = (reference) => {
  const slash = reference.indexOf("/");
  return { provider: reference.slice(0, slash), id: reference.slice(slash + 1) };
};

export const refKey = (model) => `${model.provider}/${model.id}`;

export function routePair({ model = "inherit", thinking = "inherit" } = {}) {
  return { model, thinking };
}

/** EffectiveConfig from the same merge the shipped loader performs. */
export function configFor({ default: def, commands, onUnavailableRoute }) {
  return mergeConfigs(
    { ...(def ? { default: def } : {}), ...(commands ? { commands } : {}), ...(onUnavailableRoute ? { onUnavailableRoute } : {}) },
    {},
  );
}

export function createSession(options = {}) {
  const {
    config = configFor({}),
    problems = [],
    ok = true,
    models = {},
    initialModel = "anthropic/claude-sonnet-4-5",
    initialThinking = "medium",
    trusted = true,
    idle = true,
    cwd = "/fixture/repo",
    selectFails = false,
    /** The routed turn cannot be started: `sendUserMessage` throws, like Pi's `prompt()` does. */
    sendThrows = false,
    /** Pi's per-model thinking overrides, keyed by `provider/modelId`. */
    modelThinking = {},
    /** Pi's global default thinking level, consulted on every model switch. */
    defaultThinking,
    /**
     * Pi clamps a level the model cannot run (`_modelSupportsThinking` +
     * `clampThinkingLevel`, `core/agent-session.js`), keyed by `provider/modelId`.
     * Without this the double reports back what was *asked* for, and the router
     * can never see the case where the session ended somewhere else.
     */
    supportedThinking = {},
  } = options;

  const state = {
    model: initialModel ? modelRef(initialModel) : undefined,
    thinking: initialThinking,
    idle,
    trusted,
  };
  const log = { setModel: [], setThinkingLevel: [], sendUserMessage: [], notify: [], sequence: [] };

  // Pi's registry knows a model even when its credentials are missing, so the
  // catalogue and the auth flag are separate: AC9 asks "not found" first and
  // "no configured credentials" second. The session's own starting model is in
  // the catalogue too, otherwise a restore could never succeed.
  const catalog = new Map(Object.entries(models).map(([ref, entry]) => [ref, entry === true ? { auth: true } : entry]));
  if (initialModel && !catalog.has(initialModel)) catalog.set(initialModel, { auth: true });
  const entryFor = (reference) => catalog.get(reference);

  const derivedThinkingFor = (reference) => modelThinking[reference] ?? defaultThinking ?? state.thinking;

  // `void emit(...)` in Pi means a *programmatic* set announces itself a microtask
  // later — i.e. after `dispatch()` has registered the turn, which is exactly when
  // the router must tell its own write from an operator's (the clamped-level bug).
  // The operator's own choice is announced on the spot: their click happened
  // during a turn that is long over by the time the router reads the flag.
  const announceThinking = (level) => queueMicrotask(() => router.noteThinkingLevelSelect(level));
  const clampThinking = (level, reference) => {
    const supported = supportedThinking[reference];
    if (!supported || supported.includes(level)) return level;
    const rank = (candidate) => THINKING_LEVELS.indexOf(candidate);
    return supported.reduce((best, candidate) => (rank(candidate) > rank(best) ? candidate : best), supported[0]);
  };

  const api = {
    sendUserMessage: (content, opts) => {
      if (sendThrows) throw new Error("send failed: compaction in progress");
      log.sendUserMessage.push({ content, opts });
      log.sequence.push(`sendUserMessage:${content}`);
      // The turn the skill starts is what later settles.
      state.idle = false;
    },

    async setModel(model) {
      const reference = refKey(model);
      log.setModel.push(reference);
      log.sequence.push(`setModel:${reference}`);
      const entry = entryFor(reference);
      if (!entry || entry.auth === false || selectFails) return false;

      const previous = state.model;
      state.model = modelRef(reference);
      if (!previous || refKey(previous) !== reference) {
        router.noteModelSelect(state.model);
        api.setThinkingLevel(derivedThinkingFor(reference));
      }
      return true;
    },

    getThinkingLevel: () => state.thinking,

    setThinkingLevel(level) {
      // Pi writes the *clamped* level and announces that one, so a request for a
      // level the model cannot run leaves the session elsewhere — silently.
      const effective = clampThinking(level, refKey(state.model));
      if (state.thinking === effective) return;
      log.setThinkingLevel.push(effective);
      log.sequence.push(`setThinkingLevel:${effective}`);
      state.thinking = effective;
      announceThinking(effective);
    },
  };

  const toContext = () => ({
    cwd,
    get model() {
      return state.model;
    },
    isIdle: () => state.idle,
    isProjectTrusted: () => state.trusted,
    notify: (message, kind) => log.notify.push({ message, kind }),
    find: (provider, modelId) => (catalog.has(`${provider}/${modelId}`) ? { provider, id: modelId } : undefined),
    hasConfiguredAuth: (model) => entryFor(refKey(model))?.auth !== false,
    ui: { notify: (message, kind) => log.notify.push({ message, kind }) },
    availableModels: () => [...catalog.keys()].map(modelRef),
  });

  const router = createRouter({
    surface: () => api,
    loadConfig: options.loadConfig ?? (() => ({ ok, config, problems })),
    hint: options.hint ?? { pending: () => false, acknowledge: () => true },
    settingsCommand: SETTINGS_COMMAND,
    knownCommands: new Set(options.knownCommands ?? ["plan-feature", "design-feature", "execute-phase", SETTINGS_COMMAND]),
  });

  return {
    router,
    state,
    log,
    context: toContext,
    /** Simulate the operator changing the model mid-turn (`/model`, Ctrl+P). */
    operatorSelectsModel(reference) {
      const ref = typeof reference === "string" ? modelRef(reference) : reference;
      const key = refKey(ref);
      if (!catalog.has(key)) catalog.set(key, { auth: true });
      const previous = state.model;
      state.model = modelRef(key);
      if (!previous || refKey(previous) !== key) router.noteModelSelect(state.model);
      return state.model;
    },
    operatorSelectsThinkingLevel(level) {
      const effective = clampThinking(level, refKey(state.model));
      if (state.thinking !== effective) {
        log.setThinkingLevel.push(effective);
        log.sequence.push(`setThinkingLevel:${effective}`);
        state.thinking = effective;
      }
      router.noteThinkingLevelSelect(effective);
      return state.thinking;
    },
    /** Pi `agent_settled`: the routed turn is over; the session is idle again. */
    async settle() {
      state.idle = true;
      await router.settle(toContext());
    },
    dispatch(command, args = "", contextOverrides = {}) {
      const base = toContext();
      return router.dispatch(command, args, { ...base, ...contextOverrides });
    },
    notifications: () => log.notify.map((entry) => entry.message),
  };
}

/**
 * A routed command. Pi expands `/skill:<x>` by matching the skill's frontmatter
 * `name:` (`agent-session.js` `_expandSkillCommand` → `skills.find((s) => s.name === skillName)`)
 * and passes an unknown key through as literal text, so the dispatch key is the
 * NAME. `skill` is the bundled directory and must never be what goes on the wire.
 */
export const command = (name = "plan-feature", skill = name) => ({ name, skill });
