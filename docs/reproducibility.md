# Reproducibility

Every CLI invocation creates `artifacts/runs/<run-id>/manifest.json`.

## Manifest Fields

- git SHA
- lockfile hash
- Node version
- Wittgenstein version
- command and args
- seed
- codec and route
- provider and model
- prompt raw and prompt expanded
- raw model output and parsed output
- artifact path and artifact hash
- duration, success flag, structured error

When a codec has more than one honest reproducibility class, the manifest carries that too
(for example `audioRender.determinismClass = "byte-parity" | "structural-parity"`). The
manifest is allowed to say "these bytes should match exactly" or "this path is only
structural-parity"; it is not allowed to imply stronger determinism than the backend earned.

## Sibling Files

- `llm-input.txt`
- `llm-output.txt`
- final artifact when rendering succeeds

## Seed Rules

- CLI can pass `--seed`.
- Config can provide `runtime.defaultSeed`.
- The resolved seed is written to the manifest even on failure.

## Training-data sampling lock

The `polyglot-mini` adapter-training data pipeline emits its own deterministic receipt: `polyglot-mini/train/data_manifest.json` records the seed, the requested sample count, the actual write count, the SHA-256 of the produced `data.jsonl`, and the SHA-256 of the canonical (sorted) prompt list. Re-running `build_dataset_coco.py` against the same Karpathy split with the same seed reproduces the same hashes. See `polyglot-mini/train/data_manifest.py` for the helper and Issue #114 for context.

## The manifest spine is Wittgenstein's session contract

Per Brief K §K.1 (ratified by ADR-0017), the manifest spine is functionally the equivalent of [Anthropic Managed Agents](https://www.anthropic.com/engineering/managed-agents)' Brain / Hands / Session split, with the durable append-only **Session** mapping to `artifacts/runs/<id>/manifest.json`:

- **Brain** = the harness (`packages/core/src/runtime/`) — decision loop.
- **Hands** = the codecs (`packages/codec-*`) and `packages/sandbox` — uniform `Codec<Req, Art>.produce` is our `execute(name, input) → string` analog.
- **Session** = manifest spine — append-only durable trace. A first-class replay command
  (`wittgenstein run --manifest <path>`) is still an RFC-0002 / future-CLI surface, not a
  shipped command on `main` yet; the manifest already preserves the durable receipt it would consume.

The mapping is currently **per-run**, not cross-run: each CLI invocation writes one manifest.
Anthropic's `wake(sessionId)` cross-run linkage would require a `parentRunId` field and an
explicit `events[]` slot in the manifest schema; both are deferred to v0.4 per Brief K.
The equivalence above is honest about the gap.

## Why This Exists

The manifest spine is the main quality bar in this scaffold. A failing run is still useful if it leaves a complete trace.
