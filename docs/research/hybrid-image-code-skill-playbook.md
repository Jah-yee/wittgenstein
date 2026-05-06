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

- skills are stored as plain Markdown files
- they are meant to be portable and version-controlled
- they define when they apply, what to output, and what rules are non-negotiable
- they can be paired with scripts or resources, but the contract starts in Markdown

Useful references:

- [Acontext overview](https://acontext.io/)
- [Acontext skill docs](https://docs.acontext.io/store/skill)
- [Claude Code skills overview](https://docs.claude.com/en/docs/claude-code/skills)

For Wittgenstein, that means the image line should eventually gain a repo-tracked
skill-like prompt surface rather than leaving the contract implicit inside one function.

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
- or `docs/handoff/image-hybrid-code-skill.md`

The exact path is less important than the properties:

- repo-tracked
- easy to cite from issues and PRs
- narrow enough to stay practical
- clearly linked to doctrine rather than replacing it

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

## Suggested next step

Once the repo is happy with this shape, create a literal `SKILL.md`-style file in a
stable repo path and have the image planner load it as part of the prompt context rather
than hard-coding the entire contract inside one function.
