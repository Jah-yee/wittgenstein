# RFC-0006 — Hybrid Image Code

**Date:** 2026-05-06  
**Author:** engineering / research consolidation  
**Status:** 🟢 Accepted  
**Feeds from:** `docs/research/hybrid-image-code.md`, Brief A (VQ / VLM lineage audit), Brief B (compression vs world models), Brief C (H9 patch-grid / next-scale IR, H10 long-code clarity), Brief G (image-network clues), `docs/research/vq-tokens-as-interface.md`  
**Ratified by:** ADR-0018

**Summary:** Reframe Wittgenstein's image route from `scene-spec JSON as the terminal image IR` to a hybrid architecture where `Semantic IR` remains canonical but `Visual Seed Token` becomes the primary image research layer. Keep one image path, keep the frozen-decoder doctrine, redefine the adapter primarily as a seed expander, and formalize both `one-shot hybrid` and `two-pass compile` as legal lanes.

---

## Context

The current repo wording for image is intentionally narrow:

```text
LLM -> structured JSON scene spec -> adapter -> frozen decoder -> PNG
```

That wording was useful in the scaffold phase because it:

- made the route inspectable,
- fit the current schema,
- kept the adapter small,
- avoided collapsing into prompt-to-diffusion,
- matched the current partial implementation.

But it now introduces the wrong center of gravity.

The problem is not that semantic JSON exists. The problem is that it is easy for the route to drift into a weaker story:

```text
user prompt -> longer structured prompt -> another system does the real image work
```

That is not the Wittgenstein thesis.

The stronger and more faithful thesis is:

```text
text-first LLM participates directly in visual coding,
while the local harness / adapter / decoder do the typed expansion and deterministic reconstruction work.
```

The repo already partially admits this stronger thesis:

- `providerLatents` already exists in the image schema,
- the adapter already prefers direct latent input when present,
- Brief C H9 already argues that structured JSON may not be the long-term best IR for raster modalities,
- Brief A already shows that token ordering and token length are first-class design dimensions.

What is missing is not optionality. What is missing is a design that treats visual code as a native architectural object rather than an edge-case route.

---

## Proposal

### 1. Canonical conceptual path

The image path should be reframed as:

```text
User Prompt
-> Semantic IR
-> Visual Seed Token / Visual Seed Code
-> optional coarse/full VQ hints
-> Seed Expander / Adapter
-> full decoder-native token grid
-> frozen decoder
-> PNG
```

This is still one image path.
It is still decoder-not-generator.
It still ends in PNG.
It still keeps the harness / codec / decoder split.

### 2. Role split

#### Semantic IR

`Semantic IR` remains canonical, but its role changes.

It is now primarily:

- model-side semantic organization,
- user-facing inspection,
- auxiliary conditioning for seed expansion,
- a legal fallback when stronger visual code is absent.

It is **not** the primary image-side research object.

#### Visual Seed Token

`Visual Seed Token` / `Visual Seed Code` becomes the primary image-side research object.

It should be:

- compact,
- closer to decoder token space than prose,
- emitted by next-token prediction,
- cheaper than full-grid token prediction,
- rich enough to expand into a meaningful decoder-native token grid.

### 3. Two legal output lanes

This RFC ratifies two legal image lanes.

#### Lane A — one-shot hybrid

One output containing:

- `semantic`
- `seedCode`
- optional `coarseVq`
- optional `providerLatents`
- `decoder`

This is the default lane to optimize first.

#### Lane B — two-pass compile

Pass 1:

```text
User Prompt -> Semantic IR
```

Pass 2:

```text
Semantic IR -> Visual Seed Code / VQ hints
```

This is the explicit high-quality lane.

### 4. Adapter redefinition

The image adapter should no longer be explained as primarily:

```text
scene semantics -> latent vocabulary
```

Its primary story becomes:

```text
visual seed / coarse token structure -> fuller decoder-native token grid
```

Semantic IR may still be read, but mainly as structured auxiliary conditioning rather than the sole generative source.

### 5. Priority order

The intended runtime priority is:

```text
1. providerLatents
2. coarse/full VQ hints
3. seedCode
4. semantic-only fallback
5. placeholder
```

This keeps the most decoder-facing path first while preserving conservative fallback behavior.

---

## Interface

This RFC does **not** attempt to finalize one tokenizer family or one exact seed syntax.
It does, however, define the shape that implementation work should target.

### Request / output contract

The current `ImageSceneSpec` shape should evolve toward a hybrid image container.

Illustrative shape:

```ts
type HybridImageCode = {
  schemaVersion: "witt.image.hybrid/v0.1";
  mode: "one-shot-hybrid" | "two-pass-compile";
  semantic: SemanticImageIR;
  seedCode?: ImageVisualSeedCode;
  coarseVq?: ImageLatentCodes;
  providerLatents?: ImageLatentCodes;
  decoder: DecoderContract;
};
```

Where:

```ts
type SemanticImageIR = {
  intent: string;
  subject: string;
  composition: {
    framing: string;
    camera: string;
    depthPlan: string[];
  };
  lighting: {
    mood: string;
    key: string;
  };
  style: {
    references: string[];
    palette: string[];
  };
  constraints: {
    mustHave: string[];
    negative: string[];
  };
};
```

And:

```ts
type ImageVisualSeedCode = {
  family: string;
  mode: string;
  length: number;
  tokens: number[] | string[];
};
```

This RFC deliberately leaves `family` and `mode` open because that is still a research variable.

### Preamble direction

Image preambles should stop saying only:

```text
Emit a JSON scene spec.
Describe semantics and decoder hints only.
```

Instead, image preambles should allow:

```text
Emit a hybrid image-code object.
Provide semantic structure plus compact visual seed information.
Do not emit prose prompts, SVG, HTML, Canvas commands, or raw pixels.
```

### Adapter surface

The current image pipeline centers `adaptSceneToLatents()`.
The new implementation seam should introduce something closer to:

```ts
expandSeedToLatents(seedCode, semantic?, ctx)
```

with semantic-only adaptation explicitly demoted to fallback / baseline status.

### CLI surface

The CLI should eventually distinguish between:

- what is shown to the user,
- what the execution engine actually runs.

Illustrative flags:

```text
--show-semantic
--show-seed-summary
--mode one-shot
--mode two-pass
--quality high
```

The user-facing default should favor semantic readability; the execution path should favor seed- and token-facing paths.

### Manifest surface

The manifest should eventually capture:

- whether the run used `providerLatents`, `coarseVq`, `seedCode`, or semantic fallback,
- seed family,
- seed mode,
- seed length,
- seed expansion method,
- validation success/failure at each image-code layer.

This is part of the thesis. If image generation is being framed as visible code compilation, the manifest has to preserve which code path actually ran.

---

## Migration

This migration should happen in four stages.

### Stage 1 — doctrine / design

- land this RFC
- ratify ADR-0018
- update image-route wording in:
  - `docs/codecs/image.md`
  - `docs/hard-constraints.md`
  - `docs/architecture.md`
  - `README.md`

### Stage 2 — schema

- introduce `ImageVisualSeedCodeSchema`
- introduce a hybrid image-code container
- keep current `ImageSceneSpec` compatibility during transition

### Stage 3 — pipeline

- add `seedCode` and `coarseVq` branches
- reorder priority:
  - `providerLatents -> coarseVq -> seedCode -> semantic -> placeholder`
- keep placeholder only for wiring tests and explicit honesty

### Stage 4 — CLI / manifest / eval

- add CLI display / mode distinctions
- add manifest evidence for seed path used
- add eval matrix:
  - semantic-only fallback
  - semantic + seed
  - coarse/full token routes when available

This RFC is intentionally compatible with a gradual migration. It does not require a flag day.

---

## Red team

### Objection 1 — "This is just inventing a new IR layer because JSON feels boring."

Counter:
No. The repo already admits token-facing image work through `providerLatents`, Brief C H9, and the VQ-token interface note. This RFC is not inventing a new ambition; it is making an existing but under-centered ambition explicit.

### Objection 2 — "Why not drop semantic IR entirely and go full seed / full VQ?"

Counter:
Because semantic IR still does real work:

- it helps the model organize semantics,
- it gives the user something inspectable,
- it provides a structured auxiliary signal,
- it makes debugging and eval far easier than opaque token-only generation.

### Objection 3 — "Why not keep the current scene-spec adapter story and just improve the adapter?"

Counter:
Because it leaves the wrong architectural center. The project should not overcommit to `semantic scene description -> full latent` as the main research claim if the real hypothesis is "text-first LLMs can participate in visual coding."

### Objection 4 — "This still doesn't prove the LLM knows a real decoder-private VQ vocabulary."

Correct. This RFC does not claim that. It claims a weaker and more plausible target:

- the LLM can emit a meaningful seed layer,
- the seed layer can be expanded into decoder-native tokens,
- the expansion layer can stay small.

That is enough to preserve the harness-first thesis without making implausible claims about decoder-private numeric codebooks.

### Objection 5 — "This is architecture churn before image quality is solved."

Counter:
This RFC is meant to prevent the wrong architecture from calcifying before quality work starts. It is cheaper to correct the image-route explanation now than after training, manifests, and CLI surfaces all hard-code the older `scene-spec only` story.

---

## Kill criteria

This RFC should be reconsidered or narrowed if any of the following happens:

1. **Seed-path evaluation fails repeatedly**
   - if seed-based routes show no measurable quality or controllability advantage over semantic-only fallback after a fair within-repo evaluation, the seed layer may not earn first-class complexity yet.

2. **No seed family is practical**
   - if all credible seed geometries (prefix tokens, coarse-scale maps, residual-first codes, lexical visual tokens) prove too unstable or too hard to map into a usable decoder route, this RFC should be reduced to "keep optionality" rather than "promote seed to first-class."

3. **Semantic-only path outperforms in practice**
   - if a strong semantic-to-latent adapter consistently beats hybrid routes at equal budget and complexity, the architecture may need to remain scene-spec centered longer than expected.

4. **The migration explodes surface complexity**
   - if schema, CLI, manifest, and adapter changes cannot be made incrementally and instead require disruptive rewrites, the rollout should be re-scoped into a narrower phase line.

---

## Decision record

This RFC proposes the following architectural correction:

1. `Semantic IR` remains canonical but is no longer the primary image research object.
2. `Visual Seed Token` becomes first-class.
3. The image route is explicitly hybrid.
4. The adapter is redefined primarily as a seed expander.
5. `one-shot hybrid` and `two-pass compile` are both legal lanes.
6. `two-pass compile` is the explicit high-quality lane.
7. One image path, frozen decoder doctrine, and no-diffusion constraints remain unchanged.

If accepted, ADR-0018 ratifies the architectural layer of this change, and implementation work proceeds through the image-port execution plan rather than through ad hoc PR drift.
