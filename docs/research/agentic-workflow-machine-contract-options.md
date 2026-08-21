# Machine contracts for `agentic-workflow` and `agentic-workflow-loop`

Research date: 2026-08-21

## Scope

This note compares ways to automate the existing human-readable skills without
turning them into a second product. It focuses on the skills-side root cause in
[agentic-workflow #134](https://github.com/gtrabanco/agentic-workflow/issues/134)
and the bounded-repair gap in
[agentic-workflow-loop #18](https://github.com/gtrabanco/agentic-workflow-loop/issues/18).
It does not propose implementing either issue here.

## Conclusion

Do **not** fork the skills into a parallel JSON edition. Keep one skill set and
two presentation modes:

1. unrestricted prose, tools, and Markdown for interactive work;
2. a small, versioned machine contract enabled by the driver for headless work.

The important refinement is that the model should not be responsible for facts
the driver can calculate. Git, the forge, verification commands, and
versioned project artifacts should produce typed facts; the model should only
produce the semantic residual (verdict, classified blockers, unresolved
questions, rationale, and recommended transition). The driver composes both
parts, validates the result, stores a typed event, and derives a human report.

This is the middle ground between “make every skill JSON-heavy” and “parse the
prose after the fact.” OpenAI and Anthropic both expose constrained JSON/schema
surfaces for outputs and tool calls, but both also document exceptional stop
conditions, so application-side validation and explicit failure handling remain
necessary. OpenAI recommends function calling for application operations and a
structured response format for a typed final response; Anthropic says parsing
free-form text to recover structured intent is a sign that the structure belongs
in the schema. [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs),
[OpenAI Agents SDK schemas](https://openai.github.io/openai-agents-js/guides/schemas/),
[Anthropic tool-use contract](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works),
[Anthropic Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

## What mature systems do

| Pattern | Primary example | Relevant lesson |
|---|---|---|
| Constrain and validate model output at the boundary | OpenAI Agents SDK accepts Zod, Standard Schema, or JSON Schema for `outputType`; Zod/Standard Schema outputs are validated locally. Anthropic JSON outputs and strict tool use use grammar-constrained sampling. [OpenAI Agents](https://openai.github.io/openai-agents-js/guides/agents/#output-types), [OpenAI schema validation](https://openai.github.io/openai-agents-js/guides/schemas/), [Anthropic strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use) | Prefer provider-native structured output when available, but keep one provider-neutral JSON Schema and local validator as the contract. |
| Separate durable state from conversation text | LangGraph checkpoints graph state per thread for resumption, human approval, time travel, and fault tolerance. Temporal persists workflow state/event history and replays from the latest recorded event. [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence), [Temporal Workflow Execution](https://docs.temporal.io/workflow-execution) | A transcript or final assistant message is evidence, not the workflow database. Persist normalized transitions and project snapshots independently. |
| Retry only the failure-prone boundary, with an explicit budget | LangGraph attaches retry policies to individual nodes and exposes attempt identity; Temporal places failure-prone/non-deterministic calls in Activities and distinguishes transient retries from permanent input/logic failures. [LangGraph retry policies](https://docs.langchain.com/oss/javascript/langgraph/use-graph-api#add-retry-policies), [Temporal retry policies](https://docs.temporal.io/encyclopedia/retry-policies) | Treat envelope formatting/validation as one small retryable node. Do not repeat the whole skill turn or any side effects. Record the attempt and stop after the configured repair budget. |
| Let producers publish explicit outputs and preserve larger artifacts separately | GitHub Actions passes named step/job outputs through `$GITHUB_OUTPUT` and `needs`, while artifacts retain files such as logs, test results, and coverage. [GitHub job outputs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/pass-job-outputs), [GitHub workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts) | Keep the routing envelope small. Put detailed receipts, transcripts, plans, findings, and reports in referenced artifacts. |
| Carry machine fields and a human rendering together | `rustc` emits JSON Lines with typed diagnostics, locations, applicability, and an optional `rendered` diagnostic. Cargo adds a discriminating `reason` field and explicitly versions its metadata format. SARIF combines stable rule identifiers, typed severity/location data, and plain-text or Markdown messages intended for users. [rustc JSON output](https://doc.rust-lang.org/rustc/json.html), [Cargo external-tool formats](https://doc.rust-lang.org/cargo/reference/external-tools.html), [SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html) | “Machine or human” is a false choice. Keep stable IDs and enums authoritative; include narrative as display data, not as a second state source. |

These examples support adopting the patterns, not their frameworks. Adding
Temporal or LangGraph to the current Bun/SQLite runtime merely to obtain
checkpointing would add substantial operational and conceptual weight. A small
runtime can implement the needed subset: typed state, append-only events,
bounded retries, stable execution identity, and snapshot reconciliation.

## Option comparison

| Option | Strengths | Failure modes / cost | Verdict |
|---|---|---|---|
| Add a driver-only envelope to the existing skills | One workflow definition; interactive turns remain natural; fixes and model guidance remain shared; compatible with text-only agents. | Repeating the whole schema or vocabulary in every skill increases prompt size and creates drift; prompted JSON can still be invalid. | **Use, but keep it thin and generated/referenced.** Each skill needs only its legal states and its mapping from native verdicts to canonical fields. |
| Fork as `agentic-workflow-json` | Clean headless prompts; no visible JSON concerns in the human version; could be tuned independently. | Every behavior, security rule, acceptance check, rename, and bug fix gains a second implementation. Divergence becomes likely precisely where correctness matters. | **Reject as the default.** A generated adapter/profile is acceptable; a hand-maintained fork is not. |
| Parse generated Markdown/prose | No change to agent output; useful for old repositories and read-only status discovery; deterministic when the document grammar is genuinely fixed. | Markdown syntax does not define workflow meaning. Changed headings, synonyms, stale docs, prose contradictions, and missing fields either break the parser or silently create wrong state. It cannot prove live Git/PR/CI facts. | **Use only as a source-specific sensor and migration adapter, never as the routing authority.** |
| Deterministic envelope plus narrative summary | Good human UX and stable routing; can preserve nuance; matches compiler/SARIF-style producer patterns. | Machine and narrative views can disagree unless one is authoritative or the narrative is generated from typed data. | **Recommended.** Typed fields and evidence references are authoritative; the summary is explicitly descriptive. |
| Provider tool/function call as the only machine output | Keeps the structured payload separate from prose and can guarantee the argument shape in strict modes. | Tool availability, forcing semantics, schema subsets, and runner behavior vary across Pi/OpenCode/providers; it weakens portability. A final tool call can also interfere with a working turn. | **Optional adapter optimization**, especially for a dedicated formatter turn, not the portable contract. |

### The strongest case against the recommendation

A JSON fork creates a very clean conceptual boundary: the human skills optimize
for reasoning and communication, while the fork can remove every ambiguous
phrase and require exactly one object. If the two products had different owners,
release schedules, or supported behaviors, that separation could be justified.

Here they express the same workflow, however. The hard part is not serialization;
it is preserving every product question, acceptance invariant, security check,
side effect, and completion gate. A fork duplicates exactly that high-risk logic.
It also does not eliminate model mistakes unless the runtime constrains and
validates the output. Therefore the cleaner local prompt creates a worse global
maintenance boundary.

### The strongest case for parsing Markdown

Parsing artifacts is attractive because the repository already contains the
roadmap, plans, progress, decisions, findings, and acceptance receipts. It can
also calculate useful state without another LLM call. That part is correct: a
deterministic document sensor should exist.

The mistake would be asking one generic Markdown parser to infer the entire
workflow. Each artifact needs a versioned grammar and an owning adapter. An
adapter may extract phase names from fixed `P<n>` headings or roadmap order from
a locked table, but ambiguity must produce `unknown`/`contradiction`, not a
guess. Live branch, SHA, PR, CI, issue, and verification facts must come from
their actual producers.

## Bun 1.4 Markdown: useful tokenizer, not a semantic contract

The current Bun 1.4 documentation exposes three Markdown APIs:
`Bun.markdown.html()`, `Bun.markdown.render()`, and
`Bun.markdown.react()`, and marks the API **unstable**. The documented public
surface does not return a Markdown AST. `render()` invokes callbacks for
syntactic elements; callbacks receive accumulated child text plus small metadata
such as heading level, code language, list depth, or task-list state.
[Bun Markdown](https://bun.com/docs/runtime/markdown),
[Bun render callbacks](https://bun.com/docs/runtime/markdown#bun-markdown-render).

That is enough to build a lightweight structural scanner for known templates.
It is not enough to make prose such as “this phase is effectively complete but
awaiting review” semantically stable. This limitation is not a performance
problem; it is a missing document contract. Because the API is unstable, a
production adapter should also pin Bun, hide it behind an internal interface,
and lock behavior with fixtures before an upgrade.

For facts that authors must edit directly, a fenced/versioned YAML or JSON block
is safer than interpreting headings and paragraphs. Bun 1.4 has a built-in YAML
parser that returns JavaScript objects and throws on invalid syntax.
[Bun YAML](https://bun.com/docs/runtime/yaml). A sidecar file is also viable,
but it must be canonical or generated; manually maintaining equivalent Markdown
and JSON sidecars recreates the same drift problem.

## Recommended design: one workflow, two views, three layers

### 1. Portable skill contract

Keep the current user-facing skills optimized for their real job: discovery,
questions, research, implementation, verification, and review. Retain the
driver-only envelope behavior already described by
[`orchestration-envelope`](../../skills/orchestration-envelope/SKILL.md).

Do not paste the complete common schema into every skill. Give each skill a
small machine profile containing only:

- legal terminal states for that skill;
- canonical mapping from each native verdict/finding/blocker to the shared
  contract;
- its optional typed detail payload;
- one valid example per materially different terminal state.

The shared contract should have one executable, versioned source in Git. Generate
TypeScript types, JSON Schema, prompt snippets, and shared documentation from it,
then test every skill profile against the generated validator. Cargo's explicit
format version and forward-compatibility guidance are the relevant precedent.
[Cargo external-tool formats](https://doc.rust-lang.org/cargo/reference/external-tools.html),
[rustc JSON compatibility guidance](https://doc.rust-lang.org/rustc/json.html).

### 2. Turn compiler and validation boundary

Split a turn result by ownership:

| Driver/tool-owned facts | Model-owned semantic result | Human display |
|---|---|---|
| repository and branch identity; exact HEAD; dirty state; active unit ID; phase names/counts; GitHub issue/PR state; CI; verification receipts; created issue numbers; artifact paths and hashes | verdict; blocker classification; unresolved questions/assumptions; requirement or acceptance gaps; next recommended transition; short rationale | concise summary, rich skill report, rendered findings, links |

The driver should build the final envelope from the first two columns instead of
asking the model to restate everything. This prevents avoidable errors such as
turning an integer issue number into a count or converting a unit slug into a
number. It also keeps the model focused on judgments that cannot be calculated.

Use this bounded sequence:

1. execute the skill once and retain its normal report/tool receipts;
2. collect deterministic facts from their owners;
3. parse the model's small semantic result and compose the envelope;
4. validate strictly against the selected contract version;
5. on model-payload/envelope validation failure, reuse the same session for one
   formatter-only repair with no tools or side effects;
6. if repair fails, emit a typed driver failure containing validation details
   and references to the original turn; never retry indefinitely.

Provider-native structured output or strict tool use can replace step 5 when the
adapter supports it. It cannot replace stop-reason handling: OpenAI documents
refusal and incomplete/max-token cases that may not match the schema, while
Anthropic likewise documents `refusal` and `max_tokens` as exceptional outputs.
[OpenAI Structured Outputs edge cases](https://developers.openai.com/api/docs/guides/structured-outputs#how-to-use-structured-outputs),
[Anthropic stop reasons](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons).

The retry must repair serialization/classification only. It must not rerun
commands, file edits, commits, pushes, comments, or issue creation. Temporal's
separation of deterministic workflow logic from failure-prone Activities is a
useful model for isolating this boundary; LangGraph's per-node attempt identity
is a useful model for recording it. [Temporal retry policies](https://docs.temporal.io/encyclopedia/retry-policies),
[LangGraph execution identity](https://docs.langchain.com/oss/javascript/langgraph/use-graph-api#access-execution-info-inside-a-node).

### 3. Durable state, events, and reports

Persist normalized facts and transitions as typed events with at least
`contract_version`, `run_id`, `turn_id`, `attempt`, `skill`, `unit_id`,
`head_sha`, timestamps, payload, and evidence references. Project the current
`WorkflowSnapshot` from those events/checkpoints. Keep the full redacted
transcript and Markdown artifacts as referenced evidence, not as state that must
be re-parsed on every restart.

The deterministic repository sensor can still scan project documents to produce
a snapshot such as:

- roadmap order and status;
- active feature/fix and dependencies;
- current phase, total phases, and phase names;
- unresolved decisions, questions, findings, and acceptance gaps;
- exact source path/hash for every extracted fact;
- contradictions or unknowns instead of inferred answers.

Then an optional LLM decision call can consume that snapshot plus the last turn's
narrative and emit only the semantic decision fields. The snapshot remains the
authority. This mirrors LangGraph's split between thread checkpoints and
application-defined stores, and GitHub Actions' split between small outputs and
larger persisted artifacts. [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence),
[GitHub workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts).

## Historical contract drift addressed by fix 134

The original failure demonstrated why manually duplicated machine contracts are
hazardous. The branch now addresses those observations with a package-owned,
strict contract:

- legacy native audit-pr vocabulary is normalized only through named,
  evidence-preserving compatibility mappings; see the
  [workflow-status field rules](../../skills/workflow-status/references/ENVELOPE_FIELDS.md)
  and [envelope.schema.json](../../packages/agentic-workflow-schema/envelope.schema.json);
- Envelope v2 requires `detail` and keeps skill-specific extensions below that
  boundary, while SkillOutcome v1 is a separate compact worker result; and
- strict validators and public schemas reject undeclared keys at the routing
  boundary, with snapshot compilation preserving provenance, unknowns, and
  contradictions instead of guessing.

These observations remain as rationale, not current failures. The conductor
`ship-roadmap` keeps its native `SHIP:` banner, while the package profiles apply
to the worker and sensor skills invoked by a driver.

## Pragmatic delivery order

1. **Stop the immediate failure:** complete the skills-side mapping for
   `audit-pr` and the loop-side exactly-one repair path with the reported fixture.
2. **Eliminate contract drift:** add an explicit contract version, choose one
   schema source, generate mirrored types/docs, enforce unknown-key policy, and
   validate one fixture per skill terminal state.
3. **Reduce model-owned fields:** introduce the deterministic turn compiler and
   provenance-aware repository snapshot; let Git/forge/checks own their facts.
4. **Add document adapters selectively:** start with roadmap and plan/progress
   templates, fail closed on ambiguity, and treat Bun Markdown as an internal
   unstable tokenizer behind fixtures.
5. **Optimize adapters last:** use provider-native structured outputs or strict
   tool calls where Pi/OpenCode/provider capabilities prove they work, while
   preserving the portable fenced-JSON fallback.

This order solves today's defect without committing to a fork, and it creates the
typed evidence foundation needed for the harder goal: proving that a vaguely
specified capability is complete against clarified requirements and edge cases,
not merely that an agent declared the task finished.
