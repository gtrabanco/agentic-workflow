// Shared session double for the routing suites.
//
// It mirrors the Pi behaviour the router depends on — most importantly that
// `setModel` fires a `model_select` for OUR OWN switch too, which is what makes
// the "never restore over the operator's choice" guard (D-P14) non-trivial.
// Model availability is scripted per reference.

import { createRouter } from "../../dist/routing/dispatch.js";
import { SETTINGS_COMMAND } from "../../dist/routing/types.js";
import { mergeConfigs } from "../../dist/config/merge.js";

export const modelRef = (reference) => {
  const slash = reference.indexOf("/");
  return { provider: reference.slice(0, slash), id: reference.slice(slash + 1) };
};

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
  const modelAt = (reference) => modelRef(reference);
  const entryFor = (reference) => catalog.get(reference);

  function emitModelSelect(ref) {
    // Pi fires the event for every actual change, ours included.
    router.noteModelSelect(ref);
  }

  const surface = () => ({
    sendUserMessage: (content, opts) => {
      log.sendUserMessage.push({ content, opts });
      log.sequence.push(`sendUserMessage:${content}`);
      // The turn the skill starts is what later settles.
      state.idle = false;
    },
    setModel: async (model) => {
      const reference = `${model.provider}/${model.id}`;
      log.setModel.push(reference);
      log.sequence.push(`setModel:${reference}`);
      const entry = entryFor(reference);
      if (!entry || entry.auth === false || selectFails) return false;
      const previous = state.model;
      state.model = modelAt(reference);
      if (!previous || previous.provider !== model.provider || previous.id !== model.id) emitModelSelect(state.model);
      return true;
    },
    getThinkingLevel: () => state.thinking,
    setThinkingLevel: (level) => {
      log.setThinkingLevel.push(level);
      log.sequence.push(`setThinkingLevel:${level}`);
      const previous = state.thinking;
      state.thinking = level;
      if (previous !== level) router.noteThinkingLevelSelect(level);
    },
  });

  const toContext = () => ({
    cwd,
    get model() {
      return state.model;
    },
    isIdle: () => state.idle,
    isProjectTrusted: () => state.trusted,
    notify: (message, kind) => log.notify.push({ message, kind }),
    find: (provider, modelId) => (catalog.has(`${provider}/${modelId}`) ? { provider, id: modelId } : undefined),
    hasConfiguredAuth: (model) => entryFor(`${model.provider}/${model.id}`)?.auth !== false,
  });

  const router = createRouter({
    surface,
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
      const key = `${ref.provider}/${ref.id}`;
      if (!catalog.has(key)) catalog.set(key, { auth: true });
      const previous = state.model;
      state.model = modelAt(key);
      if (!previous || previous.provider !== ref.provider || previous.id !== ref.id) router.noteModelSelect(state.model);
      return state.model;
    },
    operatorSelectsThinkingLevel(level) {
      const previous = state.thinking;
      state.thinking = level;
      if (previous !== level) router.noteThinkingLevelSelect(level);
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

export const command = (name = "plan-feature", skill = name) => ({ name, skill });
