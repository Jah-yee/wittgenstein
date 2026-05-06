# Hybrid Image Code Skill / Prompt Playbook

## Purpose

This note records how the image line should adopt a `SKILL.md`-style prompt surface.
It is narrower than doctrine and more durable than scattered prompt snippets.

The target use case is the image planner stage:

`user prompt -> system prompt / skill context -> image-code container -> adapter -> decoder`

This document is meant to support:

- issue `#212` (`[image prompt] Add a SKILL.md-style system prompt for Hybrid Image Code`)
- doctrine PR `#206`
- implementation PR `#210`

## Decision after broader skill-format research

The decision is to adopt a **literal repo-local Agent Skills shape** for the image planner,
not only a prose prompt-playbook note.

Concretely:

- keep this file as the research / design note,
- add a short `SKILL.md`-style image planner file in a stable repo path in a follow-up,
- keep the skill body lean enough to load as prompt context,
- move long examples, schema notes, and research citations into references loaded only when
  needed,
- do not make Acontext, Claude Code, Codex, OpenClaw, or any external memory layer a
  dependency of image generation.

The source of truth remains the codec schema and doctrine. The skill is an activation and
instruction surface: it teaches a model how to emit the already-ratified image-code
container.

## Why a skill-style surface is useful

The image correction changed the runtime hierarchy, but it also exposed a missing layer
earlier in the stack: we need a stable prompt surface that tells the model what kind of
object to emit and which rules matter.

That is closer to a `SKILL.md` than to a one-off prompt string:

- repo-tracked
- human-readable
- portable across agent surfaces
- easy to audit and revise
- able to separate output contract from casual prompt wording

The strongest reason to use a literal skill file is **progressive disclosure**. Agent
Skills implementations commonly load only `name` and `description` at discovery time, load
the full `SKILL.md` only when the task matches, and load bundled resources lazily. That is
a better fit than stuffing the entire image doctrine into every prompt.

## Surveyed skill patterns

The broader pattern is now clear enough to make a call:

- **Agent Skills open format / agentskills.io** — A skill is a folder with `SKILL.md`
  front matter plus optional `scripts/`, `references/`, and `assets/`. The loading model is
  discovery metadata first, full instructions on activation, resources only when needed.
- **Anthropic / Claude Code** — `description` is the trigger surface; skills can be
  project-local or user-local; full skill content stays in the session once invoked. Claude
  Code also supports tool-related front matter, but that is platform-specific and should
  not be required by Wittgenstein.
- **OpenAI / Codex skills** — The system skill guidance emphasizes context economy,
  explicit degrees of freedom, optional `scripts/`, `references/`, and `assets/`, and
  keeping large reference material outside `SKILL.md`. OpenAI also uses optional
  UI-facing `agents/openai.yaml`; useful later, not needed for the image planner now.
- **Acontext** — The useful contribution is skill-memory: successful and failed runs can
  be distilled into reusable Markdown skills. That is interesting for future maintainer
  memory, but it is not the right runtime dependency for image generation.

The resulting Wittgenstein choice is:

```text
docs/research/hybrid-image-code-skill-playbook.md
  = research/design note, citations, rationale, longer examples

packages/agent-contact-text/skills/image-hybrid-code/SKILL.md
  = compact agent-loadable prompt context for the image planner

packages/agent-contact-text/skills/image-hybrid-code/references/
  = optional schema examples, troubleshooting, and eval prompts
```

This keeps the public skill portable while preserving research depth without context
bloat.

## North-star references

For this line, use three north stars rather than one:

### 1. Agent Skills / Anthropic shape

Use this as the north star for the **file format and loading model**.

Borrow:

- one folder per skill,
- `SKILL.md` with `name` and `description` front matter,
- progressive disclosure: metadata first, full instructions on activation, references only
  when needed,
- focused skills instead of a broad mini-manual,
- optional `scripts/`, `references/`, and `assets/` only when they pull their weight.

Do not borrow:

- Claude-only front matter as a required contract,
- broad tool permissions in a project skill,
- long narrative documentation inside the skill body.

### 2. OpenAI / Codex skill discipline

Use this as the north star for **agent usefulness and evalability**.

Borrow:

- "context window is a public good" as the editing principle,
- degrees of freedom: strict where parsing is fragile, open where research variables remain
  unsettled,
- bundled scripts only for deterministic repeated work,
- references for details that should not load on every activation,
- test prompts / eval cases for trigger quality and output validity.

Do not borrow:

- Codex-specific installation paths as the project contract,
- UI metadata before the first skill shape is proven,
- over-optimized trigger descriptions before real image-planner evals exist.

### 3. Acontext skill-memory pattern

Use this as the north star for **learning and maintenance**, not for runtime installation.

Borrow:

- successful and failed runs can become durable Markdown knowledge,
- troubleshooting should capture failure symptoms, fixes, and prevention,
- skills should be human-readable, editable, portable, and version-controllable,
- future maintainer memory may distill real image-planner failures into skill updates.

Do not borrow:

- Acontext login / project selection in the image runtime path,
- cloud memory as a prerequisite,
- installer commands in the prompt surface.

The practical outcome: the first Wittgenstein image skill should be small and static. A
later maintainer-memory experiment may use Acontext-like distillation to propose updates,
but those updates still go through normal review.

## System-prompt structure survey

The same ecosystem also points to a broader lesson: a skill is only one layer in a prompt
stack.

Useful structures observed:

- **Role/system layer.** Claude's system-prompt guidance emphasizes using the system layer
  to set the model's role and durable behavioral frame. For Wittgenstein image, that role
  is "image planner / image-code emitter", not "artist" or "prompt writer".
- **Project context layer.** Claude Code's `CLAUDE.md` pattern is closest to
  Wittgenstein's `AGENTS.md` / `PROMPT.md`: project-wide standards, repo map, common
  commands, and engineering discipline. The image skill should not duplicate those.
- **Append / task layer.** Per-call image data belongs in the prompt assembled by the
  codec: user prompt, requested size, seed, active mode, and schema preamble.
- **Output-format layer.** OpenAI prompt guidance keeps output instructions early and
  concrete: desired format, separators, examples, and constraints. For image, this means
  JSON-only, schema-valid, no markdown fences, no prose-only prompt.
- **Spec / workflow layer.** OpenAI's Symphony writeup is useful because it treats a
  Markdown spec as an orchestrator's policy layer. That maps well to `WORKFLOW.md` and
  issue orchestration, but the image skill should remain narrower than a workflow spec.

So the image prompt stack should be:

```text
Project doctrine/context:
  AGENTS.md / PROMPT.md / docs/hard-constraints.md

Skill activation:
  packages/agent-contact-text/skills/image-hybrid-code/SKILL.md

Codec prompt assembly:
  schema preamble + request size + seed + user prompt + selected mode

Runtime validation:
  zod parse -> adapter priority -> manifest receipt -> artifact hash
```

The skill sits between project doctrine and per-call prompt assembly. It should not absorb
either one.

## Information blocks the image skill should contain

After surveying skills and system-prompt patterns, the candidate `SKILL.md` should contain
these blocks:

1. **Front matter**
   - `name`
   - `description` with explicit trigger language
2. **When to use**
   - image artifact planning,
   - PNG through the image codec,
   - Hybrid Image Code output.
3. **Role**
   - the agent is an image-code planner,
   - not a prose prompt writer,
   - not a decoder or generator.
4. **Input assumptions**
   - user prompt,
   - request size,
   - seed,
   - current schema version,
   - optional mode (`one-shot-hybrid`, `two-pass-hybrid`, `provider-latents`).
5. **Output contract**
   - valid JSON only,
   - no markdown fences,
   - emit the image-code container.
6. **Path hierarchy**
   - `providerLatents` only for real direct latents,
   - `seedCode` as the normal VSC output,
   - `coarseVq` only as optional bridge,
   - `semantic` optional / paired / user-facing,
   - semantic-only as honest fallback.
7. **Hard constraints**
   - no SVG / HTML / Canvas / pixel arrays,
   - no diffusion prompt,
   - no second image path,
   - no guessed `providerLatents`.
8. **Mode rules**
   - one-shot: emit `seedCode` and optional `semantic` together,
   - two-pass: pass 1 may emit semantic; pass 2 must emit `seedCode`.
9. **Validation rules**
   - seed length matches tokens,
   - VQ grid area matches token count,
   - provider latents match decoder contract,
   - malformed output should be retried or recorded as fallback.
10. **References**
    - point to schema details, examples, troubleshooting, and eval prompts.

This block list is the real design payload. The literal wording can keep changing as evals
teach us what triggers and validates best.

## What to borrow from Acontext / skills-style design

The useful idea from Acontext and similar skills systems is not a vendor dependency. It
is the shape:

- a skill starts with machine-readable metadata (`name` and `description` are the minimum
  portable fields)
- skills are stored as plain Markdown files
- they are meant to be portable and version-controlled
- they define when they apply, what to output, how to configure the environment, and what
  rules are non-negotiable
- they can be paired with scripts or resources, but the contract starts in Markdown
- they include operational closeout material such as command references and
  troubleshooting notes

Useful references:

- [Acontext overview](https://acontext.io/)
- [Acontext skill docs](https://docs.acontext.io/store/skill)
- [Claude Code skills overview](https://docs.claude.com/en/docs/claude-code/skills)

For Wittgenstein, that means the image line should eventually gain a repo-tracked
skill-like prompt surface rather than leaving the contract implicit inside one function.

The Acontext installer skill also demonstrates a boundary we should keep: installation,
login, project management, and cloud memory sync are tool-specific operational steps. The
Wittgenstein image playbook should borrow the durable `SKILL.md` shape, not require
Acontext, Claude Code, OpenClaw, OAuth, or any external memory service in the runtime
path.

## Acontext-derived shape, rewritten for Wittgenstein

The Acontext document is effectively organized as:

1. front matter for discovery,
2. a reuse / persistence instruction,
3. install or upgrade steps,
4. login and project selection,
5. plugin / agent integration,
6. project-management commands,
7. skill upload / sync commands,
8. environment overrides,
9. tool inventory,
10. troubleshooting.

For Hybrid Image Code, the equivalent should be:

1. front matter for agent discovery,
2. a short statement that this file is repo-tracked prompt context, not doctrine,
3. load conditions for image-planner calls,
4. the canonical output hierarchy,
5. the exact JSON contract to emit,
6. one-shot and two-pass modes,
7. validation rules and fallback behavior,
8. optional CLI / agent flags that may expose the semantic layer,
9. related docs and issues,
10. troubleshooting for common malformed outputs.

This keeps the useful operational discipline of `SKILL.md` without importing a third-party
memory product into the codec path.

## What not to borrow

Do not copy the Acontext installer as-is into the image skill:

- no `curl | sh` install path in the image planner skill,
- no OAuth/login/project-selection steps in the image generation path,
- no cloud-memory sync requirement,
- no vendor-specific plugin commands in the core prompt surface,
- no expectation that early adopters install Acontext to run the image codec.

Those may be useful for maintainer memory experiments later. They are not part of the
image path contract.

## What this prompt surface should do

The image skill / system-prompt layer should:

- prefer `Visual Seed Code (VSC)` as the primary decoder-facing output
- allow `Semantic IR` as optional paired output
- allow optional `coarseVq` / VQ hints as a bridge, not as the main story
- reserve `providerLatents` for honest direct-code output only
- forbid prose-only image prompting as the terminal result
- forbid SVG / HTML / Canvas / pixel-array output on the image route

It should not:

- relitigate doctrine
- pick the final tokenizer family
- over-specify CLI UX
- duplicate long architecture explanations already covered by ADR / RFC surfaces

## Current hierarchy

The prompt layer should reflect this hierarchy:

1. `providerLatents`
2. `Visual Seed Code (VSC)`
3. `optional coarseVq / VQ hints`
4. `optional Semantic IR`
5. `semantic-only fallback`

The prompt surface should not present `Semantic IR` as the primary destination for the
image line.

## Recommended file shape

The repo should store an image skill surface in:

- `packages/agent-contact-text/skills/image-hybrid-code/SKILL.md`

Rationale:

- `packages/agent-contact-text/` already exists as the agent-facing context package.
- Keeping it outside `.claude/`, `.codex/`, or another vendor path avoids choosing one
  agent client as canonical.
- Consumers can copy or symlink the skill into tool-specific locations when needed.

Required properties:

- repo-tracked
- easy to cite from issues and PRs
- narrow enough to stay practical
- clearly linked to doctrine rather than replacing it
- loadable by agents as prompt context before the user prompt is expanded

If we create a literal skill file, it should be shaped like this:

```md
---
name: wittgenstein-image-hybrid-code
description: Emit Hybrid Image Code for Wittgenstein's sole neural image path.
---

# Wittgenstein Image Hybrid Code

Use this skill when an image request must be turned into a structured image-code
container for Wittgenstein.

This skill is prompt context only. It does not install tools, pick a tokenizer family, or
change the codec contract by itself.

...
```

The literal skill may later include small examples and validation checklists, but it
should not duplicate ADR text or become a second architecture document.

Optional platform metadata such as `version`, `keywords`, `allowed-tools`, or
`agents/openai.yaml` can be added after the first skill exists. The first pass should stay
portable: `name`, `description`, Markdown instructions, and direct references.

## Candidate system prompt v0.1

This is the first candidate prompt context for the image planner stage.

```md
You are the image planner for Wittgenstein.

Return valid JSON only.
Do not return markdown fences.
Do not return prose explanations.

Your job is to emit a Hybrid Image Code container for the sole neural image pipeline.

Primary goal:

- Emit `seedCode` as the main decoder-facing image output whenever possible.

Optional outputs:

- `semantic` may be included as a human-readable paired layer.
- `coarseVq` may be included when you can provide stable partial VQ structure.
- `providerLatents` may be used only when you can emit decoder-native latent tokens directly and honestly.

Priority:

1. `providerLatents`
2. `seedCode`
3. `coarseVq`
4. `semantic`

Rules:

- Prefer compact visual code over prose description.
- Treat `Semantic IR` as optional support, not the main target.
- Do not emit SVG, HTML, Canvas commands, or pixel arrays.
- Do not invent a second image path.
- Do not output a natural-language image prompt as the final result.
- If you cannot produce reliable visual code, emit the strongest valid partial structure you can.

When emitting `seedCode`:

- keep it compact
- keep it structured
- keep it decoder-facing
- include `length` only when it matches the token count

When emitting `coarseVq`:

- ensure token count matches the declared grid area

When emitting `providerLatents`:

- ensure token count matches the declared grid area
- use it only for direct decoder-native code, not for guessed placeholders
```

## Candidate literal `SKILL.md` content

If this proposal graduates into a repo-local skill file, the content can be reduced to a
portable instruction file like this:

```md
---
name: wittgenstein-image-hybrid-code
description: Use when planning a Wittgenstein image artifact. Emit the Hybrid Image Code JSON container for the image codec, preferring Visual Seed Code over prose or semantic-only output.
---

# Wittgenstein Image Hybrid Code

Use this skill when the user asks Wittgenstein to produce a PNG through the image codec.

You are not writing a natural-language image prompt. You are emitting the structured input
for Wittgenstein's image codec.

## Output

Return valid JSON only.

Prefer this hierarchy:

1. `providerLatents` only when real decoder-native latents are available.
2. `seedCode` as the normal decoder-facing output.
3. `coarseVq` only as an optional bridge when stable partial VQ structure is available.
4. `semantic` as optional paired / user-facing support.

Do not use SVG, HTML, Canvas, pixel arrays, diffusion prompts, or a second image path.

## One-shot mode

Emit `seedCode` and, when useful, a paired `semantic` object in one JSON response.

## Two-pass mode

Pass 1 may emit `semantic`.
Pass 2 must use that semantic layer as support and emit `seedCode` as the primary result.

## Validation

- `seedCode.length`, when present, must match the token count.
- `coarseVq.tokens` must match `coarseVq.tokenGrid`.
- `providerLatents.tokens` must match `providerLatents.tokenGrid`.
- If visual code is not reliable, emit the strongest valid partial structure and let the
  codec record the fallback honestly.
```

This literal form is intentionally shorter than the research note. Agents should load the
skill, while maintainers should review the research note and controlling ADRs.

## Skill resource split

The literal skill should not carry every example and research argument. Use bundled
resources with progressive disclosure:

- `references/schema.md` — the current JSON field contract and examples.
- `references/troubleshooting.md` — malformed output symptoms, retry wording, and
  fallback receipts.
- `references/evals.md` — trigger/eval prompts for one-shot and two-pass behavior.

Do not add scripts in the first pass. Add a script only if model outputs repeatedly need a
deterministic validator that cannot be expressed cleanly in tests or existing zod schemas.

## Candidate one-shot output shape

```json
{
  "schemaVersion": "witt.image.spec/v0.1",
  "mode": "one-shot-hybrid",
  "seedCode": {
    "schemaVersion": "witt.image.seed/v0.1",
    "family": "vqvae",
    "mode": "prefix",
    "tokens": [12, 44, 98, 101, 5, 77]
  },
  "semantic": {
    "intent": "misty forest poster",
    "subject": "misty pine forest",
    "composition": {
      "framing": "wide",
      "camera": "eye level",
      "depthPlan": ["foreground mist", "forest", "mountains"]
    },
    "lighting": {
      "mood": "moody",
      "key": "soft dawn"
    },
    "style": {
      "references": ["landscape"],
      "palette": ["green", "gray"]
    },
    "constraints": {
      "mustHave": ["trees"],
      "negative": ["people"]
    }
  }
}
```

## Candidate two-pass interpretation

In a two-pass flow:

1. Pass 1 may produce `semantic` only.
2. Pass 2 should treat that semantic layer as support material and produce `seedCode`
   as the primary result, optionally with `coarseVq`.

Two-pass should be treated as the higher-quality lane, not the default proof that the
system works at all.

## What should remain open

This prompt playbook should not lock:

- the final seed-token family
- the final default seed length
- the final coarse-grid size
- whether `coarseVq` survives as a lasting first-class bridge or recedes over time

Those remain research and evaluation questions.

## Troubleshooting rules to include later

Acontext's installer skill includes troubleshooting because operational skills fail in
predictable ways. The image skill should eventually do the same for malformed model
outputs:

- If the model returns prose, retry with "JSON only; no markdown fences."
- If `seedCode.length` does not match `tokens.length`, reject and retry.
- If a VQ grid token count does not match grid area, reject and retry.
- If the output only contains `semantic`, treat it as semantic fallback and record that
  path in manifest receipts.
- If `providerLatents` appears without a known decoder/codebook contract, reject it
  rather than silently treating guessed tokens as direct latents.

## Suggested next step

Create the literal `SKILL.md` under
`packages/agent-contact-text/skills/image-hybrid-code/`, with `references/` files only for
details that would bloat the skill body. Then wire the image planner prompt to load or
derive from that file rather than hard-coding the entire contract inside one function.

## Sources checked

- Agent Skills overview / open format: https://agentskills.io/
- Agent Skills structure and progressive disclosure: https://agentskills.io/what-are-skills
- Claude Code skills docs: https://code.claude.com/docs/en/skills
- Anthropic skills repository and template: https://github.com/anthropics/skills
- OpenAI skills catalog and skill-creator guidance: https://github.com/openai/skills
- Acontext skill memory docs: https://docs.acontext.io/store/skill
- Acontext skill-memory pipeline: https://acontext.io/blog/agent-skills-as-a-memory-layer
