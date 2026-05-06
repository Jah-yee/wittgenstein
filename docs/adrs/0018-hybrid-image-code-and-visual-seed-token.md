# 0018 Visual Seed Code Image Route

## Status

Accepted (ratifies RFC-0006).

## Context

The current canonical image wording in Wittgenstein says:

```text
LLM -> structured JSON scene spec -> adapter -> frozen decoder -> PNG
```

That wording was useful for the early scaffold because it kept the route inspectable, schema-first, and compatible with a small learned bridge. It also matched the state of the implementation, where:

- `ImageSceneSpec` is the default output contract,
- `providerLatents` already exists as an optional direct-token route,
- the adapter and decoder are still partial scaffolds,
- the repo has not yet ratified a stronger image-side token protocol.

However, the current wording has begun to overstate the importance of semantic scene JSON and understate the actual image thesis.

If left uncorrected, the repo risks drifting into a weaker story:

```text
user prompt -> longer structured prompt -> downstream model does the real image work
```

That is not the intended thesis.

The intended thesis is closer to:

```text
text-first LLM participates in visual coding;
local harness / adapter / decoder complete the translation into image bytes.
```

We therefore need an architecture-level correction that:

- keeps `Semantic IR` because it remains useful,
- promotes `Visual Seed Token` / `Visual Seed Code` to first-class status,
- redefines the adapter primarily as a seed expander,
- preserves one shipping image path and the frozen-decoder doctrine,
- allows one-shot and two-pass lanes without forcing a premature choice of one tokenizer family.

This ADR is paired with RFC-0006, which supplies the implementation-facing interface and migration path. This ADR ratifies the load-bearing architectural correction and promotes it into doctrine-bearing surfaces.

## Decision

### 1. The canonical image route becomes hybrid

Wittgenstein image generation is ratified as a **Visual Seed Code** architecture.

The canonical conceptual path is:

```text
User Prompt
-> Visual Seed Token / Visual Seed Code
-> optional Semantic IR / coarse-full VQ hints
-> Seed Expander / Adapter
-> full decoder-native token grid
-> frozen decoder
-> PNG
```

This supersedes the narrow interpretation that image generation terminates at `SceneSpec JSON`.

### 2. `Semantic IR` remains supported because pure seed output is risky

`Semantic IR` remains part of the image contract because pure seed-token output can be:

1. opaque to users and maintainers,
2. brittle under model formatting errors,
3. difficult to debug when image quality fails.

It therefore serves three roles:

1. model-side concept activation / semantic organization,
2. user-facing inspection,
3. auxiliary conditioning for later seed expansion or decoder-side networks.

But it is no longer the primary image-side research object.

The primary image-side research object is now:

- **`Visual Seed Token` / `Visual Seed Code`**

### 3. `Visual Seed Token` is first-class

`Visual Seed Token` is ratified as a first-class image concept in Wittgenstein.

It must appear explicitly in the image architecture, and future schema / prompt / manifest work may assume it is a native part of the route rather than an optional curiosity.

This ADR intentionally does **not** lock one concrete seed family yet. The ratified point is architectural role, not one tokenizer vendor or one exact code syntax.

### 4. Adapter is redefined primarily as a seed expander

The image adapter is no longer described primarily as:

```text
scene semantics -> latent vocabulary
```

Its primary role is now:

```text
compact visual code -> fuller decoder-native token grid
```

Semantic IR may still provide auxiliary conditioning, but semantic-only mapping is no longer the target architecture story.

### 5. Both one-shot VSC and two-pass compile are legal

The architecture admits two legal output lanes:

1. **one-shot VSC**
   - the LLM emits seed code and optional semantic IR in one structured output
2. **two-pass compile**
   - pass 1 emits semantic IR
   - pass 2 emits seed code / VQ hints from that IR

This ADR ratifies both as legal.

It further names:

- **one-shot VSC** as the default lane to optimize first
- **two-pass compile** as the explicit high-quality lane

### 6. Priority order for image execution

The intended execution priority is:

```text
1. providerLatents
2. coarse/full VQ hints
3. seedCode
4. semantic-only fallback
5. placeholder path
```

This means the most decoder-facing and most visually explicit routes are preferred first, while semantic-only image generation remains available as a fallback rather than the main research claim.

### 7. Frozen-decoder and single-path doctrine remain unchanged

This ADR does **not** reopen:

- ADR-0004 sole neural image path
- ADR-0005 decoder-not-generator
- ADR-0007 Path C rejection

Image still has one shipping path.
That path still terminates in a frozen decoder and PNG.
Diffusion and second-path escape hatches remain out of scope.

## Consequence

### Immediate architectural consequence

The repo should stop describing image generation as if `SceneSpec JSON` were the end-state image IR.

Future image-facing docs should instead explain a split between:

- `Semantic IR` — model-facing and user-facing semantic layer
- `Visual Seed Token` — decoder-facing visual code layer

### Schema consequence

Future schema work may add explicit image seed structures and associated mode fields without needing to justify whether seed code belongs in the architecture at all. That question is settled here.

### Prompt / preamble consequence

Future preambles should no longer instruct the model only to emit a semantic scene spec. They may now target Visual Seed Code output contracts where seed code is primary and semantic IR can coexist when useful for inspection, diagnosis, or two-pass quality.

### Manifest consequence

Future manifest work should preserve which image code path was actually used:

- provider latents
- coarse/full VQ hints
- seed code
- semantic fallback

### Eval consequence

Future image evaluation should compare at least:

1. semantic-only fallback
2. seed + optional semantic
3. coarse/full token routes when available

### CLI consequence

The user-facing CLI may show semantic IR by default while the execution engine runs seed / token paths under the hood. This is now architecture-aligned rather than an accidental UI choice.

## Not locked by this ADR

This ADR deliberately does **not** decide:

- which seed family wins (`TiTok`, `FlexTok`, `VAR`, `RQ-VAE`, `SPAE`, or another route),
- what the default seed length is,
- what the default coarse-grid size is,
- whether auxiliary semantic conditioning materially improves seed expansion,
- whether one-shot or two-pass should be the product default forever.

Those are downstream RFC / implementation / benchmark questions.

## Rollout

If accepted, the next follow-up surfaces should be:

1. image RFC and/or image exec-plan updates,
2. `docs/codecs/image.md` rewrite,
3. `docs/hard-constraints.md` wording update from scene-only to Visual Seed Code-bearing image contract,
4. `README.md` / architecture-diagram wording update,
5. schema and adapter implementation work,
6. manifest / eval updates.

## Rationale

This is the smallest doctrine change that:

- preserves the original harness-first thesis,
- keeps semantic inspectability,
- keeps the adapter small,
- restores the visual-code ambition,
- avoids overcommitting to one exact tokenizer family before research narrows the field.

It keeps the engineering skeleton and corrects the image-route interpretation.
