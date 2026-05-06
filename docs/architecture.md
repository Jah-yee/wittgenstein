# Architecture

Wittgenstein is a five-layer harness. The layers are explicit in the repo so future contributors cannot “implement the idea” in the wrong place.

| Layer                       | Role                                                                                                            | Where it lives                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1 Harness / Runtime        | Planner orchestration, routing, retry, budget, telemetry, sandbox, invariants                                   | `packages/core/src/runtime/*`, `packages/sandbox/`, `AGENTS.md`, `packages/agent-contact-text/README.md`, CI                                                                                                     |
| L2 IR / Codec               | Structured modality contracts: visual seed code, optional semantic IR, route plans, and schema-owned containers | `packages/codec-*/src/schema.ts`, `docs/codec-protocol.md`, `docs/codecs/*.md`                                                                                                                                   |
| L3 Renderer / Decoder       | Decoder-facing code or IR to file via deterministic renderer or frozen decoder                                  | `packages/codec-image/src/pipeline/decoder.ts`, `packages/codec-audio/src/routes/*`, `packages/codec-video/src/hyperframes-wrapper.ts`, `packages/codec-sensor/src/signals/*`, `packages/codec-svg/src/codec.ts` |
| L4 Optional Adapter         | Small learned bridge / seed expander when a decoder needs code-space alignment                                  | `packages/codec-image/src/pipeline/adapter.ts`, `packages/codec-image/src/adapters/`, `packages/codec-image/src/training/`                                                                                       |
| L5 Packaging / Distribution | CLI, install, docs, skills, output conventions, ownership                                                       | `packages/cli/`, `scripts/install.sh`, `AGENTS.md`, `packages/agent-contact-text/`, `docs/distribution.md`, `CODEOWNERS`                                                                                         |

## Dataflow

1. CLI validates the user request and loads config.
2. Core chooses a codec by modality.
3. Core injects schema preamble and asks the model for structured output.
4. Codec parses decoder-facing seed/code layers and any optional semantic IR.
5. Codec render path turns that code-bearing contract into a file.
6. Runtime writes artifact traces into `artifacts/runs/<run-id>/`.

## Sole Image Path

Image is intentionally narrow:

`LLM -> Visual Seed Code-bearing image contract -> seed expander / adapter -> frozen decoder -> PNG`

There is no SVG, HTML, Canvas, or raster-painter fallback. The schedule risk is accepted because the research path is the product path.

## SVG Modality (separate from image)

Vector output uses first-class modality `svg`: harness calls a **grammar-constrained**
local engine (Outlines JSON + XML check; see `research/chat2svg-lora/`) which returns
JSON IR; `packages/codec-svg` validates and writes `output.svg`. This does **not**
satisfy the image neural path.

## Research Alignment

The image stack is intentionally closest to a discrete-latent framing:

- the primary image output is visual seed code or VQ-facing hints
- a semantic IR layer may accompany the same output to activate / organize concepts, condition expansion, or feed a second high-quality pass
- a small seed expander / adapter translates compact visual code into fuller decoder-native token grids
- a frozen decoder reconstructs raster bytes

This keeps the architecture aligned with VQ-style tokenization and “decoder not generator” thinking:

- modality-specific complexity is pushed into the codec layer
- the expensive model call stays text-first
- extra multimodal capability is unlocked through local decoders and lightweight adapters
