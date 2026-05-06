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

## What to borrow from Acontext / skills-style design

The useful idea from Acontext and similar skills systems is not a vendor dependency. It
is the shape:

- a skill starts with machine-readable metadata (`name`, `version`, `description`,
  `keywords`)
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

Longer-term, the repo can store an image skill surface in a dedicated location such as:

- `packages/agent-contact-text/skills/image-hybrid-code/SKILL.md`
- or `docs/skills/image-hybrid-code/SKILL.md`

The exact path is less important than the properties:

- repo-tracked
- easy to cite from issues and PRs
- narrow enough to stay practical
- clearly linked to doctrine rather than replacing it
- loadable by agents as prompt context before the user prompt is expanded

If we create a literal skill file, it should be shaped like this:

```md
---
name: wittgenstein-image-hybrid-code
version: 0.1.0
description: Emit Hybrid Image Code for Wittgenstein's sole neural image path.
keywords:
  - image
  - visual seed code
  - vsc
  - hybrid image code
  - frozen decoder
  - manifest
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
version: 0.1.0
description: Produce Hybrid Image Code containers for Wittgenstein image generation.
keywords:
  - image
  - visual seed code
  - vsc
  - semantic ir
  - vq
  - decoder
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

Once the repo is happy with this shape, create a literal `SKILL.md`-style file in a
stable repo path and have the image planner load it as part of the prompt context rather
than hard-coding the entire contract inside one function.
