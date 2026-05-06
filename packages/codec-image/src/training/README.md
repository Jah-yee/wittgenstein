# Adapter Training Recipe

The currently wired trainable seam is **`ImageSceneSpec -> ImageLatentCodes`**
([`packages/codec-image/src/pipeline/adapter.ts`](../pipeline/adapter.ts)).
That remains the scaffold entrypoint, but the doctrine has moved: the preferred
longer-term target is **Visual Seed Code -> ImageLatentCodes**, where a compact
visual seed is expanded into decoder-native latent tokens.

## v1 (shipped)

- **Data**: captioned images under `data/image_adapter/raw/` — see repo root [`data/image_adapter/README.md`](../../../../data/image_adapter/README.md).
- **Scripts**: [`python/image_adapter/`](../../../../python/image_adapter/README.md) — `prepare_dataset.py`, `encode_offline.py`, `train.py`, `eval_metrics.py`.
- **Runtime**: set `WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH` (and optional `WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH`) to exported `adapter_mlp.json` files. Weights are consumed by [`packages/codec-image/src/adapters/mlp-runtime.ts`](../adapters/mlp-runtime.ts) via [`adapter-resolve.ts`](../adapters/adapter-resolve.ts).
- **MiniMax / provider tokens**: if the LLM JSON includes validated `providerLatents`, the adapter is skipped — see [`docs/codecs/image.md`](../../../../docs/codecs/image.md).

## Future

- Keep the current MLP path as a baseline / fallback, not the end-state image story.
- Introduce Visual Seed Code fields (`seedCode`, optional `semantic`, optional `coarseVq`) at the schema boundary before training a stronger adapter.
- Replace the stub offline encoder with a real frozen tokenizer aligned to your decoder family.
- Move from the small MLP to a stronger seed expander / visual-code compiler (still not an end-to-end image generator).

The scaffold still ships without committed weights; generate artifacts locally under `data/image_adapter/artifacts/`.
