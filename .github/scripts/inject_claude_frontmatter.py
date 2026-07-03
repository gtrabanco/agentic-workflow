import re

import yaml

with open("docs/workflow/model-routing.yml") as f:
    routing = yaml.safe_load(f)

def wrap_insensitive_pattern(canonical):
    """Build a regex matching `canonical` regardless of how Markdown line-wrapping
    collapsed its whitespace (the source text wraps description/body prose at
    ~80 cols, so any run of whitespace in the canonical sentence may appear as a
    single space or a newline + indentation in the actual file)."""
    return re.compile(r"\s+".join(re.escape(w) for w in canonical.split()))


# main's description points readers who want pinned tiers at #claude; on the
# claude branch itself that sentence is circular ("install #claude instead"
# while you're already on it) — replace it with the claude-branch-appropriate
# line instead of leaving main's wording.
POINTER_RE = wrap_insensitive_pattern(
    "On Claude Code and want hand-tuned per-skill model/effort tiers? "
    "Install the `#claude` branch instead "
    "(`npx skills add gtrabanco/agentic-workflow#claude`) — see the "
    "README. This branch is model-agnostic: the skill inherits "
    "whatever model and effort your agent session is already using."
)
CLAUDE_BRANCH_LINE = (
    "Model and effort are pre-tuned for this skill on the `claude` "
    "branch (see docs/workflow/model-routing.yml)."
)

# Same circularity in the Portability section's aside: main says "pick tiers
# yourself" (true on main, where nothing is pinned for anyone); on claude,
# tiers ARE pinned (for Claude Code), so restore the original phrasing.
PORTABILITY_RE = re.compile(
    wrap_insensitive_pattern(
        "on the `#claude` branch the frontmatter pins these tiers; "
        "here, pick tiers yourself:"
    ).pattern
    + "|"
    + wrap_insensitive_pattern(
        "the `#claude` branch's routing table pins these tiers; here, "
        "pick tiers yourself:"
    ).pattern
)
PORTABILITY_CLAUDE_LINE = "the frontmatter tiers state intent:"

for name, cfg in routing.items():
    path = f"skills/{name}/SKILL.md"
    with open(path) as f:
        text = f.read()
    text = POINTER_RE.sub(CLAUDE_BRANCH_LINE, text)
    text = PORTABILITY_RE.sub(PORTABILITY_CLAUDE_LINE, text)
    # Insert model:/effort: right after the name: line, matching the
    # frontmatter position used before the model-agnostic split.
    insertion = f"model: {cfg['model']}\neffort: {cfg['effort']}\n"
    new_text, n = re.subn(
        r"(^name: .*\n)", r"\1" + insertion, text, count=1, flags=re.M
    )
    if n != 1:
        raise SystemExit(f"could not find name: line in {path}")
    with open(path, "w") as f:
        f.write(new_text)
